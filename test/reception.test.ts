import { describe, expect, it } from "vitest";
import { mergeEntries, normalizeEntry } from "../src/entries";
import { associateReceipts, createReceptionSummary, evaluateReception, recordAcceptance, recordRejection, selectHealthSnapshot, validateReceptionSummary } from "../src/reception";

const entry = (id: string, date: number) => normalizeEntry({ _id: id, date, sgv: 123 });

describe("reception provenance", () => {
  it("preserves known and legacy receipts by either identity and prunes retention", () => {
    const existing = [entry("a", 2000), entry("b", 1000)];
    const incoming = [entry("a", 3000), entry("other", 1000), entry("new", 4000)];
    const merged = mergeEntries(existing, incoming, 2);
    expect(associateReceipts(existing, incoming, merged, { "2000": 2200 }, 5000)).toEqual({ "3000": 2200, "4000": 5000 });
    expect(associateReceipts(existing, incoming, mergeEntries(existing, incoming, 10), { "2000": 2200 }, 5000)["1000"]).toBeNull();
  });
  it("uses unknown provenance conservatively on collisions and starts anew after eviction", () => {
    const existing = [entry("a", 2000), entry("b", 1000)];
    const incoming = [entry("a", 1000)];
    expect(associateReceipts(existing, incoming, mergeEntries(existing, incoming, 10), { "2000": 2200 }, 5000)["1000"]).toBeNull();
    expect(associateReceipts([], incoming, incoming, {}, 6000)).toEqual({ "1000": 6000 });
  });
  it("keeps duplicate uploads from changing first receipt and does not copy client fields", () => {
    const current = [entry("private-marker", 1000)];
    const receipts = associateReceipts([], current, current, {}, 2000);
    expect(associateReceipts(current, current, current, receipts, 3000)).toEqual(receipts);
    expect(JSON.stringify(receipts)).not.toContain("private-marker");
  });
});

describe("reception time and counters", () => {
  it("excludes future readings, respects exact boundaries and retains signed delays", () => {
    const now = 1000000;
    const summary = createReceptionSummary(now);
    const snapshot = selectHealthSnapshot([entry("future", now + 1), entry("valid", now - 300000)], { [now - 300000]: now - 400000 }, summary, now);
    expect(snapshot.futureCount).toBe(1);
    expect(snapshot.reference?._id).toBe("valid");
    expect(evaluateReception(snapshot, 30000)).toMatchObject({ readingState: "recent", receptionDelayMs: -100000 });
    expect(evaluateReception({ ...snapshot, evaluatedAt: now + 1 }, 30000).readingState).toBe("stale");
    expect(evaluateReception(selectHealthSnapshot([entry("f", now + 1)], {}, summary, now), 30000).readingState).toBe("futureOnly");
    expect(evaluateReception(selectHealthSnapshot([], {}, summary, now), 30000).readingState).toBe("empty");
    expect(selectHealthSnapshot([entry("equal", now)], {}, summary, now).futureCount).toBe(0);
  });
  it("uses a single evaluation instant and reports accepted clock skew without clamping", () => {
    const summary = recordAcceptance(createReceptionSummary(1000), "entries", 2000);
    expect(recordAcceptance(summary, "profile", 1000)).toEqual(summary);
    expect(recordAcceptance(summary, "profile", 2000)).toEqual(summary);
    expect(evaluateReception(selectHealthSnapshot([], {}, summary, 1000), 200000)).toMatchObject({ acceptedAgeMs: -1000, thresholdMs: 400000 });
  });
  it("increments one category and safely saturates category and total counts", () => {
    let summary = recordRejection(createReceptionSummary(1000), "authentication");
    expect(summary.rejected.authentication).toBe(1);
    summary.rejected.authentication = Number.MAX_SAFE_INTEGER;
    summary = recordRejection(summary, "authentication");
    expect(summary.saturated.authentication).toBe(true);
    expect(evaluateReception(selectHealthSnapshot([], {}, summary, 1000), 30000)).toMatchObject({ rejectionTotal: Number.MAX_SAFE_INTEGER, totalSaturated: true });
    expect(() => validateReceptionSummary({ ...summary, observedSince: Infinity })).toThrow("unavailable");
  });
});
