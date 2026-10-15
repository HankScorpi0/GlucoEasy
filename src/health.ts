import type { HealthViewModel } from "./types";
import { evaluateReception, REJECTION_CATEGORIES } from "./reception";

type HealthLocale = "en" | "es";

interface HealthCopy {
  lessThanOneMinute: string;
  minute: string;
  minutes: (count: number) => string;
  hour: string;
  hours: (count: number) => string;
  setupComplete: string;
  setupCompleteBody: string;
  useUrl: string;
  savedIt: string;
  setupInitialized: string;
  setupInitializedBody: string;
  latestReading: string;
  direction: string;
  noData: string;
  noReadings: string;
  configureUrl: string;
  latestTreatment: string;
  untypedTreatment: string;
  insulin: string;
  noInsulin: string;
  notes: string;
  noNotes: string;
  noTreatments: string;
  noTreatmentsBody: string;
  viewStatusJson: string;
  openSource: string;
  openSourceBody: string;
  viewRepository: string;
  glucose: string;
  treatment: string;
  setup: string;
  readingAge: string;
  treatmentAge: string;
  treatmentDate: string;
  recentReading: string;
  oldReading: string;
  unavailable: string;
  disclaimer: string;
  receptionDetails: string;
  fullTreatmentType: string;
  backupMonitor: string;
  readingChange: string;
}

const COPY: Record<HealthLocale, HealthCopy> = {
  en: {
    lessThanOneMinute: "less than 1 minute",
    minute: "1 minute",
    minutes: (count) => `${count} minutes`,
    hour: "1 hour",
    hours: (count) => `${count} hours`,
    setupComplete: "Setup complete",
    setupCompleteBody: "Save this secret code now. For security reasons it will only be shown this one time.",
    useUrl: "Use this xDrip+ URL:",
    savedIt: "I saved it",
    setupInitialized: "Setup already initialized",
    setupInitializedBody: "The one-time secret code screen has already been opened in another browser session.",
    latestReading: "Latest reading",
    direction: "Direction",
    noData: "No data",
    noReadings: "No readings received yet.",
    configureUrl: "Configure xDrip+ with this URL:",
    latestTreatment: "Latest treatment",
    untypedTreatment: "Untyped treatment",
    insulin: "Insulin",
    noInsulin: "No insulin",
    notes: "Notes",
    noNotes: "No notes",
    noTreatments: "No treatments received yet.",
    noTreatmentsBody: "GlucoEasy will show the most recent treatment here so this service can stay ready as a simple fallback.",
    viewStatusJson: "View status data",
    openSource: "Secondary service purpose",
    openSourceBody: "GlucoEasy is designed as an easy secondary service for apps like xDrip+ and Zukkah, with free Cloudflare deployment.",
    viewRepository: "View repository",
    glucose: "Glucose",
    treatment: "Treatment",
    setup: "Setup",
    readingAge: "Reading age",
    treatmentAge: "Treatment age",
    treatmentDate: "Date",
    recentReading: "Recent reading",
    oldReading: "Old reading",
    unavailable: "Reading freshness unavailable",
    disclaimer: "Informational backup only. Not a medical device; do not use for dosing or treatment decisions.",
    receptionDetails: "Reception details",
    fullTreatmentType: "Full treatment type",
    backupMonitor: "Backup monitor",
    readingChange: "Change"
  },
  es: {
    lessThanOneMinute: "menos de 1 minuto",
    minute: "1 minuto",
    minutes: (count) => `${count} minutos`,
    hour: "1 hora",
    hours: (count) => `${count} horas`,
    setupComplete: "Configuración completada",
    setupCompleteBody: "Guarda este código secreto ahora. Por seguridad solo se mostrará esta única vez.",
    useUrl: "Usa esta URL de xDrip+:",
    savedIt: "Ya lo guardé",
    setupInitialized: "La configuración ya fue inicializada",
    setupInitializedBody: "La pantalla del código secreto de un solo uso ya fue vista en otra sesión del navegador.",
    latestReading: "Última lectura",
    direction: "Dirección",
    noData: "Sin datos",
    noReadings: "Todavía no se han recibido lecturas.",
    configureUrl: "Configura xDrip+ con esta URL:",
    latestTreatment: "Último tratamiento",
    untypedTreatment: "Tratamiento sin tipo",
    insulin: "Insulina",
    noInsulin: "Sin insulina",
    notes: "Notas",
    noNotes: "Sin notas",
    noTreatments: "Todavía no se han recibido tratamientos.",
    noTreatmentsBody: "GlucoEasy mostrará aquí el tratamiento más reciente para que este servicio esté listo como respaldo sencillo.",
    viewStatusJson: "Ver datos de estado",
    openSource: "Finalidad del servicio",
    openSourceBody: "GlucoEasy está pensado como servicio secundario para apps como xDrip+ y Zukkah, con despliegue gratis en Cloudflare y una instalación muy simple.",
    viewRepository: "Ver repositorio",
    glucose: "Glucosa",
    treatment: "Tratamiento",
    setup: "Configuración",
    readingAge: "Antigüedad de lectura",
    treatmentAge: "Antigüedad de tratamiento",
    treatmentDate: "Fecha",
    recentReading: "Lectura reciente",
    oldReading: "Lectura antigua",
    unavailable: "Actualidad de lectura no disponible",
    disclaimer: "Respaldo informativo. No es un dispositivo médico; no sirve para dosificación ni decisiones de tratamiento.",
    receptionDetails: "Detalles de recepción",
    fullTreatmentType: "Tipo de tratamiento completo",
    backupMonitor: "Monitor de respaldo",
    readingChange: "Variación"
  }
};

