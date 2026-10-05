# Implementation Plan: Página principal compacta y jerarquizada

**Branch**: `004-redesign-homepage` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-redesign-homepage/spec.md`

## Summary

Rediseñar la página de estado en este orden: lectura y actualidad, último tratamiento, recepción e información secundaria. En 360 × 800 píxeles, tras completar configuración, lectura y resumen del tratamiento visibles sin desplazamiento. Notas completas después del resumen; detalles técnicos de recepción cerrados inicialmente y avisos siempre visibles. Configuración pendiente conserva prioridad temporal.

Mantener HTML, CSS y JavaScript integrado en `src/health.ts`, con fuentes locales, una columna y elementos nativos `details`/`summary`. Conservar recarga periódica y restaurar apertura, foco y scroll con metadatos de presentación de un solo uso. No introducir dependencias, endpoints ni persistencia de datos clínicos en navegador. Esta fase entrega diseño, sin modificar la interfaz.

## Technical Context

**Language/Version**: TypeScript estricto 6.0.3 según lockfile, objetivo ES2022; JavaScript de navegador integrado.

**Primary Dependencies**: Workers, Durable Objects, Wrangler y Vitest con `@cloudflare/vitest-pool-workers` existentes. Ninguna dependencia nueva.

**Storage**: Durable Object sin cambios de identidad, claves o esquema. Metadatos efímeros por pestaña en `sessionStorage`, con fallback de `history.state` si el almacenamiento está bloqueado; nunca datos médicos o credenciales.

**Testing**: `test/health.test.ts` para renderizado y scripts con dobles; `test/api.test.ts` con `SELF.fetch` para acceso/configuración. Navegador real para medidas, recargas, foco, teclado, zoom y contraste.

**Target Platform**: Workers y navegadores modernos de móvil/escritorio. Datos renderizados y desplegable utilizables sin JavaScript.

**Project Type**: Servicio web con página de estado renderizada en servidor.

**Performance Goals**: Cero peticiones adicionales por refresco y cero recursos externos de interfaz. Conservar intervalo configurado y mínimo actual de cinco segundos. Usabilidad según SC-001 y SC-005, pendiente de evaluación con personas.

**Constraints**: Orden vertical visual y semántico en todos los anchos; contraste 4,5:1 normal y 3:1 grande; zoom 200 % sin pérdida; aviso informativo junto al área principal. No modificar selección de datos, unidades, umbrales, autenticación ni retención.

**Scale/Scope**: Una instalación, `/health` y `/es/health`, con redirección existente de `/`. Cambios en presentación, pruebas, capturas sintéticas y ambas guías.

## Constitution Check

*GATE: PASS antes de investigación y después del diseño. Sin excepciones. Evalúa el diseño, no certifica implementación futura.*

| Principio | Diseño y validación | Antes | Después |
|---|---|---|---|
| I. Respaldo informativo | Aviso fuera del desplegable junto a lectura/tratamiento; ninguna recomendación terapéutica | PASS | PASS |
| II. Compatibilidad | Rutas, payloads y autenticación Nightscout preservados; suite e integración existentes | PASS | PASS |
| III. Integridad | Selección y evaluación existentes; vacío, antiguo y futuro explícitos; sin migración | PASS | PASS |
| IV. Privacidad | Acceso antes de renderizado, revelación limitada, escape y estado UI sin datos sensibles | PASS | PASS |
| V. Simplicidad | Sin dependencias/servicios nuevos; pruebas, tipos, revisión visual bilingüe y guías equivalentes | PASS | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/003-redesign-homepage/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/health-page.md
└── checklists/requirements.md
```

`tasks.md` corresponde a la siguiente fase, `$speckit-tasks`.

### Source Code (repository root)

```text
src/
├── health.ts          # HTML, CSS, textos y script de continuidad
├── types.ts           # HealthViewModel existente
├── reception.ts       # evaluación reutilizada
├── index.ts           # rutas/acceso preservados
└── durable-object.ts  # persistencia preservada
test/
├── health.test.ts
└── api.test.ts
docs/images/           # capturas durante implementación
README.md
README.es.md
```

**Structure Decision**: Mantener arquitectura actual; funciones locales para bloques cuando reduzcan repetición. No crear frontend independiente. Las transformaciones y evaluación siguen en módulos existentes.

## Design and Delivery Sequence

1. Ordenar HTML como configuración pendiente, lectura, tratamiento, recepción y servicio; introducir IDs constantes. Mostrar actualidad explícita junto a lectura y fecha localizada del tratamiento con `time[datetime]`. Mover aviso informativo al área principal.
2. Separar resumen del tratamiento (tipo, fecha e insulina si existe) y notas completas. Textos extensos usan ajuste o resumen visual acotado con acceso al valor completo en el mismo bloque. No alterar valores; cero de insulina no equivale a ausencia.
3. Simplificar CSS: fuente local base 16 px; fondo claro y paneles opacos con bordes discretos; espaciado 8/12/16/24 px. En móvil, margen 12 px y relleno de paneles 12–16 px; quitar contenedor decorativo anidado y rótulos redundantes. Glucosa con mayor tamaño; tratamiento más destacado que diagnóstico.
4. Presupuesto inicial a 360 × 800: marca hasta 56 px, lectura con aviso hasta 220 px y resumen del tratamiento hasta 160 px, más márgenes. Verificar ambos idiomas y casos vacíos; notas no necesitan estar en primer viewport. Zoom 200 % admite desplazamiento vertical, sin perder contenido.
5. Recepción en `details`/`summary`: fuera quedan disponibilidad, actualidad y avisos de rechazo/futuro/diagnóstico ausente; dentro, todos los detalles y límites actuales. Primera visita cerrada.
6. Antes de recarga automática, capturar metadatos de apertura, foco permitido y scroll en registro de un solo uso. Restaurar tras localizar fechas: apertura, foco sin scroll automático, posición acotada. Usar `sessionStorage` y fallback de historial sin cambiar URL; validar, consumir y borrar. No capturar durante configuración. Ver [research.md](research.md).
7. Probar renderizado, acceso, escape y scripts; revisar interacción y medidas en navegador; guardar capturas ES/EN sintéticas y actualizar ambas guías. Medir usabilidad con al menos cinco personas.

## Validation and Risks

- Ejecutar `npm run test` y `npx tsc --noEmit` al implementar. Dry deploy obligatorio solo si cambian configuración, bindings o migraciones; no previstos.
- No inferir composición desde cadenas HTML: medir que el resumen del tratamiento cabe en 360 × 800; revisar 768/1440 px, textos extensos, contraste y zoom.
- Riesgo principal: pérdida de continuidad al recargar o cambiar altura. Restaurar detalles antes del foco/scroll, acotar coordenadas y tratar control desaparecido con fallback seguro. Probar recarga real y almacenamiento bloqueado.
- Si fallan almacenamiento e historial, página y recarga deben seguir funcionando sin excepción; registrar limitación de continuidad, sin afirmar cumplimiento completo del escenario afectado.
- No cambios de datos, API o migraciones; conservar documentación de exposición `READ_PUBLIC=true`.
- Criterios de usabilidad pendientes hasta evaluación; no sustituir usuarios por comprobación técnica.

## Complexity Tracking

Sin violaciones constitucionales ni excepciones requeridas.
