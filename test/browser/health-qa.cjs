// Optional browser QA. Reuses an installed Playwright through HEALTH_QA_PLAYWRIGHT;
// no browser tooling is included in the deployed Worker or required by Vitest.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const ts = require("typescript");
const { chromium } = require(process.env.HEALTH_QA_PLAYWRIGHT || "playwright");
const root = path.resolve(__dirname, "../..");
const feature = path.join(root, "specs/004-technical-ui-redesign");
const loaded = new Map();
function loadTs(filename) {
  filename = path.resolve(filename);
  if (loaded.has(filename)) return loaded.get(filename);
  const exports = {};
  loaded.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const localRequire = name => name.startsWith(".") ? loadTs(path.resolve(path.dirname(filename), name + ".ts")) : require(name);
  new Function("require", "exports", "module", source)(localRequire, exports, { exports });
  return exports;
}
const { renderHealthPage } = loadTs(path.join(root, "src/health.ts"));
const { createHealthFixture, HEALTH_FIXTURE_NOW } = loadTs(path.join(root, "test/fixtures/health.ts"));
const report = { layout: [], contrast: [], keyboard: [], continuity: [], noScript: [], screenshots: [], errors: [] };
const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/favicon.ico") { response.writeHead(204).end(); return; }
  const scenario = url.searchParams.get("case") || "recent";
  const view = createHealthFixture(["low", "high", "delta-zero"].includes(scenario) ? "recent" : scenario);
  if (scenario === "low" || scenario === "high") view.latest.sgv = scenario === "low" ? 60 : 240;
  if (scenario === "delta-zero") view.latestDelta = 0;
  const actualNow = Date.now;
  let html;
  try { Date.now = () => HEALTH_FIXTURE_NOW; html = renderHealthPage(view, url.pathname.startsWith("/es/") ? "es" : "en"); }
  finally { Date.now = actualNow; }
  response.writeHead(200, { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "no-store" });
  response.end(html);
});

async function measureLayout(page) {
  return page.evaluate(() => {
    const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden";
    const box = selector => document.querySelector(selector)?.getBoundingClientRect();
    const clipped = [...document.querySelectorAll("p,h1,h2,code,summary")].filter(el => visible(el) && el.scrollWidth > el.clientWidth + 1).map(el => el.tagName + "." + el.className);
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      clipped,
      readingBottom: box("#latest-reading").bottom,
      treatmentSummaryBottom: (box(".treatment-date") || box("#latest-treatment h2")).bottom,
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      order: [...document.querySelectorAll(".layout > section[id],#service-info")].map(el => el.id)
    };
  });
}