function formatElapsed(date: number, now: number, copy: HealthCopy): string {
  if (date > now) {
    return copy === COPY.es ? "Fecha futura" : "Future timestamp";
  }
  const deltaMs = Math.max(0, now - date);
  const minutes = Math.floor(deltaMs / 60000);

  if (minutes < 1) {
    return copy.lessThanOneMinute;
  }

  if (minutes === 1) {
    return copy.minute;
  }

  if (minutes < 60) {
    return copy.minutes(minutes);
  }

  const hours = Math.floor(minutes / 60);
  if (hours === 1) {
    return copy.hour;
  }

  return copy.hours(hours);
}

function directionToArrow(direction?: string, fallback?: string): string {
  const arrows: Record<string, string> = {
    DoubleUp: "⇈",
    SingleUp: "↑",
    FortyFiveUp: "↗",
    Flat: "→",
    FortyFiveDown: "↘",
    SingleDown: "↓",
    DoubleDown: "⇊",
    NONE: "•",
    None: "•",
    NOT_COMPUTABLE: "•",
    RATE_OUT_OF_RANGE: "•"
  };

  if (!direction) {
    return fallback ?? "";
  }

  return arrows[direction] ?? direction;
}

function directionTone(direction?: string): string {
  if (!direction) {
    return "is-muted";
  }

  if (["DoubleUp", "SingleUp", "FortyFiveUp"].includes(direction)) {
    return "is-up";
  }

  if (["Flat", "NONE", "None"].includes(direction)) {
    return "is-flat";
  }

  if (["FortyFiveDown", "SingleDown", "DoubleDown"].includes(direction)) {
    return "is-down";
  }

  return "is-muted";
}

function glucoseTone(sgv?: number): string {
  if (typeof sgv !== "number") {
    return "is-neutral";
  }

  if (sgv < 70) {
    return "is-low";
  }

  if (sgv > 180) {
    return "is-high";
  }

  return "is-range";
}

function formatDelta(delta: number | null | undefined): string | null {
  if (typeof delta !== "number" || !Number.isFinite(delta)) {
    return null;
  }

  return `${delta > 0 ? "+" : ""}${delta}`;
}

function deltaTone(delta: number | null | undefined): string {
  if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) {
    return "is-neutral";
  }

  return delta > 0 ? "is-up" : "is-down";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]!);
}

