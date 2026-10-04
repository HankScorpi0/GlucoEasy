# Implementation Plan: Base existente de GlucoEasy

**Branch**: `001-baseline-backup-service` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-baseline-backup-service/spec.md`

**Status**: Plan retrospectivo documentado; pendiente de revisión del responsable. No autoriza implementar ni desplegar las brechas detectadas.

## Summary

Este plan documenta el stack y diseño ya implementados para el respaldo informativo reciente de GlucoEasy: un Worker coordina HTTP y autenticación, un Durable Object conserva datos y configuración, helpers separados normalizan y consultan, y una página HTML presenta estado en español o inglés.

La referencia de código es el commit `728af291c77c9cabd8396d8335b92181cea00564`; `e874a87` incorpora su spec retrospectiva. Se completan las fases 0 y 1 documentales de Spec Kit, sin reconstruir el servicio ni corregir comportamiento. Los motivos inferidos no se presentan como historial de decisiones.

## Technical Context

**Language/Version**: TypeScript 6.0.3 según `package-lock.json`. `strict: true`, destino y módulos ES2022, resolución Bundler y `noEmit`. HTML/CSS y script de refresco embebidos.

**Primary Dependencies**: Wrangler 4.99.0, `@cloudflare/workers-types` 4.20260611.1, Vitest 4.1.8 y `@cloudflare/vitest-pool-workers` 0.16.14. Todas son devDependencies; no hay dependencias de ejecución declaradas. `package.json` declara `latest`; `npm ci` reproduce el lockfile. No se afirman versiones actuales del mercado.

**Storage**: `EntriesDurableObject`, binding `ENTRIES_DO`, identidad `idFromName("global")`; API `ctx.storage.get/put` con claves `entries`, `treatments`, `profile`, `setup`. Migración Wrangler `v1` con `new_sqlite_classes`: backend SQLite sin tablas o consultas SQL propias.

**Testing**: Vitest con plugin `cloudflareTest` y entorno Workers. Helpers en `test/entries.test.ts`, `test/treatments.test.ts`, `test/auth.test.ts`; integración en `test/api.test.ts` mediante `SELF.fetch`, con `reset()` tras cada prueba. Tipos mediante `tsc --noEmit` y bundle mediante Wrangler dry-run.

**Target Platform**: Cloudflare Workers y Durable Objects; `compatibility_date: "2026-06-10"`, `workers_dev: true`, `preview_urls: false`. Node 22.x para herramientas locales satisface los engines de Wrangler y Vitest observados en el lockfile; Node no es el servidor de producción.

**Project Type**: Servicio HTTP con estado renderizado en servidor; sin SPA, framework de rutas o build frontend independiente. Wrangler empaqueta la aplicación; no existe script `build`.

**Performance Goals**: No hay metas numéricas medidas de latencia, throughput o disponibilidad. Se documentan retención acotada y refresco predeterminado de 30 segundos; no se prometen costes constantes, capacidad ilimitada o validez clínica.

**Constraints**: Cuerpo máximo 256 KiB, 2000 registros por colección por defecto, perfil único, ventana de consulta de tratamientos de 24 horas. Se mantienen credenciales literal/SHA-1/Basic Auth y secreto generado de seis caracteres. `READ_PUBLIC=true` en Wrangler expone datos a quien conoce la URL; las pruebas usan `false`. Sin infraestructura externa nueva.

**Scale/Scope**: Una instalación y un conjunto compartido de datos; sin cuentas o aislamiento entre pacientes. Filtrado y combinación procesan arrays completos en memoria. Retención limita registros, no bytes; el perfil no tiene límite independiente de conservación en bytes.

## Constitution Check

*Revisión previa a fase 0 y posterior a fase 1, contra constitución 1.0.0.*

| Principio | Entrega documental | Estado de la base |
| --- | --- | --- |
| I. Alcance informativo | Conforme: respaldo sin dosis ni análisis clínico. | Aviso explícito ausente en página, GAP-003. |
| II. Compatibilidad | Conforme: conserva contratos y registra escenarios existentes. | Cobertura completa no certificada; DELETE no anunciado por CORS, GAP-006. |
| III. Integridad | Conforme: documenta reglas sin cambiar datos o identidad. | Coerción de glucosa y perfil sin validación, GAP-002/GAP-007; límites parcialmente cubiertos, GAP-008. |
| IV. Credenciales | Conforme: exposición pública explícita y sin secretos reales nuevos. | Escape HTML ausente, GAP-001; riesgo en errores, GAP-004; pruebas de acceso incompletas, GAP-005. |
| V. Simplicidad | Conforme: stack y capas existentes, sin nuevas dependencias. | Revisión estática; pruebas, tipos y despliegue no ejecutados en esta entrega. |

**Gate previo**: Investigación y documentación retrospectivas permitidas por el flujo constitucional que exige registrar brechas existentes. No se certifica cumplimiento de producto ni se concede excepción. Un plan que proponga implementar violaciones sin corregirlas o justificar una excepción expresa no supera el gate.

**Gate posterior**: El diseño documental no cambia producto, infraestructura ni datos; conserva el mismo resultado. Las brechas quedan abiertas en [evidence.md](evidence.md). No hay aprobación para implementarlas como comportamiento deseado.

## Project Structure

### Documentation (this feature)

```text
specs/001-baseline-backup-service/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts.md
  contracts/
    README.md
    durable-object.md
  evidence.md
  checklists/requirements.md
