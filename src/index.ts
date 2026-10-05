import {
  hasValidSecret,
  optionsResponse,
  requireConfiguredWriteAuth
} from "./auth";
import { EntriesDurableObject } from "./durable-object";
import {
  MAX_REQUEST_BYTES,
  normalizeEntries,
  parseEntryQuery
} from "./entries";
import { renderHealthPage } from "./health";
import { htmlResponse, jsonResponse } from "./responses";
import { normalizeTreatments, parseTreatmentQuery } from "./treatments";
import type {
  CgmEntry,
  Env,
  HealthReceptionSnapshot,
  ReceptionCollection,
  RejectionCategory,
  NightscoutProfileRecord,
  SetupState,
  StatusPayload,
  Treatment,
  TreatmentsSnapshot
} from "./types";

export { EntriesDurableObject };

const APP_NAME = "GlucoEasy";
const APP_VERSION = "0.1.0";
const EMPTY_COLLECTION: unknown[] = [];
const API_BASE_PATHS = new Set(["/api/v1", "/api/v1/"]);
const DEFAULT_HEALTH_REFRESH_SECONDS = 30;

function getHealthLocale(pathname: string): "en" | "es" | null {
  if (pathname === "/health" || pathname === "/setup/acknowledge") {
    return "en";
  }

  if (pathname === "/es/health" || pathname === "/es/setup/acknowledge") {
    return "es";
  }

  return null;
}

function getEntriesStub(env: Env): DurableObjectStub {
  const id = env.ENTRIES_DO.idFromName("global");
  return env.ENTRIES_DO.get(id);
}

function getHealthRefreshSeconds(env: Env): number {
  const raw = Number.parseInt(env.HEALTH_REFRESH_SECONDS ?? "", 10);

  if (!Number.isFinite(raw) || raw < 5) {
    return DEFAULT_HEALTH_REFRESH_SECONDS;
  }

  return raw;
}

async function listEntries(env: Env, query: ReturnType<typeof parseEntryQuery>): Promise<CgmEntry[]> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch(
    `https://entries.internal/entries?query=${encodeURIComponent(JSON.stringify(query))}`
  );
  return (await response.json()) as CgmEntry[];
}

async function storeEntries(env: Env, entries: CgmEntry[]): Promise<{ stored: number; total: number }> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch("https://entries.internal/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entries)
  });

  if (!response.ok) {
    throw new Error("Unable to store upload.");
  }

  return (await response.json()) as { stored: number; total: number };
}

async function getSnapshot(env: Env): Promise<StatusPayload["entries"]> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch("https://entries.internal/snapshot");
  return (await response.json()) as StatusPayload["entries"];
}

async function getTreatmentsSnapshot(env: Env): Promise<TreatmentsSnapshot> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch("https://entries.internal/treatments/snapshot");
  return (await response.json()) as TreatmentsSnapshot;
}

async function getCurrentProfile(env: Env): Promise<NightscoutProfileRecord> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch("https://entries.internal/profile/current");
  return (await response.json()) as NightscoutProfileRecord;
}

async function listProfiles(env: Env): Promise<NightscoutProfileRecord[]> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch("https://entries.internal/profile");
  return (await response.json()) as NightscoutProfileRecord[];
}

async function listTreatments(env: Env, query: ReturnType<typeof parseTreatmentQuery>): Promise<Treatment[]> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch(
    `https://entries.internal/treatments?query=${encodeURIComponent(JSON.stringify(query))}`
  );
  return (await response.json()) as Treatment[];
}

async function storeTreatments(env: Env, treatments: Treatment[]): Promise<{ stored: number; total: number }> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch("https://entries.internal/treatments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(treatments)
  });

  if (!response.ok) {
    throw new Error("Unable to store upload.");
  }

  return (await response.json()) as { stored: number; total: number };
}

async function deleteTreatment(
  env: Env,
  treatmentId: string
): Promise<{ status: "ok"; deleted: boolean; _id: string }> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch(`https://entries.internal/treatments/${encodeURIComponent(treatmentId)}`, {
    method: "DELETE"
  });

  return (await response.json()) as { status: "ok"; deleted: boolean; _id: string };
}

async function storeProfile(env: Env, profile: NightscoutProfileRecord, method: "POST" | "PUT"): Promise<NightscoutProfileRecord> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch("https://entries.internal/profile", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile)
  });

  if (!response.ok) {
    throw new Error("Unable to store upload.");
  }

  return (await response.json()) as NightscoutProfileRecord;
}