function renderReceptionPanel(view: HealthViewModel, locale: HealthLocale, refreshMs: number): string {
  const es = locale === "es";
  const copy = COPY[locale];
  const pick = (en: string, spanish: string) => es ? spanish : en;
  const available = pick("Server available", "Servidor disponible");
  const title = pick("Reception diagnostics", "Diagnóstico de recepción");
  const header = `<div class="panel-header"><span class="panel-index" aria-hidden="true">03</span><h2>${title}</h2><span class="panel-category">${pick("Reception", "Recepción")}</span></div>`;
  const snapshot = view.reception;
  if (!snapshot) {
    return `<section id="reception" class="panel reception-panel">${header}<p>${available}</p><p class="hint">${pick("Reception diagnostics unavailable", "Diagnóstico de recepción no disponible")}</p></section>`;
  }
  const evaluation = evaluateReception(snapshot, refreshMs);
  const unknown = pick("Unknown", "Desconocido");
  const timestamp = (at: number | null) => at === null ? unknown : `<time datetime="${new Date(at).toISOString()}">${new Date(at).toISOString()}</time>`;
  const duration = (ms: number | null) => ms === null ? unknown : ms < 0
    ? `${pick("Clock skew", "Desfase temporal")} (−${formatElapsed(0, -ms, copy)})`
    : formatElapsed(0, ms, copy);
  const collections = { entries: pick("Readings", "Lecturas"), treatments: pick("Treatments", "Tratamientos"), profile: pick("Profile", "Perfil") };
  const states = {
    empty: pick("No readings", "Sin lecturas"), futureOnly: pick("Only future timestamps", "Solo fechas futuras"),
    recent: pick("Recent reading", "Lectura reciente"), stale: pick("Old reading", "Lectura antigua")
  };
  const accepted = snapshot.summary.lastAccepted;
  const rejectionLabels = {
    authentication: pick("Authentication / setup", "Autenticación / configuración"),
    payloadTooLarge: pick("Payload too large", "Cuerpo excesivo"),
    invalidPayload: pick("Format / validation", "Formato / validación"),
    internalFailure: pick("Internal failure", "Fallo interno")
  };
  const atLeast = pick("at least ", "al menos ");
  const detail = (label: string, value: string) => `<p class="detail-line"><strong>${label}</strong><br>${value}</p>`;
  return `<section id="reception" class="panel reception-panel">${header}
    <div class="reception-summary-row"><p>${available} · ${states[evaluation.readingState]}</p>
    <p class="hint">${pick("Rejected uploads", "Envíos rechazados")}: ${evaluation.totalSaturated ? atLeast : ""}${evaluation.rejectionTotal}</p>
    </div>
    ${snapshot.futureCount ? `<p class="future-warning" role="status"><strong>${pick("Future timestamps", "Fechas futuras")}: ${snapshot.futureCount}</strong> · ${pick("Excluded from reading freshness. Check the sender's clock.", "Excluidas de la actualidad de lecturas. Revisa el reloj del remitente.")}</p>` : ""}
    <details id="reception-details">
    <summary id="reception-summary">${copy.receptionDetails}</summary>
    <div class="detail-grid">
      ${detail(available, pick("Responding at this check", "Responde en esta consulta"))}
      ${detail(pick("Last accepted upload", "Último envío aceptado"), accepted ? `${collections[accepted.collection]} · ${timestamp(accepted.at)}<br>${duration(evaluation.acceptedAgeMs)}` : pick("No accepted uploads recorded", "Sin envíos aceptados registrados"))}
      ${detail(pick("Reading freshness", "Actualidad de lecturas"), `${states[evaluation.readingState]}<br>${pick("Threshold", "Umbral")}: ${duration(evaluation.thresholdMs)}`)}
      ${detail(pick("Reading timestamp / age", "Fecha de lectura / antigüedad"), `${timestamp(snapshot.reference?.date ?? null)}<br>${duration(evaluation.readingAgeMs)}`)}
      ${detail(pick("First known reception", "Primera recepción conocida"), timestamp(snapshot.referenceReceivedAt))}
      ${detail(pick("Reception delay", "Retraso de recepción"), duration(evaluation.receptionDelayMs))}
    </div>
    <h3>${pick("Rejected uploads", "Envíos rechazados")}: ${evaluation.totalSaturated ? atLeast : ""}${evaluation.rejectionTotal}</h3>
    <ul>${REJECTION_CATEGORIES.map((category) => `<li>${rejectionLabels[category]}: ${snapshot.summary.saturated[category] ? atLeast : ""}${snapshot.summary.rejected[category]}</li>`).join("")}</ul>
    <p class="hint">${pick("Observed since", "Observado desde")}: ${timestamp(snapshot.summary.observedSince)}</p>
    <p class="hint">${pick("Counts cover only uploads observed and saved since this time. Failures before reaching the service or preventing diagnostics from being saved are not counted.", "Los recuentos solo cubren envíos observados y guardados desde esta fecha. No incluyen fallos previos al servicio ni fallos que impidan guardar el diagnóstico.")}</p>
    </details>
  </section>`;
}

