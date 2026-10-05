import { describe, expect, it } from "vitest";
import { renderHealthPage } from "../src/health";
import { normalizeEntry } from "../src/entries";
import { createReceptionSummary, selectHealthSnapshot } from "../src/reception";

const now = 1800000000000;
const refreshKey = "glucoeasy.health.refresh.v1";

function refreshHarness(storageBlocked = false, historyBlocked = false) {
  const storage = new Map<string, string>();
  const details = { open: false };
  const calls: string[] = [];
  let timer = () => {};
  const control = { id: "reception-summary", getClientRects: () => [1], focus: () => { calls.push("focus"); document.activeElement = control; } };
  const document = {
    activeElement: control,
    scrollingElement: { scrollWidth: 360, scrollHeight: 2000 },
    getElementById: (id: string) => id === "reception-details" ? details : id === "reception-summary" ? control : null
  };
  const window = {
    sessionStorage: {
      getItem: (key: string) => { if (storageBlocked) throw new Error("blocked"); return storage.get(key) ?? null; },
      removeItem: (key: string) => { if (storageBlocked) throw new Error("blocked"); storage.delete(key); },
      setItem: (key: string, value: string) => { if (storageBlocked) throw new Error("blocked"); storage.set(key, value); }
    },
    history: {
      state: { unrelated: "preserved" } as Record<string, unknown>,
      replaceState: (state: Record<string, unknown>) => { if (historyBlocked) throw new Error("blocked"); window.history.state = state; }
    },
    performance: { getEntriesByType: () => [{ type: "reload" }] },
    location: { pathname: "/health", reload: () => { calls.push("reload"); } },
    scrollX: 0,
    scrollY: 500,
    innerWidth: 360,
    innerHeight: 800,
    scrollTo: (x: number, y: number) => { window.scrollX = x; window.scrollY = y; calls.push("scroll"); },
    requestAnimationFrame: (callback: () => void) => { callback(); },
    setTimeout: (callback: () => void) => { timer = callback; }
  };
  const run = (paused = false) => {
    const html = renderHealthPage({ latest: null, count: 0, baseUrl: "https://example.com", setupPending: paused });
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    new Function("window", "document", scripts.at(-1)![1])(window, document);
  };
  return { storage, details, calls, window, document, run, tick: () => timer() };
}

