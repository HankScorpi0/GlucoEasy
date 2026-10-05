import { describe, expect, it } from "vitest";
import { renderHealthPage } from "../src/health";
import { normalizeEntry } from "../src/entries";
import { createReceptionSummary, selectHealthSnapshot } from "../src/reception";

const now = 1800000000000;
describe("health reception diagnostics", () => {
  it("localizes diagnostic timestamps even while setup pauses automatic refresh", () => {
    const at = Date.parse("2026-10-05T10:06:00.000Z");
    const reception = selectHealthSnapshot([], {}, createReceptionSummary(at), at);
    const html = renderHealthPage({ latest: null, count: 0, baseUrl: "https://example.com", reception, setupPending: true }, "es");
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeDefined();
    const element = { textContent: new Date(at).toISOString(), getAttribute: () => new Date(at).toISOString() };
    const document = { documentElement: { lang: "es" }, querySelectorAll: () => [element] };
    const localIntl = { DateTimeFormat: class extends Intl.DateTimeFormat {
      constructor(locale: string, options: Intl.DateTimeFormatOptions) {
        super(locale, { ...options, timeZone: "Europe/Madrid" });
      }
    } };
    new Function("document", "Intl", script!)(document, localIntl);
    expect(element.textContent).toContain("12:06:00");
    expect(element.textContent).toContain("CEST");
    expect(html).toContain('datetime="2026-10-05T10:06:00.000Z"');
  });
  it.each(["en", "es"] as const)("separates availability, upload and freshness in %s", (locale) => {
    const latest = normalizeEntry({ sgv: 123, date: now - 7200000 });
    const reception = selectHealthSnapshot([latest], { [latest.date]: now }, { ...createReceptionSummary(now), lastAccepted: { at: now, collection: "entries" } }, now);
    const html = renderHealthPage({ latest, count: 1, baseUrl: "https://example.com", reception }, locale);
    expect(html).toContain(locale === "en" ? "Server available" : "Servidor disponible");
    expect(html).toContain(locale === "en" ? "Last accepted upload" : "Último envío aceptado");
    expect(html).toContain(locale === "en" ? "Old reading" : "Lectura antigua");
    expect(html).toContain(new Date(latest.date).toISOString());
    expect(html).toContain(locale === "en" ? "Reception delay" : "Retraso de recepción");
  });
  it("warns about future timestamps without hiding valid data", () => {
    const valid = normalizeEntry({ sgv: 120, date: now });
    const future = normalizeEntry({ sgv: 900, date: now + 600000 });
    const reception = selectHealthSnapshot([future, valid], {}, createReceptionSummary(now), now);
    const html = renderHealthPage({ latest: valid, count: 2, baseUrl: "https://example.com", reception });
    expect(html).toContain("Future timestamps: 1");
    expect(html).toContain("Recent reading");
    expect(html).toContain("Unknown");
    expect(html).not.toContain("900 mg/dL");
  });
  it("distinguishes future-only from empty and shows unavailable diagnostics safely", () => {
    const reception = selectHealthSnapshot([normalizeEntry({ sgv: 120, date: now + 1 })], {}, createReceptionSummary(now), now);
    expect(renderHealthPage({ latest: null, count: 1, baseUrl: "https://example.com", reception })).toContain("Only future timestamps");
    expect(renderHealthPage({ latest: null, count: 0, baseUrl: "https://example.com", reception: null })).toContain("Reception diagnostics unavailable");
  });
  it("escapes external HTML and does not expose a secret after setup", () => {
    const treatment = { _id: "test", eventType: "<script>marker</script>", notes: "<img src=x onerror=alert(1)>", created_at: new Date(now).toISOString(), mills: now };
    const html = renderHealthPage({ latest: null, count: 0, latestTreatment: treatment, baseUrl: "https://example.com" });
    expect(html).not.toContain(treatment.eventType);
    expect(html).not.toContain(treatment.notes);
    expect(html).toContain("&lt;script&gt;");
  });
  it.each(["en", "es"] as const)("shows observation scope and saturated counters in %s", (locale) => {
    const summary = createReceptionSummary(now);
    summary.rejected.authentication = Number.MAX_SAFE_INTEGER;
    summary.saturated.authentication = true;
    const reception = selectHealthSnapshot([], {}, summary, now);
    const html = renderHealthPage({ latest: null, count: 0, baseUrl: "https://example.com", reception }, locale);
    expect(html).toContain(locale === "en" ? "at least " : "al menos ");
    expect(html).toContain(locale === "en" ? "Observed since" : "Observado desde");
    expect(html).toContain(locale === "en" ? "not counted" : "No incluyen fallos");
  });
});
