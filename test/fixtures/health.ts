import type { CgmEntry, HealthViewModel, Treatment } from "../../src/types";
import { createReceptionSummary, selectHealthSnapshot } from "../../src/reception";

export const HEALTH_FIXTURE_NOW = Date.UTC(2026, 9, 15, 10, 0);

export type HealthFixture = "recent" | "stale" | "empty" | "future" | "mixed" |
  "unavailable" | "rejected" | "saturated" | "zero" | "no-insulin" | "long" |
  "setup" | "setup-pending";

export function createHealthFixture(scenario: HealthFixture = "recent", now = HEALTH_FIXTURE_NOW): HealthViewModel {
  const date = now - (scenario === "stale" ? 3600000 : 60000);
  const entry: CgmEntry = {
    _id: "synthetic-reading",
    sgv: 123,
    date,
    dateString: new Date(date).toISOString(),
    direction: scenario === "long" ? "Unknown <direction> ".repeat(20) : "Flat",
    type: "sgv"
  };
  const previous: CgmEntry = {
    ...entry, _id: "synthetic-previous", sgv: 120, date: date - 300000,
    dateString: new Date(date - 300000).toISOString()
  };
  const future: CgmEntry = {
    ...entry, _id: "synthetic-future", sgv: 125, date: now + 3600000,
    dateString: new Date(now + 3600000).toISOString()
  };
  const entries = scenario === "empty" ? [] : scenario === "future" ? [future] :
    scenario === "mixed" ? [future, entry, previous] : [entry, previous];
  const summary = createReceptionSummary(now - 86400000);
  if (entries.length) {
    summary.lastAccepted = { at: now - 30000, collection: "entries" };
  }
  if (scenario === "rejected") {
    summary.rejected.authentication = 2;
  }
  if (scenario === "saturated") {
    summary.rejected.authentication = Number.MAX_SAFE_INTEGER;
    summary.saturated.authentication = true;
  }
  const reception = selectHealthSnapshot(entries, { [String(date)]: date + 10000 }, summary, now);
  const treatmentDate = now - 600000;
  const treatment: Treatment = {
    _id: "synthetic-treatment",
    eventType: scenario === "long" ? "Synthetic <treatment> ".repeat(30) : "Correction Bolus",
    created_at: new Date(treatmentDate).toISOString(),
    mills: treatmentDate,
    ...(scenario === "no-insulin" ? {} : { insulin: scenario === "zero" ? 0 : 1.2 }),
    ...(scenario === "no-insulin" ? {} : {
      notes: scenario === "long" ? "Synthetic note <script>marker</script> ".repeat(60) :
        "Synthetic example · Backup upload"
    })
  };
  return {
    latest: reception.reference,
    latestDelta: reception.reference && reception.previousReference ? 3 : null,
    count: entries.length,
    latestTreatment: scenario === "empty" || scenario === "future" ? null : treatment,
    treatmentCount: scenario === "empty" || scenario === "future" ? 0 : 1,
    reception: scenario === "unavailable" ? null : reception,
    baseUrl: "https://synthetic.example",
    refreshSeconds: 30,
    ...(scenario === "setup" ? { setupSecret: "SYNTHETIC_SETUP_ONLY" } : {}),
    ...(scenario === "setup-pending" ? { setupPending: true } : {})
  };
}
