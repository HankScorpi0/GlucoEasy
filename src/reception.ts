import type { CgmEntry, EntryReceipts, HealthReceptionSnapshot, ReceptionCollection, ReceptionEvaluation, RejectionCategory, ReceptionSummary } from "./types";

export const REJECTION_CATEGORIES: readonly RejectionCategory[] = [
  "authentication", "payloadTooLarge", "invalidPayload", "internalFailure"
];

export function isRejectionCategory(value: unknown): value is RejectionCategory {
  return typeof value === "string" && REJECTION_CATEGORIES.includes(value as RejectionCategory);
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isFinite(new Date(value).getTime());
}

export function createReceptionSummary(now: number): ReceptionSummary {
  return {
    version: 1,
    observedSince: now,
    lastAccepted: null,
    rejected: { authentication: 0, payloadTooLarge: 0, invalidPayload: 0, internalFailure: 0 },
    saturated: { authentication: false, payloadTooLarge: false, invalidPayload: false, internalFailure: false }
  };
}

export function validateReceptionSummary(value: unknown): ReceptionSummary {
  const summary = value as ReceptionSummary | null;
  if (!summary || summary.version !== 1 || !isTimestamp(summary.observedSince) ||
    !summary.rejected || !summary.saturated ||
    !REJECTION_CATEGORIES.every((category) => Number.isSafeInteger(summary.rejected[category]) &&
      summary.rejected[category] >= 0 && typeof summary.saturated[category] === "boolean") ||
    (summary.lastAccepted !== null && (!summary.lastAccepted || !isTimestamp(summary.lastAccepted.at) ||
      !["entries", "treatments", "profile"].includes(summary.lastAccepted.collection)))) {
    throw new Error("Reception diagnostics unavailable.");
  }
  return summary;
}

export function validateReceipts(value: unknown): EntryReceipts {
  if (value === undefined) {
    return {};
  }
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    !Object.entries(value).every(([date, receipt]) => isTimestamp(Number(date)) &&
      (receipt === null || isTimestamp(receipt)))) {
    throw new Error("Reception diagnostics unavailable.");
  }
  return value as EntryReceipts;
}

export function recordAcceptance(summary: ReceptionSummary, collection: ReceptionCollection, at: number): ReceptionSummary {
  if (summary.lastAccepted && summary.lastAccepted.at >= at) {
    return summary;
  }
  return { ...summary, lastAccepted: { at, collection } };
}

export function recordRejection(summary: ReceptionSummary, category: RejectionCategory): ReceptionSummary {
  const count = summary.rejected[category];
  return {
    ...summary,
    rejected: { ...summary.rejected, [category]: Math.min(Number.MAX_SAFE_INTEGER, count + 1) },
    saturated: { ...summary.saturated, [category]: summary.saturated[category] || count >= Number.MAX_SAFE_INTEGER - 1 }
  };
}

export function associateReceipts(
  existing: CgmEntry[], incoming: CgmEntry[], merged: CgmEntry[], receipts: EntryReceipts, at: number
): EntryReceipts {
  const byId = new Map(existing.map((item) => [item._id, item]));
  const byDate = new Map(existing.map((item) => [item.date, item]));
  const provenance = new Map<CgmEntry, number | null>();
  for (const item of incoming) {
    const matches = [byId.get(item._id), byDate.get(item.date)].filter((match): match is CgmEntry => Boolean(match));
    const known = matches.map((match) => receipts[String(match.date)] ?? null);
    provenance.set(item, known.length === 0 ? at : known.some((date) => date === null) ? null : Math.min(...known as number[]));
  }
  const result: EntryReceipts = {};
  for (const item of merged) {
    result[String(item.date)] = provenance.has(item) ? provenance.get(item)! : receipts[String(item.date)] ?? null;
  }
  return result;
}

export function selectHealthSnapshot(
  entries: CgmEntry[], receipts: EntryReceipts, summary: ReceptionSummary, evaluatedAt: number
): HealthReceptionSnapshot {
  let reference: CgmEntry | null = null;
  let previousReference: CgmEntry | null = null;
  let futureCount = 0;
  for (const item of entries) {
    if (item.date > evaluatedAt) {
      futureCount++;
    } else if (!reference || item.date > reference.date) {
      previousReference = reference;
      reference = item;
    } else if (!previousReference || item.date > previousReference.date) {
      previousReference = item;
    }
  }
  return {
    evaluatedAt,
    count: entries.length,
    futureCount,
    reference,
    previousReference,
    referenceReceivedAt: reference ? receipts[String(reference.date)] ?? null : null,
    summary
  };
}

export function evaluateReception(snapshot: HealthReceptionSnapshot, refreshMs: number): ReceptionEvaluation {
  const thresholdMs = Math.max(300000, refreshMs * 2);
  const readingAgeMs = snapshot.reference ? snapshot.evaluatedAt - snapshot.reference.date : null;
  let rejectionTotal = 0;
  let totalSaturated = false;
  for (const category of REJECTION_CATEGORIES) {
    const count = snapshot.summary.rejected[category];
    totalSaturated ||= snapshot.summary.saturated[category] || count > Number.MAX_SAFE_INTEGER - rejectionTotal;
    rejectionTotal = Math.min(Number.MAX_SAFE_INTEGER, rejectionTotal + count);
  }
  return {
    thresholdMs,
    readingAgeMs,
    readingState: snapshot.count === 0 ? "empty" : readingAgeMs === null ? "futureOnly" : readingAgeMs <= thresholdMs ? "recent" : "stale",
    receptionDelayMs: snapshot.reference && snapshot.referenceReceivedAt !== null ? snapshot.referenceReceivedAt - snapshot.reference.date : null,
    acceptedAgeMs: snapshot.summary.lastAccepted ? snapshot.evaluatedAt - snapshot.summary.lastAccepted.at : null,
    rejectionTotal,
    totalSaturated
  };
}