```

El contrato público canónico permanece en `contracts.md`; `contracts/` lo enlaza y añade la interfaz interna. No se crea `tasks.md` ni se simulan tareas históricas completadas. Las correcciones requieren alcance propio.

### Source Code (repository root)

```text
src/
  index.ts
  durable-object.ts
  entries.ts
  treatments.ts
  auth.ts
  health.ts
  types.ts
  responses.ts
test/
  api.test.ts
  auth.test.ts
  entries.test.ts
  treatments.test.ts
wrangler.jsonc
vitest.config.ts
tsconfig.json
package.json
package-lock.json
```

**Structure Decision**: Proyecto único. `index.ts` coordina rutas, secreto y cuerpos; `auth.ts` credenciales/CORS; `entries.ts` y `treatments.ts` transformaciones y consultas; `durable-object.ts` persistencia; `health.ts` renderizado; `types.ts` interfaces y `responses.ts` respuestas.

### Flujos y decisiones operativas

1. Escritura: autenticar, comprobar cuerpo, parsear y normalizar lote completo en Worker; combinar, ordenar, truncar y guardar en DO. Perfil reemplaza el documento sin validación estructural actual.
2. Consulta: autenticar y construir filtros en Worker; DO recupera colección y filtra en memoria. No hay índices de aplicación ni paginación.
3. Estado: obtener configuración y resúmenes mediante llamadas separadas; calcular delta y renderizar idioma, antigüedad y refresco. No constituyen instantánea transaccional conjunta.
4. Setup: primera visita sin secreto manual genera secreto y token; cookie controla revelación y confirmación anula token. Secreto manual evita bootstrap y prevalece sobre persistido.
5. Persistencia: conservar clase, binding, nombre `global`, migración `v1` y cuatro claves. No requiere migración; cualquier evolución debe evaluar datos desplegados.
6. Observabilidad habilitada en Wrangler, logs de metadatos y resultados. No se afirma saneamiento exhaustivo de errores; GAP-004 sigue abierto.

## Complexity Tracking

No se añade complejidad ni se solicita excepción constitucional para documentación. Las brechas no se justifican como decisiones necesarias: deben resolverse en nuevas features con aceptación, impacto en datos y compatibilidad y pruebas proporcionales.

## Validation and handoff

Fase 0: [research.md](research.md). Fase 1: [data-model.md](data-model.md), [contracts/README.md](contracts/README.md), [quickstart.md](quickstart.md). La validación de esta entrega consiste en coherencia, enlaces y resolución de feature de Spec Kit; no exige pruebas de aplicación al ser documental. La guía no es un registro de ejecución.

El siguiente cambio funcional sigue `specify → clarify` cuando proceda, `plan → tasks → analyze → implement`. La baseline describe el punto de partida sin sustituir el plan de cada feature.
