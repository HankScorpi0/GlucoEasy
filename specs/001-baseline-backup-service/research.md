# Phase 0: Decisiones técnicas de la base

Investigación estática local, incluida revisión por un agente de investigación conforme a `speckit-plan`. No se buscan nuevas versiones o recomendaciones: se documenta el checkout. No hay incógnitas técnicas necesarias para este alcance.

## R-001 — Lenguaje y ejecución

**Decision**: TypeScript estricto, ES2022 y Cloudflare Workers; Wrangler empaqueta. Evidencias: `tsconfig.json`, `package.json`, `wrangler.jsonc`.

**Rationale**: Stack existente y arquitectura fijada por principio V. Inferencia: tipos y helpers separados permiten comprobar reglas sin transporte HTTP.

**Alternatives considered**: Servidor Node, framework HTTP o cambio de lenguaje no están adoptados. No consta una comparación histórica; no se atribuye a los autores.

## R-002 — Persistencia por instalación

**Decision**: DO `global`, cuatro claves y arrays acotados; backend SQLite sin SQL de aplicación. Evidencias: `src/index.ts`, `src/durable-object.ts`, `wrangler.jsonc`.

**Rationale**: Solución observada para alcance de instalación única y datos recientes. Cada escritura procesa la colección completa. No se infieren garantías adicionales de concurrencia, cuota o transacción conjunta.

**Alternatives considered**: D1, KV/R2, tablas SQL propias u objetos por paciente no se usan. Cambiarlos exigiría especificación y evaluación de migración; no hay constancia de su evaluación histórica.

## R-003 — Interoperabilidad acotada

**Decision**: Conservar entradas, tratamientos, perfil único, estado y devicestatus vacío; credenciales literal/SHA-1/Basic Auth. Evidencias: `src/index.ts`, `src/auth.ts`, [contracts.md](contracts.md).

**Rationale**: Contratos existentes exigidos por principio II. SHA-1 es interoperabilidad, no diseño de seguridad nuevo. Perfil único y colección vacía no equivalen a Nightscout completo.

**Alternatives considered**: Nightscout completo, usuarios múltiples o nueva autenticación no forman parte del diseño existente; no se evalúan como ampliaciones en este plan.

## R-004 — Renderizado ligero

**Decision**: HTML/CSS y script de recarga embebidos, dos idiomas con modelo de vista compartido en `src/health.ts`.

**Rationale**: Diseño observado coherente con página ligera. Inferencia: evita pipeline y proyecto frontend separados. El escape HTML y aviso informativo siguen pendientes.

**Alternatives considered**: SPA y biblioteca de componentes no se usan. No se afirma que fueran descartados históricamente o mediante benchmarks.

## R-005 — Herramientas reproducibles y pruebas

**Decision**: Versiones del lockfile: TypeScript 6.0.3, Wrangler 4.99.0, Vitest 4.1.8, workers-types 4.20260611.1 y pool-workers 0.16.14. Miniflare transitivo 4.20260609.0. Instalar con `npm ci`; Vitest usa `cloudflareTest`, integración `SELF.fetch` y `reset()` tras escenarios.

**Rationale**: Reproducción del lockfile pese a declaraciones `latest`; integración con configuración Workers y limpieza de estado. Node 22.x satisface engines observados de Wrangler y Vitest. No hay build independiente, linter o formatter configurados.

**Alternatives considered**: Mock completo del almacenamiento o pruebas en producción no son la base adoptada. No se requiere sustituir herramientas para documentar el servicio.

**Limits**: No se ejecutan tests en la revisión documental. Latencia, capacidad máxima, costes y disponibilidad no están medidos ni definidos; no se inventan objetivos. Brechas y cobertura pendiente en [evidence.md](evidence.md).