function renderRefreshScript(refreshMs: number, paused: boolean): string {
  return `<script>
    (() => {
      const key = "glucoeasy.health.refresh.v1";
      const historyKey = "glucoeasyHealthRefresh";
      const controls = ["reception-summary", "status-link", "repository-link", "treatment-type-summary", "direction-summary"];
      const details = document.getElementById("reception-details");
      const finite = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
      const valid = (value) => value && value.version === 1 &&
        ["/health", "/es/health"].includes(value.pathname) && value.pathname === window.location.pathname &&
        finite(value.savedAt) && value.savedAt <= Date.now() && Date.now() - value.savedAt <= ${refreshMs * 2 + 60000} &&
        typeof value.receptionOpen === "boolean" && finite(value.scrollX) && finite(value.scrollY) &&
        (value.focusedControl === null || controls.includes(value.focusedControl));
      let stored = null;
      let fromHistory = null;
      try {
        const raw = window.sessionStorage.getItem(key);
        window.sessionStorage.removeItem(key);
        stored = raw ? JSON.parse(raw) : null;
      } catch { /* Storage may be disabled or contain an invalid record. */ }
      try {
        const state = window.history.state;
        if (state && typeof state === "object" && Object.hasOwn(state, historyKey)) {
          fromHistory = state[historyKey];
          const next = { ...state };
          delete next[historyKey];
          window.history.replaceState(next, "");
        }
      } catch { /* Keep the page usable if history access is blocked. */ }
      ${paused ? "" : `
      const navigation = window.performance.getEntriesByType("navigation")[0];
      const record = valid(stored) ? stored : valid(fromHistory) ? fromHistory : null;
      if (record && navigation?.type === "reload") {
        if (details) details.open = record.receptionOpen;
        window.requestAnimationFrame(() => {
          const control = record.focusedControl ? document.getElementById(record.focusedControl) : null;
          const target = control && control.getClientRects().length ? control :
            record.focusedControl ? document.getElementById("reception-summary") : null;
          if (target && target.getClientRects().length) target.focus({ preventScroll: true });
          const root = document.scrollingElement;
          if (root) window.scrollTo(
            Math.min(record.scrollX, Math.max(0, root.scrollWidth - window.innerWidth)),
            Math.min(record.scrollY, Math.max(0, root.scrollHeight - window.innerHeight))
          );
        });
      }
      window.setTimeout(() => {
        const focused = document.activeElement?.id;
        const next = {
          version: 1,
          pathname: window.location.pathname,
          savedAt: Date.now(),
          receptionOpen: Boolean(details?.open),
          scrollX: Math.max(0, window.scrollX),
          scrollY: Math.max(0, window.scrollY),
          focusedControl: controls.includes(focused) ? focused : null
        };
        if (valid(next)) {
          try {
            window.sessionStorage.setItem(key, JSON.stringify(next));
          } catch {
            try {
              const state = window.history.state;
              if (state === null || (typeof state === "object" && !Array.isArray(state))) {
                window.history.replaceState({ ...state, [historyKey]: next }, "");
              }
            } catch { /* Refresh still works if both persistence APIs are blocked. */ }
          }
        }
        window.location.reload();
      }, ${refreshMs});
      `}
    })();
  </script>`;
}

