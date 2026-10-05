import { SELF, env, reset, runInDurableObject, abortAllDurableObjects } from "cloudflare:test";
import worker from "../src/index";
import type { HealthReceptionSnapshot } from "../src/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(async () => {
  await runInDurableObject(receptionStub(), async (_instance, state) => {
    await state.storage.delete(["setup", "entries", "treatments", "profile", "reception-summary", "entry-receipts"]);
  });
});

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  await reset();
});

function receptionStub() {
  return env.ENTRIES_DO.get(env.ENTRIES_DO.idFromName("global"));
}

describe("redesigned health access and setup", () => {
  it.each(["en", "es"] as const)("preserves setup priority and private access in %s", async (locale) => {
    const path = locale === "es" ? "/es/health" : "/health";
    const first = await SELF.fetch(`https://example.com${path}`);
    const cookie = first.headers.get("Set-Cookie")!.split(";", 1)[0];
    const firstHtml = await first.text();
    const secret = firstHtml.match(/<code>([a-z2-9]{6})<\/code>/)![1];
    expect(firstHtml.indexOf('class="panel setup')).toBeLessThan(firstHtml.indexOf('id="latest-reading"'));
    expect(firstHtml).not.toContain("window.setTimeout");
    const publicSetting = env.READ_PUBLIC;
    try {
      env.READ_PUBLIC = "true";
      const other = await SELF.fetch(`https://example.com${path}`);
      const otherHtml = await other.text();
      expect(otherHtml).not.toContain(`<code>${secret}</code>`);
      expect(otherHtml).not.toContain("window.setTimeout");
      await SELF.fetch(`https://example.com${locale === "es" ? "/es" : ""}/setup/acknowledge`, { method: "POST", headers: { Cookie: cookie }, redirect: "manual" });
      const subsequentHtml = await (await SELF.fetch(`https://example.com${path}`)).text();
      expect(subsequentHtml).not.toContain(`<code>${secret}</code>`);
      const ids = ["latest-reading", "latest-treatment", "reception", "service-info"].map((id) => subsequentHtml.indexOf(`id="${id}"`));
      expect(ids.every((index) => index >= 0)).toBe(true);
      expect(ids).toEqual([...ids].sort((a, b) => a - b));
      expect(subsequentHtml).toContain('href="/api/v1/status.json"');
      env.READ_PUBLIC = "false";
      expect((await SELF.fetch(`https://example.com${path}`)).status).toBe(401);
      expect((await SELF.fetch(`https://example.com${path}`, { headers: secretHeader(secret) })).status).toBe(200);
    } finally {
      env.READ_PUBLIC = publicSetting;
    }
  });
});

async function receptionSnapshot(): Promise<HealthReceptionSnapshot> {
  const response = await receptionStub().fetch("https://entries.internal/health/snapshot");
  expect(response.ok).toBe(true);
  return response.json() as Promise<HealthReceptionSnapshot>;
}

