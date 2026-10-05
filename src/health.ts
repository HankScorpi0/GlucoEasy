import type { HealthViewModel } from "./types";
import { evaluateReception, REJECTION_CATEGORIES } from "./reception";

type HealthLocale = "en" | "es";

interface HealthCopy {
  lessThanOneMinute: string;
  minute: string;
  minutes: (count: number) => string;
  hour: string;
  hours: (count: number) => string;
  serviceLive: string;
  serviceStale: string;
  serviceWaiting: string;
  setupComplete: string;
  setupCompleteBody: string;
  useUrl: string;
  savedIt: string;
  setupInitialized: string;
  setupInitializedBody: string;
  latestReading: string;
  receivedAgo: string;
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
  title: string;
  status: string;
  viewStatusJson: string;
  openSource: string;
  openSourceBody: string;
  viewRepository: string;
  glucose: string;
  treatment: string;
  setup: string;
  system: string;
  readingAge: string;
  treatmentAge: string;
  treatmentDate: string;
  recentReading: string;
  oldReading: string;
  unavailable: string;
  disclaimer: string;
  receptionDetails: string;
  fullTreatmentType: string;
}

const COPY: Record<HealthLocale, HealthCopy> = {
  en: {
    lessThanOneMinute: "less than 1 minute",
    minute: "1 minute",
    minutes: (count) => `${count} minutes`,
    hour: "1 hour",
    hours: (count) => `${count} hours`,
    serviceLive: "Service active",
    serviceStale: "Service stale",
    serviceWaiting: "Waiting for data",
    setupComplete: "Setup complete",
    setupCompleteBody: "Save this secret code now. For security reasons it will only be shown this one time.",
    useUrl: "Use this xDrip+ URL:",
    savedIt: "I saved it",
    setupInitialized: "Setup already initialized",
    setupInitializedBody: "The one-time secret code screen has already been opened in another browser session.",
    latestReading: "Latest reading",
    receivedAgo: "Received",
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
    title: "GlucoEasy",
    status: "Status",
    viewStatusJson: "View status data",
    openSource: "Secondary service purpose",
    openSourceBody: "GlucoEasy is designed as an easy secondary service for apps like xDrip+ and Zukkah, with free Cloudflare deployment.",
    viewRepository: "View repository",
    glucose: "Glucose",
    treatment: "Treatment",
    setup: "Setup",
    system: "System",
    readingAge: "Reading age",
    treatmentAge: "Treatment age",
    treatmentDate: "Date",
    recentReading: "Recent reading",
    oldReading: "Old reading",
    unavailable: "Reading freshness unavailable",
    disclaimer: "Informational backup only. Not a medical device; do not use for dosing or treatment decisions.",
    receptionDetails: "Reception details",
    fullTreatmentType: "Full treatment type"
  },
  es: {
    lessThanOneMinute: "menos de 1 minuto",
    minute: "1 minuto",
    minutes: (count) => `${count} minutos`,
    hour: "1 hora",
    hours: (count) => `${count} horas`,
    serviceLive: "Servicio activo",
    serviceStale: "Servicio sin datos recientes",
    serviceWaiting: "Esperando datos",
    setupComplete: "Configuración completada",
    setupCompleteBody: "Guarda este código secreto ahora. Por seguridad solo se mostrará esta única vez.",
    useUrl: "Usa esta URL de xDrip+:",
    savedIt: "Ya lo guardé",
    setupInitialized: "La configuración ya fue inicializada",
    setupInitializedBody: "La pantalla del código secreto de un solo uso ya fue vista en otra sesión del navegador.",
    latestReading: "Última lectura",
    receivedAgo: "Recibido hace",
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
    title: "GlucoEasy",
    status: "Estado",
    viewStatusJson: "Ver datos de estado",
    openSource: "Finalidad del servicio",
    openSourceBody: "GlucoEasy está pensado como servicio secundario para apps como xDrip+ y Zukkah, con despliegue gratis en Cloudflare y una instalación muy simple.",
    viewRepository: "Ver repositorio",
    glucose: "Glucosa",
    treatment: "Tratamiento",
    setup: "Configuración",
    system: "Sistema",
    readingAge: "Antigüedad de lectura",
    treatmentAge: "Antigüedad de tratamiento",
    treatmentDate: "Fecha",
    recentReading: "Lectura reciente",
    oldReading: "Lectura antigua",
    unavailable: "Actualidad de lectura no disponible",
    disclaimer: "Respaldo informativo. No es un dispositivo médico; no sirve para dosificación ni decisiones de tratamiento.",
    receptionDetails: "Detalles de recepción",
    fullTreatmentType: "Tipo de tratamiento completo"
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
  const header = `<div class="panel-header"><p class="eyebrow">${pick("Reception", "Recepción")}</p><h2>${title}</h2></div>`;
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
    <p>${available} · ${states[evaluation.readingState]}</p>
    <p class="hint">${pick("Rejected uploads", "Envíos rechazados")}: ${evaluation.totalSaturated ? atLeast : ""}${evaluation.rejectionTotal}</p>
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
          <p class="eyebrow">${copy.glucose}</p>
          <h2>${copy.latestReading}</h2>
        </div>
        <div class="reading-row">
          <div class="reading-value-group">
            <p class="reading ${latestGlucoseTone}">${view.latest.sgv} <span>mg/dL</span> <span class="direction-arrow ${latestDirectionTone}">${escapeHtml(extendedDirection ? copy.noData : latestDirection)}</span></p>
            ${latestDelta ? `<p class="reading-delta ${latestDeltaTone}">${latestDelta}</p>` : ""}
          </div>
          <div class="pill-stack">
            <p class="reading-meta">${copy.readingAge}: ${latestAge}</p>
          </div>
        </div>
        <p class="freshness">${readingStatus}</p>
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
          <p class="eyebrow">${copy.treatment}</p>
          <h2>${copy.latestTreatment}</h2>
        </div>
        <div class="reading-row">
          <p class="reading treatment-reading">${
          typeof view.latestTreatment.insulin === "number"
            ? `${view.latestTreatment.insulin} <span>U</span>`
            : `<span>${copy.noInsulin}</span>`
        }</p>
          <div class="pill-stack">
            <p class="pill">${copy.treatmentAge}: ${latestTreatmentAge}</p>
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
        color-scheme: light;
        --text: #183344;
        --muted: #506474;
        --line: #dce5e9;
        --blue: #145fa8;
        --green: #16734b;
        --gold: #8b570c;
        font-size: 16px;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px 16px;
        background: #f3f6f7;
        color: var(--text);
        font-family: "Segoe UI", "Helvetica Neue", sans-serif;
        line-height: 1.5;
      }
      main { max-width: 720px; margin: 0 auto; }
      h1, h2, h3, p { margin: 0; }
      h2 { font-size: 1rem; font-weight: 650; letter-spacing: -0.01em; }
      h3 { font-size: 1rem; margin: 16px 0 8px; }
      p, code, time, li { overflow-wrap: anywhere; }
      .brand-bar { margin-bottom: 16px; }
      .brand-lockup { display: flex; align-items: center; gap: 12px; }
      .brand-mark { font-size: 1.25rem; font-weight: 750; letter-spacing: -0.04em; }
      .brand-mark span { color: var(--blue); }
      .brand-mark small { font-size: 0.7rem; letter-spacing: 0.08em; color: var(--muted); margin-left: 8px; }
      .brand-mark-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); }
      .layout { display: grid; gap: 12px; }
      .panel { padding: 20px; border: 1px solid var(--line); border-radius: 16px; background: #fff; min-width: 0; }
      .panel-header { margin-bottom: 12px; }
      .eyebrow { display: none; }
      .reading-panel { border-top: 3px solid var(--blue); }
      .reading-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; }
      .reading-value-group { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
      .reading { font-size: clamp(2.5rem, 7vw, 3.25rem); font-weight: 750; line-height: 1.1; letter-spacing: -0.04em; }
      .reading span { font-size: 0.85rem; font-weight: 550; letter-spacing: 0; }
      .reading .direction-arrow { font-size: 1.75rem; }
      .reading-delta { font-size: 1rem; font-weight: 650; }
      .is-range, .is-flat, .is-down { color: var(--green); }
      .is-low, .is-high { color: var(--gold); }
      .is-up { color: var(--blue); }
      .is-muted, .is-neutral { color: var(--muted); }
      .pill-stack { min-width: 0; }
      .reading-meta, .pill { color: var(--muted); font-size: 0.875rem; }
      .freshness { margin-top: 12px; font-size: 0.875rem; font-weight: 650; }
      .disclaimer { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); font-size: 0.75rem; color: var(--muted); }
      .treatment-panel { border-left: 3px solid var(--blue); }
      .treatment-reading { font-size: 1.75rem; }
      .treatment-type { margin-top: 8px; font-weight: 650; }
      .treatment-date { margin-top: 8px; font-size: 0.875rem; color: var(--muted); }
      .treatment-details { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
      .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      .detail-line { font-size: 0.875rem; }
      .detail-line strong { font-weight: 650; }
      .hint, .panel-copy, .repo-body { margin-top: 8px; color: var(--muted); font-size: 0.875rem; }
      .future-warning { margin-top: 12px; padding: 12px; background: #fff4de; color: #704807; border-radius: 8px; font-size: 0.875rem; }
      details { margin-top: 12px; }
      summary { cursor: pointer; color: var(--blue); font-weight: 650; font-size: 0.875rem; min-height: 36px; padding: 8px 0; }
      details > p, details > .detail-grid { margin-top: 12px; }
      summary:hover { text-decoration: underline; text-underline-offset: 3px; }
      .status-panel { margin-top: 12px; background: #eef3f5; }
      .status-panel-top { display: none; }
      .status-actions { margin-bottom: 16px; }
      .status-label { font-size: 0.875rem; font-weight: 650; }
      .repo-title { display: none; }
      .repo-link { display: inline-block; margin-top: 12px; }
      .setup { background: #eef6ff; border-color: #bdd4e9; }
      .setup-ready { background: #f0faf4; border-color: #bddcc9; }
      code { display: block; margin-top: 12px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: #f6f8f9; color: var(--text); white-space: pre-wrap; font-size: 0.875rem; }
      button { margin-top: 16px; padding: 12px 16px; border: 0; border-radius: 8px; background: var(--blue); color: #fff; font: inherit; font-weight: 650; cursor: pointer; }
      a { color: var(--blue); font-weight: 650; text-underline-offset: 3px; }
      :focus-visible { outline: 3px solid var(--blue); outline-offset: 4px; border-radius: 4px; }
      ul { margin: 8px 0; padding-left: 20px; font-size: 0.875rem; }
      @media (max-width: 720px) {
        body { padding: 16px 12px; }
        .panel { padding: 16px; }
        .detail-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="brand-bar">
        <div class="brand-lockup">
          <span
            class="brand-mark-dot is-${serviceState.tone}"
            role="img"
            aria-label="${serviceState.label}"
            title="${serviceState.label}"
          ></span>
          <h1 class="brand-mark">Gluco<span>Easy</span> <small>CGM</small></h1>
        </div>
      </div>
      <div class="layout">
        ${setupBlock}
        ${latestBlock}
        ${latestTreatmentBlock}
        ${receptionBlock}
      </div>
      <section id="service-info" class="panel status-panel">
        <div class="status-panel-top">
          <div class="status-heading">
            <p class="eyebrow">${copy.system}</p>
            <div class="status-title-row">
              <p class="system-name">${copy.title}</p>
              <div class="status-badge">${copy.status}</div>
            </div>
          </div>
        </div>
        <div class="status-actions">
          <a id="status-link" class="status-link" href="/api/v1/status.json">${copy.viewStatusJson}</a>
        </div>
        <div class="status-card repo-card">
          <div class="repo-copy">
            <p class="status-label">${copy.openSource}</p>
            <p class="repo-title">${locale === "es" ? "Código de GlucoEasy" : "GlucoEasy source code"}</p>
            <p class="repo-body">${copy.openSourceBody}</p>
          </div>
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