export function renderHealthPage(view: HealthViewModel, locale: HealthLocale = "en"): string {
  const copy = COPY[locale];
  const exampleSecret = view.setupSecret ?? "YOUR_API_SECRET";
  const exampleUrl = escapeHtml(`https://${exampleSecret}@${view.baseUrl.replace(/^https?:\/\//, "")}/api/v1/`);
  const acknowledgePath = locale === "es" ? "/es/setup/acknowledge" : "/setup/acknowledge";
  const pageTitle = view.latest ? `${view.latest.sgv} mg/dL | GlucoEasy` : "GlucoEasy";
  const evaluatedAt = view.reception?.evaluatedAt ?? Date.now();
  const latestAge = view.latest ? formatElapsed(view.latest.date, evaluatedAt, copy) : null;
  const latestTreatmentAge = view.latestTreatment ? formatElapsed(view.latestTreatment.mills, evaluatedAt, copy) : null;
  const treatmentType = view.latestTreatment?.eventType || copy.untypedTreatment;
  const extendedTreatmentType = treatmentType.length > 80;
  const treatmentSummaryType = extendedTreatmentType ? treatmentType.slice(0, 77) + "…" : treatmentType;
  const latestDirection = directionToArrow(view.latest?.direction, copy.noData);
  const extendedDirection = latestDirection.length > 12;
  const latestDirectionTone = directionTone(view.latest?.direction);
  const latestGlucoseTone = glucoseTone(view.latest?.sgv);
  const latestDelta = formatDelta(view.latestDelta);
  const latestDeltaTone = deltaTone(view.latestDelta);
  const refreshMs = Math.max(5000, (view.refreshSeconds ?? 30) * 1000);
  const readingState = view.reception ? evaluateReception(view.reception, refreshMs).readingState : null;
  const readingStatus = readingState === "recent" ? copy.recentReading : readingState === "stale" ? copy.oldReading : copy.unavailable;
  const serviceState = { tone: "live", label: locale === "es" ? "Servidor disponible" : "Server available" };
  const receptionBlock = renderReceptionPanel(view, locale, refreshMs);
  const autoRefreshScript = renderRefreshScript(refreshMs, Boolean(view.setupSecret || view.setupPending));
  const setupBlock = view.setupSecret
    ? `
      <section class="panel setup setup-ready">
        <div class="panel-header">
          <p class="eyebrow">${copy.setup}</p>
          <h2>${copy.setupComplete}</h2>
        </div>
        <p class="panel-copy">${copy.setupCompleteBody}</p>
        <code>${escapeHtml(view.setupSecret)}</code>
        <p class="hint">${copy.useUrl}</p>
        <code>${exampleUrl}</code>
        <form method="post" action="${acknowledgePath}">
          <button type="submit">${copy.savedIt}</button>
        </form>
      </section>
    `
    : view.setupPending
      ? `
      <section class="panel setup">
        <div class="panel-header">
          <p class="eyebrow">${copy.setup}</p>
          <h2>${copy.setupInitialized}</h2>
        </div>
        <p class="panel-copy">${copy.setupInitializedBody}</p>
      </section>
    `
      : "";
  const latestBlock = view.latest
    ? `
      <section id="latest-reading" class="panel reading-panel">
        <div class="panel-header">
          <span class="panel-index" aria-hidden="true">01</span>
          <h2>${copy.latestReading}</h2>
          <span class="panel-category">${copy.glucose}</span>
        </div>
        <div class="reading-row">
          <div class="reading-value-group">
            <p class="reading ${latestGlucoseTone}">${view.latest.sgv} <span class="reading-unit">mg/dL</span> <span class="direction-arrow ${latestDirectionTone}">${escapeHtml(extendedDirection ? copy.noData : latestDirection)}</span></p>
            ${latestDelta ? `<div class="reading-change"><p class="metric-label">${copy.readingChange}</p><p class="reading-delta ${latestDeltaTone}">${latestDelta}</p></div>` : ""}
          </div>
          <div class="pill-stack">
            <p class="reading-meta">${copy.readingAge}: <span>${latestAge}</span></p>
          </div>
        </div>
        <div class="reading-state"><p class="freshness">${readingStatus}</p></div>
        ${extendedDirection ? `<details id="direction-details"><summary id="direction-summary">${copy.direction}</summary><p>${escapeHtml(latestDirection)}</p></details>` : ""}
        <p class="disclaimer">${copy.disclaimer}</p>
      </section>
    `
    : `
      <section id="latest-reading" class="panel empty-panel">
        <div class="panel-header">
          <p class="eyebrow">${copy.glucose}</p>
          <h2>${view.count > 0 ? (locale === "es" ? "Sin lectura no futura disponible" : "No non-future reading available") : copy.noReadings}</h2>
        </div>
        <p class="disclaimer">${copy.disclaimer}</p>
        ${view.count > 0 ? "" : `<p class="panel-copy">${copy.configureUrl}</p><code>${exampleUrl}</code>`}
      </section>
    `;
  const latestTreatmentBlock = view.latestTreatment
    ? `
      <section id="latest-treatment" class="panel treatment-panel">
        <div class="panel-header">
          <span class="panel-index" aria-hidden="true">02</span>
          <h2>${copy.latestTreatment}</h2>
          <span class="panel-category">${copy.treatment}</span>
        </div>
        <div class="reading-row">
          <p class="reading treatment-reading">${
          typeof view.latestTreatment.insulin === "number"
            ? `${view.latestTreatment.insulin} <span>U</span>`
            : `<span>${copy.noInsulin}</span>`
        }</p>
          <div class="pill-stack">
            <p class="pill">${copy.treatmentAge}: <span>${latestTreatmentAge}</span></p>
          </div>
        </div>
        <p class="treatment-type">${escapeHtml(treatmentSummaryType)}</p>
        <p class="treatment-date">${copy.treatmentDate}: <time datetime="${new Date(view.latestTreatment.mills).toISOString()}">${new Date(view.latestTreatment.mills).toISOString()}</time></p>
        ${extendedTreatmentType ? `<details id="treatment-type-details"><summary id="treatment-type-summary">${copy.fullTreatmentType}</summary><p>${escapeHtml(treatmentType)}</p></details>` : ""}
        <div class="detail-grid treatment-details">
          <p class="detail-line">${copy.notes}: ${escapeHtml(String(view.latestTreatment.notes ?? copy.noNotes))}</p>
        </div>
      </section>
    `
    : `
      <section id="latest-treatment" class="panel empty-panel">
        <div class="panel-header">
          <p class="eyebrow">${copy.treatment}</p>
          <h2>${copy.noTreatments}</h2>
        </div>
        <p class="panel-copy">${copy.noTreatmentsBody}</p>
      </section>
    `;

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${pageTitle}</title>
    <style>
      :root {
        color-scheme: dark;
        --background: #0b1016;
        --surface: #111922;
        --raised: #172330;
        --text: #e6edf3;
        --muted: #a0adba;
        --line: #2a3949;
        --control-line: #64788e;
        --blue: #8ac8ff;
        --green: #8be0b4;
        --gold: #f0c779;
        --mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 16px;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 40px 24px 32px;
        background: var(--background);
        color: var(--text);
        font-family: "Segoe UI", "Helvetica Neue", sans-serif;
        line-height: 1.5;
      }
      main { max-width: 960px; margin: 0 auto; }
      h1, h2, h3, p { margin: 0; }
      h2 { font-size: 1rem; font-weight: 600; letter-spacing: -0.015em; }
      h3 { font-size: 0.875rem; margin: 24px 0 12px; }
      p, code, time, li { overflow-wrap: anywhere; }
      .brand-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
      .brand-lockup { display: flex; align-items: center; gap: 12px; }
      .brand-icon { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid var(--control-line); border-radius: 6px; color: var(--blue); }
      .brand-icon svg { width: 24px; height: 24px; }
      .brand-mark { font-size: 1.25rem; font-weight: 650; letter-spacing: -0.05em; line-height: 1.2; }
      .brand-mark span { color: var(--blue); }
      .brand-caption { margin-top: 3px; color: var(--muted); font-size: 0.75rem; }
      .service-badge { display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 0.75rem; color: var(--muted); }
      .brand-mark-dot { width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; background: var(--green); }
      .layout { border: 1px solid var(--line); border-top: 2px solid var(--blue); border-radius: 6px 6px 0 0; overflow: clip; }
      .panel { padding: 24px 28px; background: var(--surface); min-width: 0; }
      .layout > .panel + .panel { border-top: 1px solid var(--line); }
      .panel-header { display: flex; align-items: baseline; gap: 14px; margin-bottom: 20px; }
      .eyebrow { font-family: var(--mono); font-size: 0.6875rem; color: var(--muted); }
      .panel-header .eyebrow { min-width: 20px; }
      .panel-index { color: var(--muted); font-family: var(--mono); font-size: 0.6875rem; font-weight: 400; }
      .panel-category { margin-left: auto; font: 0.6875rem var(--mono); color: var(--muted); }
      .reading-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px 32px; }
      .reading-value-group { display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: center; }
      .reading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 12px; font-family: var(--mono); font-variant-numeric: tabular-nums; font-size: clamp(4rem, 9vw, 6rem); font-weight: 500; line-height: 1; letter-spacing: -0.065em; }
      .reading span { font-size: 0.875rem; font-weight: 400; letter-spacing: 0; }
      .reading .direction-arrow { font-size: 2.25rem; line-height: 1; }
      .reading-unit { color: var(--muted); }
      .reading-change { border-left: 1px solid var(--line); padding-left: 24px; }
      .metric-label { margin-bottom: 6px; color: var(--muted); font-size: 0.75rem; }
      .reading-delta { font-family: var(--mono); font-size: 1.375rem; font-variant-numeric: tabular-nums; }
      .is-range, .is-flat, .is-down { color: var(--green); }
      .is-low, .is-high { color: var(--gold); }
      .is-up { color: var(--blue); }
      .is-muted, .is-neutral { color: var(--muted); }
      .pill-stack { min-width: 0; }
      .reading-meta, .pill { color: var(--muted); font-size: 0.8125rem; }
      .reading-meta span, .pill span { display: block; margin-top: 5px; color: var(--text); font-family: var(--mono); font-size: 0.875rem; }
      .reading-state { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 24px; margin-top: 16px; }
      .freshness { display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--text); }
      .freshness::before { content: ""; width: 5px; height: 5px; background: var(--blue); }
      .disclaimer { margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--line); font-size: 0.75rem; color: var(--muted); }
      .treatment-panel .panel-header { margin-bottom: 16px; }
      .treatment-reading { font-size: 2.25rem; gap: 8px; }
      .treatment-type { margin-top: 14px; font-weight: 600; font-size: 0.9375rem; }
      .treatment-date { margin-top: 6px; font-size: 0.75rem; color: var(--muted); }
      time { font-family: var(--mono); font-variant-numeric: tabular-nums; }
      .treatment-details { margin-top: 16px; padding-top: 14px; border-top: 1px dashed var(--line); }
      .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 32px; }
      .detail-line { font-size: 0.8125rem; }
      .detail-line strong { display: inline-block; margin-bottom: 6px; color: var(--muted); font-weight: 400; }
      .treatment-details .detail-line { grid-column: 1 / -1; color: var(--muted); }
      .hint, .panel-copy, .repo-body { margin-top: 8px; color: var(--muted); font-size: 0.8125rem; }
      .reception-panel { font-size: 0.875rem; }
      .reception-panel .panel-header { margin-bottom: 14px; }
      .reception-summary-row { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 24px; }
      .reception-summary-row .hint { margin-top: 0; font: 0.75rem var(--mono); }
      .future-warning { margin-top: 16px; padding: 12px 16px; background: #2b2418; color: var(--gold); border-left: 2px solid var(--gold); font-size: 0.8125rem; }
      details { margin-top: 16px; }
      summary { cursor: pointer; color: var(--blue); font-size: 0.8125rem; min-height: 40px; padding: 10px 0; width: fit-content; max-width: 100%; }
      summary::marker { font-size: 0.75rem; }
      details[open] > summary { margin-bottom: 16px; }
      details > p, details > .detail-grid { margin-top: 12px; }
      summary:hover, a:hover { color: #baddff; text-decoration: underline; text-underline-offset: 4px; }
      .status-panel { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 20px 32px; border: 1px solid var(--line); border-top: 0; border-radius: 0 0 6px 6px; background: transparent; }
      .service-copy { max-width: 600px; flex: 1 1 360px; }
      .status-label { font-size: 0.75rem; font-weight: 600; color: var(--text); }
      .status-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding-top: 1px; }
      .status-link { font-size: 0.75rem; }
      .setup { background: var(--raised); }
      .setup-ready { border-left: 2px solid var(--green); }
      code { display: block; margin-top: 12px; padding: 12px 16px; border: 1px solid var(--control-line); border-radius: 4px; background: var(--background); color: var(--text); white-space: pre-wrap; font: 0.8125rem/1.6 var(--mono); }
      button { margin-top: 16px; padding: 12px 20px; border: 1px solid var(--blue); border-radius: 4px; background: var(--blue); color: var(--background); font: inherit; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
      button:hover { background: #baddff; }
      a { color: var(--blue); text-underline-offset: 4px; }
      :focus-visible { outline: 2px solid var(--blue); outline-offset: 5px; border-radius: 2px; }
      ul { margin: 8px 0; padding-left: 20px; font-size: 0.8125rem; }
      @media (max-width: 600px) {
        body { padding: 20px 12px 24px; }
        .brand-bar { gap: 12px; margin-bottom: 20px; }
        .brand-icon { width: 32px; height: 32px; }
        .brand-icon svg { width: 20px; height: 20px; }
        .brand-lockup { gap: 8px; }
        .brand-mark { font-size: 1.125rem; }
        .brand-caption { font-size: 0.6875rem; }
        .service-badge { font-size: 0.625rem; gap: 5px; }
        .panel { padding: 20px 16px; }
        .panel-header { margin-bottom: 20px; gap: 10px; }
        .panel-category { display: none; }
        .reading { font-size: 4rem; gap: 8px; }
        .reading .direction-arrow { font-size: 1.75rem; }
        .reading-row { gap: 16px; }
        .reading-value-group { width: 100%; justify-content: space-between; gap: 12px; }
        .reading-change { padding-left: 16px; }
        .reading-delta { font-size: 1.125rem; }
        .reading-panel .pill-stack { width: 100%; }
        .reading-meta span, .pill span { display: inline; margin: 0 0 0 4px; font-size: 0.75rem; }
        .reading-state { margin-top: 12px; }
        .disclaimer { margin-top: 16px; padding-top: 12px; }
        .treatment-reading { font-size: 2rem; }
        .detail-grid { grid-template-columns: 1fr; }
        .treatment-panel .pill-stack { flex: 1 1 190px; }
        .pill span { white-space: nowrap; }
        .treatment-type { margin-top: 12px; }
        .status-panel { gap: 16px; }
        .status-actions { flex-direction: row; flex-wrap: wrap; gap: 12px 24px; }
      }
    </style>
  </head>
  <body>
    <main>
      <header class="brand-bar">
        <div class="brand-lockup">
          <span class="brand-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h5l3-7 3 14 3-7h4" /></svg></span>
          <div><h1 class="brand-mark">Gluco<span>Easy</span></h1><p class="brand-caption">${copy.backupMonitor}</p></div>
        </div>
        <p class="service-badge"><span class="brand-mark-dot is-${serviceState.tone}" aria-hidden="true"></span>${serviceState.label}</p>
      </header>
      <div class="layout">
        ${setupBlock}
        ${latestBlock}
        ${latestTreatmentBlock}
        ${receptionBlock}
      </div>
      <section id="service-info" class="panel status-panel">
        <div class="service-copy">
          <h2 class="status-label">${copy.openSource}</h2>
          <p class="repo-body">${copy.openSourceBody}</p>
        </div>
        <div class="status-actions">
          <a id="status-link" class="status-link" href="/api/v1/status.json">${copy.viewStatusJson}</a>
          <a id="repository-link" class="status-link repo-link" href="https://github.com/HankScorpi0/GlucoEasy" target="_blank" rel="noopener noreferrer">${copy.viewRepository}</a>
        </div>
      </section>
    </main>
    <script>
      (() => {
        const formatter = new Intl.DateTimeFormat(document.documentElement.lang, {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hourCycle: "h23", timeZoneName: "short"
        });
        document.querySelectorAll("time[datetime]").forEach((element) => {
          const date = new Date(element.getAttribute("datetime"));
          if (!Number.isNaN(date.getTime())) {
            element.textContent = formatter.format(date);
          }
        });
      })();
    </script>
    ${autoRefreshScript}
  </body>
</html>`;
}