describe("reception integration", () => {
  it.each(["entries", "treatments", "profile"] as const)("accepts Basic-auth %s aliases and updates its collection", async (collection) => {
    const { secret } = await initializeSetup();
    const body = collection === "entries" ? { sgv: 123, date: Date.now() } : collection === "treatments" ?
      { eventType: "synthetic", created_at: new Date().toISOString() } : { defaultProfile: "synthetic" };
    const response = await SELF.fetch(`https://example.com/api/v1/${collection}.json`, {
      method: "POST", headers: { Authorization: `Basic ${btoa(`${secret}:`)}`, "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    expect(response.status).toBe(200);
    await response.text();
    expect((await receptionSnapshot()).summary.lastAccepted?.collection).toBe(collection);
  });

  it("serializes concurrent accepted uploads without losing data or moving acceptance backwards", async () => {
    const { secret } = await initializeSetup();
    const start = Date.now();
    const responses = await Promise.all(Array.from({ length: 8 }, (_, index) => postEntries({ sgv: 123, date: start - index * 1000 }, secretHeader(secret))));
    expect(responses.every((response) => response.status === 200)).toBe(true);
    await Promise.all(responses.map((response) => response.text()));
    const snapshot = await receptionSnapshot();
    expect(snapshot.count).toBe(8);
    expect(snapshot.summary.lastAccepted!.at).toBeGreaterThanOrEqual(start);
    expect(snapshot.summary.lastAccepted!.at).toBeLessThanOrEqual(snapshot.evaluatedAt);
  });

  it("starts a guarded new observation epoch without deleting ordinary data", async () => {
    const { secret } = await initializeSetup();
    const date = Date.now() - 1000;
    await postEntries({ sgv: 123, date }, secretHeader(secret));
    await postTreatments({ created_at: new Date(date).toISOString(), eventType: "synthetic" }, secretHeader(secret));
    await postProfile({ defaultProfile: "synthetic" }, secretHeader(secret));
    const ordinary = await runInDurableObject(receptionStub(), async (_instance, state) => {
      return [...await state.storage.get(["entries", "treatments", "profile", "setup"])];
    });
    const maintenance = () => runInDurableObject(receptionStub(), async (_instance, state) => {
      await state.storage.transaction(async (txn) => {
        const epoch = "reception-maintenance-2026-10-05";
        if (await txn.get("reception-maintenance-epoch") !== epoch) {
          await txn.delete(["reception-summary", "entry-receipts"]);
          await txn.put("reception-maintenance-epoch", epoch);
        }
      });
    });
    await maintenance();
    const fresh = await receptionSnapshot();
    expect(fresh.summary.lastAccepted).toBeNull();
    expect(fresh.referenceReceivedAt).toBeNull();
    await postEntries({ sgv: 123, date }, secretHeader(secret));
    const accepted = (await receptionSnapshot()).summary.lastAccepted;
    await maintenance();
    expect((await receptionSnapshot()).summary.lastAccepted).toEqual(accepted);
    await runInDurableObject(receptionStub(), async (_instance, state) => {
      expect([...await state.storage.get(["entries", "treatments", "profile", "setup"])]).toEqual(ordinary);
    });
  });

  it("records setup-incomplete rejection without reading or saving the body", async () => {
    const response = await postEntries({ marker: "synthetic-private-body" }, {});
    expect(response.status).toBe(503);
    expect((await receptionSnapshot()).summary.rejected.authentication).toBe(1);
    expect((await receptionSnapshot()).summary.lastAccepted).toBeNull();
  });

  it("prunes receipt metadata to retained readings and keeps future-only health distinct from empty", async () => {
    const { secret } = await initializeSetup();
    const now = Date.now();
    const readings = Array.from({ length: 2001 }, (_, index) => ({ sgv: 123, date: now + 600000 + index }));
    expect((await postEntries(readings, secretHeader(secret))).status).toBe(200);
    const snapshot = await receptionSnapshot();
    expect(snapshot.count).toBe(2000);
    expect(snapshot.futureCount).toBe(2000);
    expect(snapshot.reference).toBeNull();
    await runInDurableObject(receptionStub(), async (_instance, state) => {
      const receipts = await state.storage.get<Record<string, number | null>>("entry-receipts");
      expect(Object.keys(receipts!).length).toBe(2000);
      expect(receipts![String(now + 600000)]).toBeUndefined();
    });
    const html = await (await SELF.fetch("https://example.com/health", { headers: secretHeader(secret) })).text();
    expect(html).toContain("Only future timestamps");
    expect(html).not.toContain("No readings received yet");
  });

  it("preserves the rejected response when recording diagnostics fails", async () => {
    const { secret } = await initializeSetup();
    await runInDurableObject(receptionStub(), async (_instance, state) => {
      await state.storage.put("reception-summary", { broken: true });
    });
    const response = await postEntries({}, { "api-secret": "incorrect-synthetic" });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    await runInDurableObject(receptionStub(), async (_instance, state) => {
      expect(await state.storage.get("reception-summary")).toEqual({ broken: true });
      await state.storage.delete("reception-summary");
    });
    expect((await SELF.fetch("https://example.com/es/health", { headers: secretHeader(secret) })).status).toBe(200);
  });

  it("records acceptance separately from old reading age and preserves duplicate receipt", async () => {
    const { secret } = await initializeSetup();
    const date = Date.now() - 7200000;
    await postEntries({ _id: "synthetic-reading", sgv: 123, date }, secretHeader(secret));
    const first = await receptionSnapshot();
    expect(first.summary.lastAccepted?.collection).toBe("entries");
    expect(first.referenceReceivedAt! - date).toBeGreaterThanOrEqual(7200000);
    await postEntries({ _id: "synthetic-reading", sgv: 124, date }, secretHeader(secret));
    expect((await receptionSnapshot()).referenceReceivedAt).toBe(first.referenceReceivedAt);
    for (const path of ["/health", "/es/health"]) {
      const html = await (await SELF.fetch(`https://example.com${path}`, { headers: secretHeader(secret) })).text();
      expect(html).toContain(path === "/health" ? "Old reading" : "Lectura antigua");
      expect(html).toContain(new Date(date).toISOString());
    }
    await postProfile({ defaultProfile: "synthetic" }, secretHeader(secret), "PUT");
    expect((await receptionSnapshot()).summary.lastAccepted?.collection).toBe("profile");
    expect((await receptionSnapshot()).referenceReceivedAt).toBe(first.referenceReceivedAt);
  });

  it("preserves unknown legacy receipts and diagnostics through a real instance restart", async () => {
    const { secret } = await initializeSetup();
    const date = Date.now() - 1000;
    await runInDurableObject(receptionStub(), async (_instance, state) => {
      await state.storage.put("entries", [{ _id: "legacy", sgv: 123, date, dateString: new Date(date).toISOString(), type: "sgv" }]);
    });
    expect((await receptionSnapshot()).referenceReceivedAt).toBeNull();
    await postEntries({ _id: "legacy", sgv: 123, date }, secretHeader(secret));
    const before = await receptionSnapshot();
    expect(before.referenceReceivedAt).toBeNull();
    await abortAllDurableObjects();
    const after = await receptionSnapshot();
    expect(after.summary).toEqual(before.summary);
    expect(after.referenceReceivedAt).toBeNull();
  });

  it("keeps future readings in API while health chooses valid references and delta", async () => {
    const { secret } = await initializeSetup();
    const now = Date.now();
    await postEntries([{ sgv: 999, date: now + 600000 }, { sgv: 123, date: now - 1000 }, { sgv: 120, date: now - 2000 }], secretHeader(secret));
    const snapshot = await receptionSnapshot();
    expect(snapshot.futureCount).toBe(1);
    expect(snapshot.reference?.sgv).toBe(123);
    const html = await (await SELF.fetch("https://example.com/health", { headers: secretHeader(secret) })).text();
    expect(html).toContain("Future timestamps: 1");
    expect(html).toContain('class="reading-delta is-up">+3<');
    const status = await (await SELF.fetch("https://example.com/api/v1/status.json", { headers: secretHeader(secret) })).json() as Record<string, unknown> & { entries: { last: { sgv: number } } };
    expect(Object.keys(status).sort()).toEqual(["status", "name", "version", "serverTime", "apiEnabled", "entries"].sort());
    expect(status.entries.last.sgv).toBe(999);
    expect(JSON.stringify(status)).not.toContain("referenceReceivedAt");
  });

  it("counts twenty concurrent rejected requests once and excludes reads, deletes and accepted empty batches", async () => {
    const { secret } = await initializeSetup();
    await postEntries([], secretHeader(secret));
    const accepted = (await receptionSnapshot()).summary.lastAccepted;
    const responses = await Promise.all(Array.from({ length: 20 }, () => postEntries({ sgv: 123, date: Date.now() }, { "api-secret": "wrong-synthetic" })));
    expect(responses.every((response) => response.status === 401)).toBe(true);
    await SELF.fetch("https://example.com/api/v1/entries.json", { headers: secretHeader(secret) });
    await deleteTreatment("synthetic-missing", secretHeader(secret));
    const snapshot = await receptionSnapshot();
    expect(snapshot.summary.rejected).toEqual({ authentication: 20, payloadTooLarge: 0, invalidPayload: 0, internalFailure: 0 });
    expect(snapshot.summary.lastAccepted).toEqual(accepted);
  });

  it("classifies invalid JSON, oversized bodies and all-or-nothing invalid batches with safe errors", async () => {
    const { secret } = await initializeSetup();
    const before = (await receptionSnapshot()).summary.lastAccepted;
    const headers = { ...secretHeader(secret), "Content-Type": "application/json" };
    const malformed = await SELF.fetch("https://example.com/api/v1/entries", { method: "POST", headers, body: '{"private-payload-marker"' });
    expect(malformed.status).toBe(400);
    expect(await malformed.text()).not.toContain("private-payload-marker");
    expect((await SELF.fetch("https://example.com/api/v1/entries.json", { method: "POST", headers, body: "x".repeat(256 * 1024 + 1) })).status).toBe(400);
    expect((await postEntries([{ sgv: 123, date: Date.now() }, { sgv: "bad" }], secretHeader(secret))).status).toBe(400);
    const snapshot = await receptionSnapshot();
    expect(snapshot.count).toBe(0);
    expect(snapshot.summary.lastAccepted).toEqual(before);
    expect(snapshot.summary.rejected).toMatchObject({ invalidPayload: 2, payloadTooLarge: 1 });
  });

  it("does not reveal diagnostics on private pages and preserves public access as configured", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);
    const privateResponse = await SELF.fetch("https://example.com/es/health");
    expect(privateResponse.status).toBe(401);
    expect(await privateResponse.text()).not.toContain("Observado desde");
    const response = await worker.fetch(new Request("https://example.com/es/health"), { ...env, READ_PUBLIC: "true" });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Diagnóstico de recepción");
    expect((await SELF.fetch("https://example.com/reception/rejections", { method: "POST", body: '{}' })).status).toBe(404);
    expect((await SELF.fetch("https://example.com/health/snapshot", { headers: secretHeader(secret) })).status).toBe(404);
  });

  it("rejects invalid internal categories and retains corrupt metadata without silently resetting it", async () => {
    const { secret } = await initializeSetup();
    expect((await receptionStub().fetch("https://entries.internal/reception/rejections", { method: "POST", body: '{"category":"authentication","extra":"marker"}' })).status).toBe(400);
    await runInDurableObject(receptionStub(), async (_instance, state) => {
      await state.storage.put("reception-summary", { broken: "synthetic" });
    });
    const response = await SELF.fetch("https://example.com/health", { headers: secretHeader(secret) });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Reception diagnostics unavailable");
    await runInDurableObject(receptionStub(), async (_instance, state) => {
      expect(await state.storage.get("reception-summary")).toEqual({ broken: "synthetic" });
      await state.storage.delete("reception-summary");
    });
  });

  it("does not log credentials, headers, client identities or profile content", async () => {
    const { secret } = await initializeSetup();
    const log = vi.spyOn(console, "log");
    const warn = vi.spyOn(console, "warn");
    await postProfile({ defaultProfile: "private-profile-marker" }, { ...secretHeader(secret), "User-Agent": "private-agent-marker" });
    await postEntries({ _id: "private-id-marker", sgv: 123, date: Date.now() }, secretHeader(secret));
    await postEntries({}, { "api-secret": "private-credential-marker" });
    const logs = JSON.stringify([...log.mock.calls, ...warn.mock.calls]);
    for (const marker of [secret, "private-profile-marker", "private-agent-marker", "private-id-marker", "private-credential-marker"]) {
      expect(logs).not.toContain(marker);
    }
    await runInDurableObject(receptionStub(), async (_instance, state) => {
      const metadata = JSON.stringify([await state.storage.get("reception-summary"), await state.storage.get("entry-receipts")]);
      expect(metadata).not.toContain("private-");
      expect(metadata).not.toContain("sgv");
    });
  });

  it("rolls back data and acceptance together and records storage failure only when possible", async () => {
    const { secret } = await initializeSetup();
    await runInDurableObject(receptionStub(), async (_instance, state) => {
      const original = state.storage.transaction.bind(state.storage);
      vi.spyOn(state.storage, "transaction").mockImplementation((callback) => original(async (txn) => {
        const originalPut = txn.put.bind(txn);
        vi.spyOn(txn, "put").mockImplementation(async (...args: unknown[]) => {
          if (args.length === 1 && args[0] && typeof args[0] === "object" && "entries" in args[0]) {
            await originalPut(args[0] as Record<string, unknown>);
            throw new Error("private-storage-marker");
          }
          return (originalPut as (...values: unknown[]) => Promise<void>)(...args);
        });
        return callback(txn);
      }));
    });
    const response = await postEntries({ sgv: 123, date: Date.now() }, secretHeader(secret));
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain("private-storage-marker");
    vi.restoreAllMocks();
    const snapshot = await receptionSnapshot();
    expect(snapshot.count).toBe(0);
    expect(snapshot.summary.lastAccepted).toBeNull();
    expect(snapshot.summary.rejected.internalFailure).toBe(1);
  });
});

async function initializeSetup(): Promise<{ secret: string; cookie: string }> {
  const response = await SELF.fetch("https://example.com/health");
  expect(response.status).toBe(200);

  const cookie = response.headers.get("Set-Cookie");
  expect(cookie).toContain("glucoeasy_setup=");

  const html = await response.text();
  const secretMatch = html.match(/<code>([a-z2-9]{6})<\/code>/);
  expect(secretMatch?.[1]).toBeTruthy();

  return {
    secret: secretMatch![1],
    cookie: cookie!.split(";", 1)[0]
  };
}

async function acknowledgeSetup(cookie: string) {
  const response = await SELF.fetch("https://example.com/setup/acknowledge", {
    method: "POST",
    headers: { Cookie: cookie },
    redirect: "manual"
  });
  expect(response.status).toBe(303);
}

function secretHeader(secret: string): HeadersInit {
  return { "api-secret": secret };
}

async function sha1(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function postEntries(body: unknown, headers: HeadersInit) {
  return SELF.fetch("https://example.com/api/v1/entries.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
}

async function postTreatments(body: unknown, headers: HeadersInit) {
  return SELF.fetch("https://example.com/api/v1/treatments.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
}

async function deleteTreatment(id: string, headers: HeadersInit) {
  return SELF.fetch(`https://example.com/api/v1/treatments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers
  });
}

async function postProfile(body: unknown, headers: HeadersInit, method: "POST" | "PUT" = "POST") {
  return SELF.fetch("https://example.com/api/v1/profile", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
}

describe("api", () => {
  it("generates the setup secret on first health visit and reveals it once", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    const secondResponse = await SELF.fetch("https://example.com/health", {
      headers: secretHeader(secret)
    });
    expect(secondResponse.status).toBe(200);
    const secondHtml = await secondResponse.text();
    expect(secondHtml).not.toContain(secret);

    const postResponse = await postEntries(
      { sgv: 143, date: 2781111111111 },
      secretHeader(secret)
    );
    expect(postResponse.status).toBe(200);
  });

  it("rejects POST without API secret", async () => {
    const { cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    const response = await SELF.fetch("https://example.com/api/v1/entries.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sgv: 143, date: 1781111111111 })
    });

    expect(response.status).toBe(401);
  });

  it("accepts xDrip-style SHA1 api-secret headers", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    const response = await postEntries(
      { sgv: 143, date: 2781111111111 },
      secretHeader(await sha1(secret))
    );

    expect(response.status).toBe(200);
  });

  it("accepts single-object POST and returns current entry", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    const postResponse = await postEntries({
      sgv: 143,
      date: 2781111111111,
      direction: "Flat",
      type: "sgv",
      device: "xDrip"
    }, secretHeader(secret));

    expect(postResponse.status).toBe(200);

    const currentResponse = await SELF.fetch(
      "https://example.com/api/v1/entries/current.json",
      { headers: secretHeader(secret) }
    );
    expect(currentResponse.status).toBe(200);

    const current = (await currentResponse.json()) as Array<{ sgv: number }>;
    expect(current).toHaveLength(1);
    expect(current[0].sgv).toBe(143);
  });

  it("accepts arrays, deduplicates, and limits count", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    await postEntries([
      { sgv: 140, date: 1781111112112, type: "sgv" },
      { sgv: 141, date: 1781111112113, type: "sgv" },
      { sgv: 141, date: 1781111112113, type: "sgv" }
    ], secretHeader(secret));

    const response = await SELF.fetch(
      "https://example.com/api/v1/entries.json?count=2",
      { headers: secretHeader(secret) }
    );

    const entries = (await response.json()) as Array<{ date: number }>;
    expect(entries).toHaveLength(2);
    expect(entries[0].date).toBeGreaterThan(entries[1].date);
  });

  it("filters sgv entries and date ranges", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    await postEntries([
      { sgv: 120, date: 1781111113100, type: "mbg" },
      { sgv: 121, date: 1781111113200, type: "sgv" },
      { sgv: 122, date: 1781111113300, type: "sgv" }
    ], secretHeader(secret));

    const response = await SELF.fetch(
      "https://example.com/api/v1/entries/sgv.json?find[date][$gte]=1781111113250",
      { headers: secretHeader(secret) }
    );

    const entries = (await response.json()) as Array<{ date: number; type: string }>;
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("sgv");
    expect(entries[0].date).toBe(1781111113300);
  });

  it("stores and queries treatments", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    const postResponse = await postTreatments([
      {
        eventType: "Carb Correction",
        created_at: "2026-06-10T20:00:00.000Z",
        carbs: 12,
        notes: "Juice"
      },
      {
        eventType: "Correction Bolus",
        created_at: "2026-06-10T20:05:00.000Z",
        insulin: 1.2,
        enteredBy: "xDrip"
      }
    ], secretHeader(secret));

    expect(postResponse.status).toBe(200);

    const treatmentsResponse = await SELF.fetch(
      "https://example.com/api/v1/treatments.json?count=1&find[eventType]=Correction%20Bolus&find[mills][$gte]=1781120000000",
      { headers: secretHeader(secret) }
    );
    expect(treatmentsResponse.status).toBe(200);

    const treatments = (await treatmentsResponse.json()) as Array<{ eventType: string; mills: number }>;
    expect(treatments).toHaveLength(1);
    expect(treatments[0].eventType).toBe("Correction Bolus");
    expect(treatments[0].mills).toBe(1781121900000);
  });

  it("returns only treatments from the last 24 hours by default", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:00:00.000Z"));

    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    await postTreatments([
      {
        eventType: "Correction Bolus",
        created_at: "2026-06-10T13:00:00.000Z",
        insulin: 1.5
      },
      {
        eventType: "Correction Bolus",
        created_at: "2026-06-10T11:00:00.000Z",
        insulin: 1.1
      }
    ], secretHeader(secret));

    const treatmentsResponse = await SELF.fetch(
      "https://example.com/api/v1/treatments.json",
      { headers: secretHeader(secret) }
    );
    expect(treatmentsResponse.status).toBe(200);

    const treatments = (await treatmentsResponse.json()) as Array<{ created_at: string }>;
    expect(treatments).toHaveLength(1);
    expect(treatments[0].created_at).toBe("2026-06-10T13:00:00.000Z");
  });

  it("supports idempotent treatment deletes for tconnectsync", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    const treatmentId = "1781556330000:Sleep:Pump (tconnectsync):Sleep (Scheduled) - Not Ended";

    await postTreatments({
      _id: treatmentId,
      eventType: "Sleep",
      created_at: "2026-06-15T20:45:30.000Z",
      enteredBy: "Pump (tconnectsync)",
      notes: "Sleep (Scheduled) - Not Ended"
    }, secretHeader(secret));

    const firstDelete = await deleteTreatment(treatmentId, secretHeader(secret));
    expect(firstDelete.status).toBe(200);
    expect(await firstDelete.json()).toEqual({
      status: "ok",
      deleted: true,
      _id: treatmentId
    });

    const secondDelete = await deleteTreatment(treatmentId, secretHeader(secret));
    expect(secondDelete.status).toBe(200);
    expect(await secondDelete.json()).toEqual({
      status: "ok",
      deleted: false,
      _id: treatmentId
    });
  });

  it("returns status and compatibility endpoints", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    const statusResponse = await SELF.fetch("https://example.com/api/v1/status.json", {
      headers: secretHeader(secret)
    });
    expect(statusResponse.status).toBe(200);
    const status = (await statusResponse.json()) as { status: string; entries: { count: number } };
    expect(status.status).toBe("ok");
    expect(typeof status.entries.count).toBe("number");

    const treatmentsResponse = await SELF.fetch("https://example.com/api/v1/treatments", {
      headers: secretHeader(secret)
    });
    expect(await treatmentsResponse.json()).toEqual([]);
  });

  it("shows the delta between the latest reading and the previous one on health", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    await postEntries([
      { sgv: 145, date: 1781111113200, direction: "Flat", type: "sgv" },
      { sgv: 138, date: 1781111113100, direction: "Flat", type: "sgv" }
    ], secretHeader(secret));

    const response = await SELF.fetch("https://example.com/health", {
      headers: secretHeader(secret)
    });

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('class="reading-delta is-up">+7<');
  });

  it("supports Nightscout profile current and profile writes for tconnectsync", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    const emptyCurrentResponse = await SELF.fetch("https://example.com/api/v1/profile/current", {
      headers: secretHeader(secret)
    });
    expect(emptyCurrentResponse.status).toBe(200);
    expect(await emptyCurrentResponse.json()).toEqual({});

    const profilePayload = {
      defaultProfile: "Verano",
      enteredBy: "Pump (tconnectsync)",
      startDate: "2026-06-15T08:00:00.000Z",
      created_at: "2026-06-15T08:00:00.000Z",
      store: {
        Verano: {
          dia: "5",
          basal: [{ time: "00:00", timeAsSeconds: 0, value: 0.18 }],
          sens: [{ time: "00:00", timeAsSeconds: 0, value: 180 }],
          carbratio: [{ time: "00:00", timeAsSeconds: 0, value: 25 }],
          target_low: [{ time: "00:00", timeAsSeconds: 0, value: 120 }],
          target_high: [{ time: "00:00", timeAsSeconds: 0, value: 120 }],
          units: "mg/dl",
          timezone: "Europe/Madrid"
        }
      }
    };

    const postResponse = await postProfile(profilePayload, secretHeader(secret));
    expect(postResponse.status).toBe(200);

    const currentResponse = await SELF.fetch("https://example.com/api/v1/profile/current?api_secret=test", {
      headers: secretHeader(await sha1(secret))
    });
    expect(currentResponse.status).toBe(200);
    const currentProfile = await currentResponse.json();
    expect(currentProfile).toMatchObject({
      defaultProfile: "Verano",
      enteredBy: "Pump (tconnectsync)"
    });

    const listResponse = await SELF.fetch("https://example.com/api/v1/profile.json", {
      headers: secretHeader(secret)
    });
    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toEqual([profilePayload]);
  });

  it("returns a helpful payload for the api base path", async () => {
    const response = await SELF.fetch("https://example.com/api/v1");
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      status: string;
      endpoints: { status: string; entries: string };
      message: string;
    };

    expect(payload.status).toBe("ok");
    expect(payload.message).toContain("Nightscout-compatible API base");
    expect(payload.endpoints.status).toBe("/api/v1/status.json");
    expect(payload.endpoints.entries).toBe("/api/v1/entries.json");
  });

  it("renders the health page", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);
    env.HEALTH_REFRESH_SECONDS = "45";

    await postEntries({ sgv: 143, date: 1781111111111 }, secretHeader(secret));
    await postTreatments(
      {
        eventType: "Correction Bolus",
        created_at: "2026-06-10T20:05:00.000Z",
        insulin: 1.2,
        notes: "Test bolus"
      },
      secretHeader(secret)
    );

    const response = await SELF.fetch("https://example.com/health", {
      headers: secretHeader(secret)
    });

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("GlucoEasy");
    expect(html).toContain("Latest treatment");
    expect(html).toContain("Correction Bolus");
    expect(html).toContain('class="reading treatment-reading">1.2 <span>U</span>');
    expect(html).toContain("Treatment age:");
    expect(html).toContain("View status data");
    expect(html).toContain("window.setTimeout(() =>");
    expect(html).toContain("window.location.reload()");
    expect(html).toContain("45000");
  });

  it("renders the latest treatment with insulin on the health page", async () => {
    const { secret, cookie } = await initializeSetup();
    await acknowledgeSetup(cookie);

    await postTreatments(
      [
        {
          eventType: "Site Change",
          created_at: "2026-06-10T20:10:00.000Z",
          notes: "No insulin here"
        },
        {
          eventType: "Correction Bolus",
          created_at: "2026-06-10T20:05:00.000Z",
          insulin: 1.2,
          notes: "Last insulin treatment"
        },
        {
          eventType: "Carb Correction",
          created_at: "2026-06-10T20:00:00.000Z",
          carbs: 12
        }
      ],
      secretHeader(secret)
    );

    const response = await SELF.fetch("https://example.com/health", {
      headers: secretHeader(secret)
    });

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Latest treatment");
    expect(html).toContain("Correction Bolus");
    expect(html).toContain('class="reading treatment-reading">1.2 <span>U</span>');
    expect(html).toContain("Treatment age:");
    expect(html).not.toContain("Site Change");
  });

  it("renders the spanish health page", async () => {
    const setupResponse = await SELF.fetch("https://example.com/es/health");
    expect(setupResponse.status).toBe(200);
    const setupCookie = setupResponse.headers.get("Set-Cookie");
    expect(setupCookie).toContain("glucoeasy_setup=");
    const setupHtml = await setupResponse.text();
    expect(setupHtml).toContain('<html lang="es">');
    expect(setupHtml).toContain("Configuración completada");
    expect(setupHtml).toContain('action="/es/setup/acknowledge"');
    const secretMatch = setupHtml.match(/<code>([a-z2-9]{6})<\/code>/);
    expect(secretMatch?.[1]).toBeTruthy();
    const secret = secretMatch![1];

    const acknowledgeResponse = await SELF.fetch("https://example.com/es/setup/acknowledge", {
      method: "POST",
      headers: { Cookie: setupCookie!.split(";", 1)[0] },
      redirect: "manual"
    });
    expect(acknowledgeResponse.status).toBe(303);
    expect(acknowledgeResponse.headers.get("Location")).toBe("https://example.com/es/health");

    await postEntries({ sgv: 143, date: 1781111111111 }, secretHeader(secret));
    await postTreatments(
      {
        eventType: "Correction Bolus",
        created_at: "2026-06-10T20:05:00.000Z",
        insulin: 1.2,
        notes: "Test bolus"
      },
      secretHeader(secret)
    );

    const response = await SELF.fetch("https://example.com/es/health", {
      headers: secretHeader(secret)
    });

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("GlucoEasy");
    expect(html).toContain("Último tratamiento");
    expect(html).toContain("Ver datos de estado");
    expect(html).toContain('class="reading treatment-reading">1.2 <span>U</span>');
    expect(html).toContain("Antigüedad de tratamiento:");
  });
});
