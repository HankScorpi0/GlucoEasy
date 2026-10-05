# Implementation Plan: Diagnóstico de recepción

**Branch**: `002-reception-diagnostics` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-reception-diagnostics/spec.md`

## Summary

Separar disponibilidad, último envío aceptado y actualidad de lecturas exclusivamente en `/health` y `/es/health`. Añadir metadatos mínimos al Durable Object existente, guardar aceptación y datos conjuntamente, contar rechazos por petición y evaluar fechas futuras en cada consulta. Mantener StatusPayload, rutas Nightscout, identidad del almacenamiento, autenticación y retención.

## Technical Context

**Language/Version**: TypeScript 6.0.3, strict, ES2022; versiones verificadas en package-lock.json.

**Primary Dependencies**: Wrangler 4.99.0, Vitest 4.1.8, @cloudflare/vitest-pool-workers 0.16.14 y workers-types existentes; sin dependencias nuevas.

**Storage**: EntriesDurableObject con backend SQLite y API KV asíncrona. Dos claves aditivas: reception-summary y entry-receipts.

**Testing**: Vitest para helpers, SELF.fetch para integración y reset entre casos; inspección de almacenamiento y captura de logs con datos sintéticos.

**Target Platform**: Cloudflare Workers; compatibility_date actual 2026-06-10.

**Project Type**: Servicio web y páginas HTML renderizadas en servidor.

**Performance Goals**: Metadatos disponibles en la consulta siguiente a la respuesta del envío y tras el refresco normal, 30 segundos por defecto. Evaluación O(N); asociación de recepciones con mapas temporales O(N + M), donde M es el lote normalizado.

**Constraints**: Cuerpos limitados a 256 KiB; N según MAX_ENTRIES, 2000 por defecto. Resumen constante y recepciones O(N), sin historial ni servicios externos. Permisos y excepción de sesión de configuración existentes.

**Scale/Scope**: Una instalación por DO global, tres colecciones de envío y dos páginas localizadas. Sin alertas, nuevos endpoints públicos ni funcionalidades clínicas.

## Constitution Check

Evaluación contra constitución 1.0.0 antes de investigación y después del diseño.

| Principio | Antes | Después / evidencia exigida |
|---|---|---|
| I. Respaldo informativo | Pasa | Textos operativos y aviso informativo, sin recomendaciones clínicas |
| II. Compatibilidad | Pasa | Snapshot separado; códigos y formatos existentes; regresiones de aliases, lotes, perfiles y autenticación |
| III. Integridad y persistencia acotada | Pasa | Transacciones, poda por retención, legado desconocido y futuras sin alterar almacenamiento |
| IV. Credenciales y exposición | Pasa | Permisos existentes, lista permitida de metadatos y saneamiento de logs/errores afectados |
| V. Simplicidad y calidad | Pasa | Mismo DO, helpers puros, sin dependencias nuevas, pruebas, guías bilingües y capturas |

Sin excepciones. Estas conclusiones evalúan el diseño; la implementación deberá aportar resultados de las comprobaciones.

## Project Structure

### Documentation (this feature)

```text
specs/002-reception-diagnostics/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/health-diagnostics.md
  contracts/internal-reception.md
  checklists/requirements.md
```

tasks.md se generará con speckit-tasks, fuera de este comando.

### Source Code (repository root)

```text
src/
  index.ts               # autorización, errores y coordinación
  durable-object.ts      # persistencia atómica y snapshot privado
  reception.ts           # nuevo: transformaciones diagnósticas puras
  entries.ts             # normalización, deduplicación y consultas
  treatments.ts          # contratos existentes
  types.ts               # tipos internos, StatusPayload sin cambios
  health.ts              # indicadores y textos EN/ES
  auth.ts
  responses.ts
test/
  reception.test.ts      # nuevo: tiempo, procedencia y recuentos
  health.test.ts         # nuevo: estados localizados y escape
  api.test.ts            # integración y compatibilidad
  entries.test.ts
  treatments.test.ts
  auth.test.ts
README.md
README.es.md
docs/images/
```

**Structure Decision**: Mantener responsabilidades actuales. reception.ts aísla reglas diagnósticas; normalización y consultas continúan en sus módulos.

## Implementation Design

1. Crear tipos y helpers puros de actualidad, procedencia y recuentos; no añadir campos de recepción a CgmEntry ni objetos Nightscout.
2. Incorporar inicialización perezosa y transacciones al DO: datos, recepciones y último envío se guardan juntos; cada rechazo incrementa una categoría. Snapshot exclusivo de health, sin modificar /snapshot.
3. Separar fases de parseo/tamaño, validación y almacenamiento en Worker. Un solo punto registra cada rechazo antes de devolver su respuesta. Mantener códigos existentes, incluido 400 para exceso de tamaño; no inferir categoría del HTTP.
4. Sustituir logs de envíos con cabeceras, User-Agent, nombre de perfil o excepciones arbitrarias por colección/ruta canónica, resultado y recuentos permitidos. Mensajes seguros propios para errores de parser y fallos inesperados; mantener envoltorio error, códigos y mensajes estáticos de validación. Documentar saneamiento de mensajes en las guías.
5. Incorporar snapshot tras autorización y usar un instante común de evaluación. La lectura y el delta de health usan referencias no futuras; ajustar el antiguo rótulo Service active para que no contradiga disponibilidad y actualidad separadas. Mantener setup y revelación del secreto.
6. Verificar matriz de quickstart, actualizar ambas guías y aportar screenshots sintéticas EN/ES.

## Data Impact and Operational Cost

- Misma clase, binding, idFromName("global") y claves de datos. No migración Wrangler ni borrado: claves nuevas inicializadas en primera interacción observada. Legado mantiene recepción null incluso al reintentarse.
- Envío de lecturas: escritura existente más mapa podado y resumen, en una transacción. Tratamiento/perfil: añadir resumen a escritura. Cada rechazo requiere una llamada interna y actualización; aumenta coste también con credenciales inválidas. No añadir límites nuevos que pierdan recuentos ni prometer gratuidad.
- Health sustituye snapshot de lecturas por uno que lee datos y metadatos coherentemente; mantiene polling actual.
- Rollback de código deja claves aditivas sin exponerlas. Si una versión revertida deja de observar envíos, al reactivar establecer explícitamente nueva época diagnóstica; no anunciar continuidad durante el intervalo sin observación. No borrar datos ordinarios.

## Validation and Completion

Después de implementación ejecutar npm run test y npx tsc --noEmit. Exigir npm run cf:deploy:dry si cambia configuración/bindings/migraciones; recomendable para bundle final sin publicar. Revisar EN/ES, escape, screenshots, privacidad, coste y límites en las guías. Escenarios concretos en [quickstart.md](quickstart.md).

Esta fase solo modifica documentación. Node no está en PATH de la sesión consultada; la implementación debe localizar instalación válida o preparar entorno antes de sus checks. No se afirman pruebas funcionales ejecutadas.

## Complexity Tracking

Sin violaciones que justificar. Dos claves y un módulo de helpers conservan el modelo actual sin infraestructura adicional.