async function getSetupState(env: Env): Promise<SetupState | null> {
  if (env.API_SECRET) {
    return {
      apiSecret: env.API_SECRET,
      revealToken: null
    };
  }

  const stub = getEntriesStub(env);
  const response = await stub.fetch("https://entries.internal/setup");
  if (!response.ok) {
    throw new Error("Setup state unavailable.");
  }
  return (await response.json()) as SetupState | null;
}

async function bootstrapSetupState(env: Env): Promise<SetupState> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch("https://entries.internal/setup/bootstrap", {
    method: "POST"
  });
  return (await response.json()) as SetupState;
}

async function acknowledgeSetupState(env: Env, revealToken: string): Promise<boolean> {
  const stub = getEntriesStub(env);
  const response = await stub.fetch("https://entries.internal/setup/acknowledge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ revealToken })
  });
  const payload = (await response.json()) as { acknowledged: boolean };
  return payload.acknowledged;
}

function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie");
  if (!cookie) {
    return null;
  }

  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return rest.join("=") || null;
    }
  }

  return null;
}

function createSetupCookie(token: string): string {
  return `glucoeasy_setup=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`;
}

function clearSetupCookie(): string {
  return "glucoeasy_setup=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}

async function resolveConfiguredSecret(env: Env): Promise<string | null> {
  if (env.API_SECRET) {
    return env.API_SECRET;
  }

  const state = await getSetupState(env);
  return state?.apiSecret ?? null;
}

async function parsePostBody(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    throw new UploadError("payloadTooLarge", "Payload too large.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new UploadError("invalidPayload", "Invalid request body.");
  }
}

class UploadError extends Error {
  constructor(readonly category: RejectionCategory, message: string) {
    super(message);
  }
}

async function rejectUpload(env: Env, collection: ReceptionCollection, category: RejectionCategory, response: Response): Promise<Response> {
  try {
    const result = await getEntriesStub(env).fetch("https://entries.internal/reception/rejections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category })
    });
    if (!result.ok) {
      throw new Error("Diagnostics unavailable.");
    }
  } catch {
    // Recording a rejected request is best effort; never retry or alter its response.
  }
  console.warn("Rejected upload", { collection, category });
  return response;
}

async function handleUpload(request: Request, env: Env, collection: ReceptionCollection): Promise<Response> {
  let expectedSecret: string | null;
  try {
    expectedSecret = await resolveConfiguredSecret(env);
  } catch {
    return rejectUpload(env, collection, "internalFailure", jsonResponse({ error: "Unable to process upload." }, { status: 400 }));
  }
  if (!expectedSecret) {
    return rejectUpload(env, collection, "authentication", jsonResponse(
      { error: "Setup incomplete. Open /health once to generate the API secret." }, { status: 503 }
    ));
  }
  const authError = await requireConfiguredWriteAuth(request, expectedSecret);
  if (authError) {
    return rejectUpload(env, collection, "authentication", authError);
  }
  let phase: "validation" | "storage" = "validation";
  try {
    const body = await parsePostBody(request);
    const normalized = collection === "entries" ? normalizeEntries(body) :
      collection === "treatments" ? normalizeTreatments(body) : body as NightscoutProfileRecord;
    phase = "storage";
    const result = collection === "entries" ? await storeEntries(env, normalized as CgmEntry[]) :
      collection === "treatments" ? await storeTreatments(env, normalized as Treatment[]) :
      await storeProfile(env, normalized as NightscoutProfileRecord, request.method as "POST" | "PUT");
    console.log("Accepted upload", { collection });
    return jsonResponse(result);
  } catch (error) {
    const category = error instanceof UploadError ? error.category : phase === "storage" ? "internalFailure" : "invalidPayload";
    const safeValidationMessages = [
      "Entry must be an object.", "Entry must include a numeric sgv.", "Entry must include date or dateString.",
      "Treatment must be an object.", "Treatment must include created_at, mills, timestamp, date, or dateString."
    ];
    const message = error instanceof UploadError || (phase === "validation" && error instanceof Error && safeValidationMessages.includes(error.message))
      ? (error as Error).message : phase === "storage" ? "Unable to store upload." : "Invalid request body.";
    return rejectUpload(env, collection, category, jsonResponse({ error: message }, { status: 400 }));
  }
}

