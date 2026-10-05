import { clampMaxEntries, mergeEntries, queryEntries } from "./entries";
import { mergeTreatments, queryTreatments } from "./treatments";
import { associateReceipts, createReceptionSummary, isRejectionCategory, recordAcceptance, recordRejection, selectHealthSnapshot, validateReceipts, validateReceptionSummary } from "./reception";
import type {
  CgmEntry,
  EntriesSnapshot,
  EntryQuery,
  Env,
  HealthReceptionSnapshot,
  ReceptionSummary,
  RejectionCategory,
  NightscoutProfileRecord,
  SetupState,
  Treatment,
  TreatmentsSnapshot,
  TreatmentQuery
} from "./types";

const STORAGE_KEY = "entries";
const TREATMENTS_KEY = "treatments";
const PROFILE_KEY = "profile";
const SETUP_KEY = "setup";
const RECEPTION_KEY = "reception-summary";
const RECEIPTS_KEY = "entry-receipts";
const API_SECRET_LENGTH = 6;

export class EntriesDurableObject {
  constructor(
    private readonly ctx: DurableObjectState,
    private readonly env: Env
  ) {}

  async fetch(request: Request): Promise<Response> {
    try {
      return await this.route(request);
    } catch {
      return Response.json({ error: "Internal storage error." }, { status: 500 });
    }
  }

  private async route(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health/snapshot") {
      return Response.json(await this.getHealthSnapshot());
    }