async function measureContrast(page, state, controlsOnly = false) {
  const rows = await page.evaluate(({ state, controlsOnly }) => {
    const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
    const luminance = color => color.slice(0, 3).map(value => {
      value /= 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const ratio = (a, b) => { const x = luminance(a); const y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const background = el => {
      while (el) { const value = getComputedStyle(el).backgroundColor; const color = rgb(value); if (color.length === 3 || color[3] === 1) return value; el = el.parentElement; }
      throw new Error("Opaque background unavailable");
    };
    const result = [];
    for (const el of document.querySelectorAll(controlsOnly ? "summary,a,button,code" : "body *")) {
      if (!el.getClientRects().length || el.closest('[aria-hidden="true"]') || ["SCRIPT", "STYLE"].includes(el.tagName)) continue;
      if (![...el.childNodes].some(node => node.nodeType === 3 && node.textContent.trim())) continue;
      const style = getComputedStyle(el);
      const bg = background(el);
      const size = parseFloat(style.fontSize);
      const weight = parseInt(style.fontWeight) || 400;
      result.push({ kind: "text", tag: el.tagName, selector: el.id || el.className, state, foreground: style.color, background: bg,
        ratio: ratio(rgb(style.color), rgb(bg)), threshold: size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5 });
      if (["BUTTON", "CODE"].includes(el.tagName) && parseFloat(style.borderTopWidth)) {
        result.push({ kind: "boundary", tag: el.tagName, state, foreground: style.borderTopColor, background: background(el.parentElement),
          ratio: ratio(rgb(style.borderTopColor), rgb(background(el.parentElement))), threshold: 3 });
      }
      if (el === document.activeElement && style.outlineStyle !== "none") {
        result.push({ kind: "focus", tag: el.tagName, state, foreground: style.outlineColor, background: background(el.parentElement),
          ratio: ratio(rgb(style.outlineColor), rgb(background(el.parentElement))), threshold: 3 });
      }
    }
    return result;
  }, { state, controlsOnly });
  for (const row of rows) assert.ok(row.ratio >= row.threshold, "Contrast failure: " + JSON.stringify(row));
  return rows;
}

(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.HEALTH_QA_CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  try {
    for (const locale of ["es", "en"]) {
      for (const width of [360, 768, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 800 }, timezoneId: "Europe/Madrid" });
        page.on("pageerror", error => report.errors.push(error.message));
        for (const scenario of ["recent", "empty", "future", "mixed", "long", "setup", "setup-pending", "unavailable", "zero", "no-insulin", "rejected", "saturated", "stale", "low", "high", "delta-zero"]) {
          await page.goto(`${base}/${locale === "es" ? "es/" : ""}health?case=${scenario}`);
          assert.equal(await page.locator("#reception-details[open]").count(), 0);
          let priorColors;
          for (const preference of ["light", "dark"]) {
            await page.emulateMedia({ colorScheme: preference });
            for (const scale of [1, 2]) {
              await page.evaluate(scale => document.documentElement.style.fontSize = 16 * scale + "px", scale);
              const metrics = await measureLayout(page);
              assert.equal(metrics.overflow, false, `${locale}/${width}/${scenario}/${scale}: overflow`);
              assert.deepEqual(metrics.clipped, [], `${locale}/${width}/${scenario}/${scale}: clipped`);
              assert.equal(metrics.colorScheme, "dark");
              assert.deepEqual(metrics.order, ["latest-reading", "latest-treatment", "reception", "service-info"]);
              if (width === 360 && scale === 1 && !scenario.startsWith("setup")) {
                assert.ok(metrics.readingBottom <= 800 && metrics.treatmentSummaryBottom <= 800, "First viewport");
              }
              report.layout.push({ locale, width, scenario, preference, scale, ...metrics });
            }
            const colors = await page.locator("body,.panel,.reading").evaluateAll(elements => elements.map(el => [getComputedStyle(el).color, getComputedStyle(el).backgroundColor]));
            if (priorColors) assert.deepEqual(colors, priorColors);
            priorColors = colors;
          }
          await page.evaluate(() => { document.documentElement.style.fontSize = "16px"; document.querySelectorAll("details").forEach(el => el.open = true); });
          if (width === 360) {
            report.contrast.push(...(await measureContrast(page, "default")).map(row => ({ locale, scenario, ...row })));
            const controls = page.locator("summary,a,button");
            for (let index = 0; index < await controls.count(); index++) {
              await controls.nth(index).hover();
              report.contrast.push(...(await measureContrast(page, "hover", true)).map(row => ({ locale, scenario, ...row })));
              await controls.nth(index).focus();
              await page.keyboard.press("Tab");
              report.contrast.push(...(await measureContrast(page, "focus", true)).map(row => ({ locale, scenario, ...row })));
            }
          }
        }
        await page.close();
      }
      for (const scenario of ["recent", "long", "setup"]) {
        const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
        await page.goto(`${base}/${locale === "es" ? "es/" : ""}health?case=${scenario}`);
        const expected = await page.locator("summary,a,button").count();
        const reached = [];
        for (let index = 0; index < expected; index++) {
          await page.keyboard.press("Tab");
          const active = await page.evaluate(() => {
            const el = document.activeElement; const style = getComputedStyle(el); const rect = el.getBoundingClientRect();
            return { id: el.id || el.tagName.toLowerCase(), name: Boolean(el.textContent.trim() || el.getAttribute("aria-label")), outline: style.outlineStyle, width: rect.width, height: rect.height, tag: el.tagName };
          });
          assert.ok(active.name && active.outline !== "none" && active.width > 0 && active.height > 0);
          reached.push(active.id);
          if (active.tag === "SUMMARY") {
            await page.keyboard.press("Enter");
            assert.equal(await page.evaluate(() => document.activeElement.parentElement.open), true);
            await page.keyboard.press("Space");
            assert.equal(await page.evaluate(() => document.activeElement.parentElement.open), false);
          }
        }
        report.keyboard.push({ locale, scenario, reached, focusVisible: true, nativeToggle: true });
        await page.close();
      }
    }
    const continuityCases = ["es", "en"].flatMap(locale => ["normal", "storage-blocked", "both-blocked"].flatMap(mode => [false, true].map(open => ({ locale, mode, open }))));
    report.continuity = await Promise.all(continuityCases.map(async ({ locale, mode, open }) => {
      const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
      if (mode !== "normal") await context.addInitScript(mode => {
        Object.defineProperty(window, "sessionStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
        if (mode === "both-blocked") window.history.replaceState = () => { throw new DOMException("Blocked", "SecurityError"); };
      }, mode);
      const page = await context.newPage();
      page.on("pageerror", error => report.errors.push(error.message));
      await page.goto(`${base}/${locale === "es" ? "es/" : ""}health`);
      const control = open ? "reception-summary" : "repository-link";
      await page.evaluate(({ open, control }) => { document.querySelector("#reception-details").open = open; document.getElementById(control).focus({ preventScroll: true }); window.scrollTo(0, 150); }, { open, control });
      const getState = () => page.evaluate(() => ({ open: document.querySelector("#reception-details").open, focus: document.activeElement.id, y: scrollY }));
      const before = await getState();
      await page.waitForEvent("domcontentloaded", { timeout: 40000 });
      await page.waitForTimeout(100);
      const after = await getState();
      if (mode !== "both-blocked") assert.deepEqual(after, before);
      else assert.equal(after.open, false);
      await context.close(); return { locale, mode, before, after };
    }));
    for (const locale of ["es", "en"]) {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
      const page = await context.newPage();
      await page.goto(`${base}/${locale === "es" ? "es/" : ""}health`);
      await page.locator("#reception-summary").click();
      assert.equal(await page.locator("#reception-details").evaluate(el => el.open), true);
      assert.ok((await page.locator(".treatment-date").innerText()).includes("2026-10-15T09:50:00.000Z"));
      report.noScript.push({ locale, detailsOpen: true, isoVisible: true });
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    const folder = path.join(root, "docs/images/004-technical-ui-redesign");
    fs.mkdirSync(folder, { recursive: true });
    for (const locale of ["es", "en"]) for (const [device, width, height] of [["mobile", 360, 800], ["desktop", 1440, 1000]]) {
      const page = await browser.newPage({ viewport: { width, height }, timezoneId: "Europe/Madrid" });
      await page.goto(`${base}/${locale === "es" ? "es/" : ""}health`);
      await page.screenshot({ path: path.join(folder, `health-${locale}-${device}.png`), fullPage: true });
      const bytes = Buffer.byteLength(await (await page.request.get(page.url())).text());
      report.screenshots.push({ locale, device, width, height, htmlBytes: bytes });
      if (device === "desktop") {
        await page.goto(`${base}/${locale === "es" ? "es/" : ""}health?case=mixed`);
        await page.locator("#reception-summary").click();
        await page.screenshot({ path: path.join(folder, `reception-${locale}-desktop.png`), fullPage: true });
      }
      await page.close();
    }
    fs.writeFileSync(path.join(feature, "browser-results.json"), JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify({ layoutViews: report.layout.length, contrastChecks: report.contrast.length, keyboardJourneys: report.keyboard.length, reloads: report.continuity.length, noScript: report.noScript.length, screenshots: report.screenshots, errors: report.errors }));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