function isEntriesReadRoute(pathname: string): boolean {
  return [
    "/api/v1/entries",
    "/api/v1/entries.json",
    "/api/v1/entries/sgv",
    "/api/v1/entries/sgv.json",
    "/api/v1/entries/current",
    "/api/v1/entries/current.json"
  ].includes(pathname);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (url.pathname === "/") {
      return Response.redirect(`${url.origin}/health`, 302);
    }

    const healthLocale = getHealthLocale(url.pathname);

    if (request.method === "POST" && (url.pathname === "/setup/acknowledge" || url.pathname === "/es/setup/acknowledge")) {
      const setupState = await getSetupState(env);
      const cookieToken = getCookie(request, "glucoeasy_setup");
      if (!setupState?.revealToken || !cookieToken || cookieToken !== setupState.revealToken) {
        return htmlResponse(
          renderHealthPage({
            latest: null,
            count: 0,
            baseUrl: url.origin,
            setupPending: true
          }, healthLocale ?? "en"),
          {
            status: 403,
            headers: { "Set-Cookie": clearSetupCookie() }
          }
        );
      }

      await acknowledgeSetupState(env, cookieToken);
      return new Response(null, {
        status: 303,
        headers: {
          Location: `${url.origin}${healthLocale === "es" ? "/es/health" : "/health"}`,
          "Set-Cookie": clearSetupCookie()
        }
      });
    }

    if (healthLocale && request.method === "GET" && (url.pathname === "/health" || url.pathname === "/es/health")) {
      let setupState = await getSetupState(env);
      const setupCookie = getCookie(request, "glucoeasy_setup");
      let setCookieHeader: string | null = null;

      if (!env.API_SECRET && !setupState) {
        setupState = await bootstrapSetupState(env);
        setCookieHeader = createSetupCookie(setupState.revealToken ?? "");
      }

      const effectiveSetupToken = setupCookie ?? (setCookieHeader ? setupState?.revealToken ?? null : null);
      const expectedSecret = setupState?.apiSecret ?? env.API_SECRET;
      const authError =
        setupState?.revealToken && effectiveSetupToken === setupState.revealToken
          ? null
          : env.READ_PUBLIC?.toLowerCase() === "true"
            ? null
            : await requireConfiguredWriteAuth(request, expectedSecret);
      if (authError) {
        return authError;
      }

      let reception: HealthReceptionSnapshot | null = null;
      try {
        const response = await getEntriesStub(env).fetch("https://entries.internal/health/snapshot");
        if (response.ok) {
          reception = await response.json() as HealthReceptionSnapshot;
        }
      } catch {
        // Preserve the ordinary page when only diagnostic metadata is unavailable.
      }
      const snapshot = reception ? {
        last: reception.reference, previous: reception.previousReference, count: reception.count
      } : await getSnapshot(env);
      const safeLatest = snapshot.last && snapshot.last.date <= (reception?.evaluatedAt ?? Date.now()) ? snapshot.last : null;
      const safePrevious = snapshot.previous && snapshot.previous.date <= (reception?.evaluatedAt ?? Date.now()) ? snapshot.previous : null;
      const treatmentsSnapshot = await getTreatmentsSnapshot(env);
      return htmlResponse(
        renderHealthPage({
          reception,
          latest: safeLatest,
          latestDelta:
            safeLatest && safePrevious
              ? safeLatest.sgv - safePrevious.sgv
              : null,
          count: snapshot.count,
          latestTreatment: treatmentsSnapshot.last,
          treatmentCount: treatmentsSnapshot.count,
          refreshSeconds: getHealthRefreshSeconds(env),
          baseUrl: url.origin,
          setupSecret:
            setupState?.revealToken && effectiveSetupToken === setupState.revealToken
              ? setupState.apiSecret
              : null,
          setupPending: Boolean(setupState?.revealToken) && effectiveSetupToken !== setupState?.revealToken
        }, healthLocale),
        setCookieHeader ? { headers: { "Set-Cookie": setCookieHeader } } : undefined
      );
    }

    if (url.pathname === "/api/v1/status.json") {
      const expectedSecret = await resolveConfiguredSecret(env);
      const authError =
        env.READ_PUBLIC?.toLowerCase() === "true"
          ? null
          : await requireConfiguredWriteAuth(request, expectedSecret);
      if (authError) {
        return authError;
      }

      const snapshot = await getSnapshot(env);
      const payload: StatusPayload = {
        status: "ok",
        name: APP_NAME,
        version: APP_VERSION,
        serverTime: new Date().toISOString(),
        apiEnabled: true,
        entries: snapshot
      };
      return jsonResponse(payload);
    }

    if (request.method === "GET" && API_BASE_PATHS.has(url.pathname)) {
      return jsonResponse({
        status: "ok",
        name: APP_NAME,
        version: APP_VERSION,
        message: "Nightscout-compatible API base. Use /api/v1/status.json or /api/v1/entries.json.",
        endpoints: {
          status: "/api/v1/status.json",
          entries: "/api/v1/entries.json",
          treatments: "/api/v1/treatments.json",
          health: "/health"
        }
      });
    }

    if (request.method === "POST" && ["/api/v1/treatments", "/api/v1/treatments.json"].includes(url.pathname)) {
      return handleUpload(request, env, "treatments");
    }

    if (request.method === "GET" && ["/api/v1/treatments", "/api/v1/treatments.json"].includes(url.pathname)) {
      const expectedSecret = await resolveConfiguredSecret(env);
      const authError =
        env.READ_PUBLIC?.toLowerCase() === "true"
          ? null
          : await requireConfiguredWriteAuth(request, expectedSecret);
      if (authError) {
        return authError;
      }

      const query = parseTreatmentQuery(url);
      const treatments = await listTreatments(env, query);
      return jsonResponse(treatments);
    }

    if (
      request.method === "DELETE" &&
      (/^\/api\/v1\/treatments\/.+$/.test(url.pathname) || /^\/api\/v1\/treatments\/.+\.json$/.test(url.pathname))
    ) {
      const expectedSecret = await resolveConfiguredSecret(env);
      const debugContext = { collection: "treatments", operation: "delete" };
      if (!expectedSecret) {
        console.warn("Rejected treatment delete: setup incomplete", debugContext);
        return jsonResponse(
          { error: "Setup incomplete. Open /health once to generate the API secret." },
          { status: 503 }
        );
      }

      if (!(await hasValidSecret(request, expectedSecret))) {
        console.warn("Rejected treatment delete: invalid secret", debugContext);
        const authError = await requireConfiguredWriteAuth(request, expectedSecret);
        if (authError) {
          return authError;
        }
      }

      const treatmentId = decodeURIComponent(
        url.pathname
          .replace(/^\/api\/v1\/treatments\//, "")
          .replace(/\.json$/, "")
      );
      const result = await deleteTreatment(env, treatmentId);
      console.log("Processed treatment delete", { ...debugContext, deleted: result.deleted });
      return jsonResponse(result);
    }

    if (request.method === "GET" && ["/api/v1/profile/current", "/api/v1/profile/current.json"].includes(url.pathname)) {
      const expectedSecret = await resolveConfiguredSecret(env);
      const authError =
        env.READ_PUBLIC?.toLowerCase() === "true"
          ? null
          : await requireConfiguredWriteAuth(request, expectedSecret);
      if (authError) {
        return authError;
      }

      const profile = await getCurrentProfile(env);
      return jsonResponse(profile);
    }

    if (request.method === "GET" && ["/api/v1/profile", "/api/v1/profile.json"].includes(url.pathname)) {
      const expectedSecret = await resolveConfiguredSecret(env);
      const authError =
        env.READ_PUBLIC?.toLowerCase() === "true"
          ? null
          : await requireConfiguredWriteAuth(request, expectedSecret);
      if (authError) {
        return authError;
      }

      const profiles = await listProfiles(env);
      return jsonResponse(profiles);
    }

    if (["POST", "PUT"].includes(request.method) && ["/api/v1/profile", "/api/v1/profile.json"].includes(url.pathname)) {
      return handleUpload(request, env, "profile");
    }

    if (request.method === "GET" && ["/api/v1/devicestatus", "/api/v1/devicestatus.json"].includes(url.pathname)) {
      const expectedSecret = await resolveConfiguredSecret(env);
      const authError =
        env.READ_PUBLIC?.toLowerCase() === "true"
          ? null
          : await requireConfiguredWriteAuth(request, expectedSecret);
      if (authError) {
        return authError;
      }

      return jsonResponse(EMPTY_COLLECTION);
    }

    if (request.method === "POST" && ["/api/v1/entries", "/api/v1/entries.json"].includes(url.pathname)) {
      return handleUpload(request, env, "entries");
    }

    if (request.method === "GET" && isEntriesReadRoute(url.pathname)) {
      const expectedSecret = await resolveConfiguredSecret(env);
      const authError =
        env.READ_PUBLIC?.toLowerCase() === "true"
          ? null
          : await requireConfiguredWriteAuth(request, expectedSecret);
      if (authError) {
        return authError;
      }

      const query = parseEntryQuery(
        url,
        url.pathname.includes("/current"),
        url.pathname.includes("/sgv")
      );
      const entries = await listEntries(env, query);
      return jsonResponse(entries);
    }

    return jsonResponse({ error: "Not found" }, { status: 404 });
  }
};