    if (request.method === "POST" && url.pathname === "/reception/rejections") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return new Response("Invalid category", { status: 400 });
      }
      if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 ||
        !isRejectionCategory((body as { category?: unknown }).category)) {
        return new Response("Invalid category", { status: 400 });
      }
      const category = (body as { category: RejectionCategory }).category;
      await this.ctx.storage.transaction(async (txn) => {
        const summary = await this.getReceptionSummary(txn, Date.now());
        await txn.put(RECEPTION_KEY, recordRejection(summary, category));
      });
      return new Response(null, { status: 204 });
    }

    if (request.method === "GET" && url.pathname === "/setup") {
      const state = await this.getSetupState();
      return Response.json(state);
    }

    if (request.method === "POST" && url.pathname === "/setup/bootstrap") {
      const state = await this.bootstrapSetupState();
      return Response.json(state);
    }

    if (request.method === "POST" && url.pathname === "/setup/acknowledge") {
      const { revealToken } = (await request.json()) as { revealToken?: string };
      const acknowledged = await this.acknowledgeReveal(revealToken ?? null);
      return Response.json({ acknowledged });
    }

    if (request.method === "GET" && url.pathname === "/entries") {
      const query = JSON.parse(url.searchParams.get("query") ?? "{}") as EntryQuery;
      const entries = await this.getEntries();
      return Response.json(queryEntries(entries, query));
    }

    if (request.method === "POST" && url.pathname === "/entries") {
      const incoming = (await request.json()) as CgmEntry[];
      const merged = await this.putEntries(incoming);
      return Response.json({
        stored: incoming.length,
        total: merged.length
      });
    }

    if (request.method === "GET" && url.pathname === "/treatments") {
      const query = JSON.parse(url.searchParams.get("query") ?? "{}") as TreatmentQuery;
      const treatments = await this.getTreatments();
      return Response.json(queryTreatments(treatments, query));
    }

    if (request.method === "POST" && url.pathname === "/treatments") {
      const incoming = (await request.json()) as Treatment[];
      const merged = await this.putTreatments(incoming);
      return Response.json({
        stored: incoming.length,
        total: merged.length
      });
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/treatments/")) {
      const treatmentId = decodeURIComponent(url.pathname.slice("/treatments/".length));
      const result = await this.deleteTreatment(treatmentId);
      return Response.json(result);
    }

    if (request.method === "GET" && url.pathname === "/profile/current") {
      const profile = await this.getProfile();
      return Response.json(profile ?? {});
    }

    if (request.method === "GET" && url.pathname === "/profile") {
      const profile = await this.getProfile();
      return Response.json(profile ? [profile] : []);
    }

    if ((request.method === "POST" || request.method === "PUT") && url.pathname === "/profile") {
      const incoming = (await request.json()) as NightscoutProfileRecord;
      const profile = await this.putProfile(incoming);
      return Response.json(profile);
    }

    if (request.method === "GET" && url.pathname === "/snapshot") {
      const snapshot = await this.getSnapshot();
      return Response.json(snapshot);
    }

    if (request.method === "GET" && url.pathname === "/treatments/snapshot") {
      const snapshot = await this.getTreatmentsSnapshot();
      return Response.json(snapshot);
    }

    return new Response("Not found", { status: 404 });
  }

  private async getEntries(): Promise<CgmEntry[]> {
    return (await this.ctx.storage.get<CgmEntry[]>(STORAGE_KEY)) ?? [];
  }

  private async getSetupState(): Promise<SetupState | null> {
    return (await this.ctx.storage.get<SetupState>(SETUP_KEY)) ?? null;
  }

  private async getTreatments(): Promise<Treatment[]> {
    return (await this.ctx.storage.get<Treatment[]>(TREATMENTS_KEY)) ?? [];
  }

  private async getProfile(): Promise<NightscoutProfileRecord | null> {
    return (await this.ctx.storage.get<NightscoutProfileRecord>(PROFILE_KEY)) ?? null;
  }

  private async bootstrapSetupState(): Promise<SetupState> {
    const existing = await this.getSetupState();
    if (existing) {
      return existing;
    }

    const state = {
      apiSecret: createShortApiSecret(),
      revealToken: createRandomSecret()
    } satisfies SetupState;
    await this.ctx.storage.put(SETUP_KEY, state);
    return state;
  }

  private async acknowledgeReveal(revealToken: string | null): Promise<boolean> {
    if (!revealToken) {
      return false;
    }

    const state = await this.getSetupState();
    if (!state || state.revealToken !== revealToken) {
      return false;
    }

    await this.ctx.storage.put(SETUP_KEY, {
      ...state,
      revealToken: null
    } satisfies SetupState);
    return true;
  }

  private async putEntries(incoming: CgmEntry[]): Promise<CgmEntry[]> {
    return this.ctx.storage.transaction(async (txn) => {
      const current = (await txn.get<CgmEntry[]>(STORAGE_KEY)) ?? [];
      const receipts = validateReceipts(await txn.get(RECEIPTS_KEY));
      const at = Date.now();
      const summary = await this.getReceptionSummary(txn, at);
      const merged = mergeEntries(current, incoming, clampMaxEntries(this.env.MAX_ENTRIES));
      await txn.put({
        [STORAGE_KEY]: merged,
        [RECEIPTS_KEY]: associateReceipts(current, incoming, merged, receipts, at),
        [RECEPTION_KEY]: recordAcceptance(summary, "entries", at)
      });
      return merged;
    });
  }

  private async putTreatments(incoming: Treatment[]): Promise<Treatment[]> {
    return this.ctx.storage.transaction(async (txn) => {
      const current = (await txn.get<Treatment[]>(TREATMENTS_KEY)) ?? [];
      const at = Date.now();
      const summary = await this.getReceptionSummary(txn, at);
      const merged = mergeTreatments(current, incoming, clampMaxEntries(this.env.MAX_ENTRIES));
      await txn.put({ [TREATMENTS_KEY]: merged, [RECEPTION_KEY]: recordAcceptance(summary, "treatments", at) });
      return merged;
    });
  }

  private async deleteTreatment(treatmentId: string): Promise<{ status: "ok"; deleted: boolean; _id: string }> {
    const current = await this.getTreatments();
    const remaining = current.filter(
      (treatment) =>
        ![
          treatment._id,
          typeof treatment.identifier === "string" ? treatment.identifier : null,
          typeof treatment.uuid === "string" ? treatment.uuid : null,
          typeof treatment.syncIdentifier === "string" ? treatment.syncIdentifier : null
        ].includes(treatmentId)
    );

    if (remaining.length !== current.length) {
      await this.ctx.storage.put(TREATMENTS_KEY, remaining);
      return { status: "ok", deleted: true, _id: treatmentId };
    }

    return { status: "ok", deleted: false, _id: treatmentId };
  }

  private async putProfile(incoming: NightscoutProfileRecord): Promise<NightscoutProfileRecord> {
    return this.ctx.storage.transaction(async (txn) => {
      const at = Date.now();
      const summary = await this.getReceptionSummary(txn, at);
      await txn.put({ [PROFILE_KEY]: incoming, [RECEPTION_KEY]: recordAcceptance(summary, "profile", at) });
      return incoming;
    });
  }

  private async getReceptionSummary(txn: DurableObjectTransaction, now: number): Promise<ReceptionSummary> {
    const stored = await txn.get(RECEPTION_KEY);
    return stored === undefined ? createReceptionSummary(now) : validateReceptionSummary(stored);
  }

  private async getHealthSnapshot(): Promise<HealthReceptionSnapshot> {
    const stored = await this.ctx.storage.transaction(async (txn) => {
      const entries = (await txn.get<CgmEntry[]>(STORAGE_KEY)) ?? [];
      const receipts = await txn.get(RECEIPTS_KEY);
      const now = Date.now();
      const rawSummary = await txn.get(RECEPTION_KEY);
      const summary = rawSummary === undefined ? createReceptionSummary(now) : rawSummary;
      if (rawSummary === undefined) {
        await txn.put(RECEPTION_KEY, summary);
      }
      return { entries, receipts, summary, now };
    });
    return selectHealthSnapshot(stored.entries, validateReceipts(stored.receipts), validateReceptionSummary(stored.summary), stored.now);
  }

  private async getSnapshot(): Promise<EntriesSnapshot> {
    const entries = await this.getEntries();
    return {
      count: entries.length,
      last: entries[0] ?? null,
      previous: entries[1] ?? null
    };
  }

  private async getTreatmentsSnapshot(): Promise<TreatmentsSnapshot> {
    const treatments = await this.getTreatments();
    const latestWithInsulin =
      treatments.find(
        (treatment) =>
          typeof treatment.insulin === "number" ||
          (typeof treatment.insulin === "string" && treatment.insulin.trim() !== "")
      ) ?? null;

    return {
      count: treatments.length,
      last: latestWithInsulin
    };
  }
}

function createRandomSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createShortApiSecret(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(API_SECRET_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