describe("health refresh continuity", () => {
  it.each([false, true])("restores open/closed state, focus and bounded scroll with storage blocked=%s", (blocked) => {
    for (const open of [false, true]) {
      const harness = refreshHarness(blocked);
      harness.run();
      harness.details.open = open;
      harness.window.scrollY = 5000;
      harness.tick();
      expect(harness.calls).toEqual(["reload"]);
      const record = blocked ? harness.window.history.state.glucoeasyHealthRefresh : JSON.parse(harness.storage.get(refreshKey)!);
      expect(Object.keys(record as object).sort()).toEqual(["version", "pathname", "savedAt", "receptionOpen", "scrollX", "scrollY", "focusedControl"].sort());
      harness.details.open = false;
      harness.run();
      expect(harness.details.open).toBe(open);
      expect(harness.window.scrollY).toBe(1200);
      expect(harness.calls).toEqual(["reload", "focus", "scroll"]);
      expect(harness.storage.has(refreshKey)).toBe(false);
      expect(harness.window.history.state).toEqual({ unrelated: "preserved" });
    }
  });
  it.each(["broken json", JSON.stringify({ version: 1, pathname: "/es/health" }), JSON.stringify({ version: 1, pathname: "/health", savedAt: 0, receptionOpen: true, scrollX: 0, scrollY: 0, focusedControl: null }), JSON.stringify({ version: 1, pathname: "/health", savedAt: Date.now(), receptionOpen: true, scrollX: -1, scrollY: 0, focusedControl: "secret-input" })])("ignores invalid or stale state without stealing focus: %s", (record) => {
    const harness = refreshHarness();
    harness.storage.set(refreshKey, record);
    expect(() => harness.run()).not.toThrow();
    expect(harness.details.open).toBe(false);
    expect(harness.calls).toEqual([]);
    expect(harness.storage.has(refreshKey)).toBe(false);
  });
  it("discards a pending record on an independent visit", () => {
    const harness = refreshHarness();
    harness.storage.set(refreshKey, JSON.stringify({ version: 1, pathname: "/health", savedAt: Date.now(), receptionOpen: true, scrollX: 0, scrollY: 0, focusedControl: null }));
    harness.window.performance.getEntriesByType = () => [{ type: "navigate" }];
    harness.run();
    expect(harness.details.open).toBe(false);
    expect(harness.calls).toEqual([]);
  });
  it("uses a safe focus fallback when a previously focused link disappears", () => {
    const harness = refreshHarness();
    harness.storage.set(refreshKey, JSON.stringify({ version: 1, pathname: "/health", savedAt: Date.now(), receptionOpen: true, scrollX: 0, scrollY: 100, focusedControl: "status-link" }));
    harness.run();
    expect(harness.document.activeElement.id).toBe("reception-summary");
    expect(harness.calls).toEqual(["focus", "scroll"]);
    expect(harness.window.scrollY).toBe(100);
  });
  it("refreshes safely when both persistence APIs are blocked", () => {
    const harness = refreshHarness(true, true);
    expect(() => { harness.run(); harness.tick(); }).not.toThrow();
    expect(harness.calls).toEqual(["reload"]);
  });
  it("clears old continuity without restoring or refreshing during setup", () => {
    const harness = refreshHarness();
    harness.storage.set(refreshKey, "old record");
    harness.run(true);
    harness.tick();
    expect(harness.storage.size).toBe(0);
    expect(harness.calls).toEqual([]);
  });
});
describe("health page information hierarchy", () => {
  it.each(["en", "es"] as const)("keeps treatment before reception, including empty states in %s", (locale) => {
    const html = renderHealthPage({ latest: null, count: 0, baseUrl: "https://example.com" }, locale);
    const ids = ["latest-reading", "latest-treatment", "reception", "service-info"].map((id) => html.indexOf(`id="${id}"`));
    expect(ids.every((index) => index >= 0)).toBe(true);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(html.indexOf("Not a medical device") >= 0 || html.indexOf("No es un dispositivo médico") >= 0).toBe(true);
  });
  it("keeps zero insulin and a localized timestamp in the treatment summary", () => {
    const treatment = { _id: "synthetic", eventType: "Correction Bolus", created_at: new Date(now).toISOString(), mills: now, insulin: 0, notes: "Synthetic note" };
    const html = renderHealthPage({ latest: null, count: 0, latestTreatment: treatment, baseUrl: "https://example.com" });
    const block = html.slice(html.indexOf('id="latest-treatment"'), html.indexOf('id="reception"'));
    expect(block).toContain('0 <span>U</span>');
    expect(block).toContain(`datetime="${treatment.created_at}"`);
    expect(block.indexOf("Correction Bolus")).toBeLessThan(block.indexOf("Synthetic note"));
  });
  it("escapes unknown reading direction and retains full long treatment text", () => {
    const marker = '<img src=x onerror="alert(1)">';
    const latest = normalizeEntry({ sgv: 123, date: now, direction: marker });
    const treatment = { _id: "synthetic", eventType: marker.repeat(30), notes: marker.repeat(50), created_at: new Date(now).toISOString(), mills: now };
    const html = renderHealthPage({ latest, count: 1, latestTreatment: treatment, baseUrl: "https://example.com" });
    expect(html).not.toContain(marker);
    expect(html).toContain("&lt;img");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;".repeat(30));
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;".repeat(50));
  });
});
describe("health reception diagnostics", () => {
  it.each(["en", "es"] as const)("keeps warnings visible before initially closed details in %s", (locale) => {
    const summary = createReceptionSummary(now);
    summary.rejected.authentication = 2;
    const latest = normalizeEntry({ sgv: 123, date: now - 7200000 });
    const future = normalizeEntry({ sgv: 900, date: now + 600000 });
    const reception = selectHealthSnapshot([latest, future], {}, summary, now);
    const html = renderHealthPage({ latest, count: 2, baseUrl: "https://example.com", reception }, locale);
    const panel = html.slice(html.indexOf('id="reception"'), html.indexOf('id="service-info"'));
    const [visible, details] = panel.split('<details id="reception-details">');
    expect(details).toBeDefined();
    expect(visible).toContain(locale === "en" ? "Old reading" : "Lectura antigua");
    expect(visible).toContain(locale === "en" ? "Rejected uploads: 2" : "Envíos rechazados: 2");
    expect(visible).toContain(locale === "en" ? "Future timestamps: 1" : "Fechas futuras: 1");
    expect(details).toContain(locale === "en" ? "Reception delay" : "Retraso de recepción");
    expect(details).toContain(locale === "en" ? "Observed since" : "Observado desde");
    expect(html).not.toContain('<details id="reception-details" open');
  });
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
