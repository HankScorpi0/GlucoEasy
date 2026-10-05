# Research: Página principal

**Date**: 2026-10-05. Base: especificación, constitución y código; decisiones de diseño, no resultados medidos.

## Renderizado y estilo

**Decision**: Mantener HTML/CSS/script en `src/health.ts`, fuentes locales y una columna ordenada en todos los anchos.

**Rationale**: `HealthViewModel` ya contiene lo necesario. El HTML actual sitúa recepción antes de lectura; rellenos de body/main/paneles y diagnóstico completo consumen altura. Simplificar agrupación, eliminar etiquetas redundantes y separar resumen/notas permite cumplir prioridad y compactación sin alterar datos.

**Alternatives considered**: Frontend independiente, librería de componentes o tipografías remotas añaden coste sin valor funcional. Dos columnas vuelven ambigua la prioridad vertical; todas las cifras grandes compiten con lectura. Ocultar notas permanentemente pierde información.

## Desplegable y avisos

**Decision**: `details`/`summary` nativos cerrados inicialmente; resumen y avisos fuera, cifras y limitaciones dentro. Aviso informativo junto al área principal.

**Rationale**: Respeta respuesta A y conserva teclado y funcionamiento sin script. Todos los detalles actuales de `renderReceptionPanel` siguen accesibles.

**Alternatives considered**: Diagnóstico abierto consume altura; acordeón propio añade semántica/teclado a mantener; eliminar cifras pierde diagnóstico.

## Continuidad de recarga

**Decision**: Conservar temporizador y `location.reload()` existentes, incluida pausa en configuración. Guardar registro UI solo justo antes del refresco, consumirlo al restaurar. `sessionStorage` con fallback de `history.replaceState` sin argumento URL. Campos limitados a versión, ruta permitida, tiempo, booleano de apertura, scroll y ID de foco constante permitido.

**Rationale**: Investigación delegada confirmó que hoy no hay restauración. La persistencia por pestaña evita compartir preferencias; el consumo evita que visitas nuevas aparezcan abiertas. Abrir detalle tras localizar fechas y antes de foco/posición; `focus({preventScroll:true})` evita desplazamiento inducido. Manejar registros corruptos y APIs bloqueadas.

**Alternatives considered**: `localStorage` conserva preferencias entre visitas; fetch y parcheado de DOM amplían manejo de errores/autorización; pausar refresco indefinidamente deja datos antiguos. Guardar en todo unload restaura posiciones de navegación ordinaria indebidamente.

**Sources**: Documentación primaria de [sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage), [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) y [replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState). Evidencia local: `src/health.ts` temporizador, `test/api.test.ts` comprobación de recarga y `test/health.test.ts` localización aun durante configuración.

## Datos, acceso y pruebas

**Decision**: Reutilizar selección y `evaluateReception`; no cambiar umbrales, unidades, rutas, autenticación, configuración, esquemas ni retención. Tests proporcionados de contratos/scripts más revisión real bilingüe y evaluación con cinco personas.

**Rationale**: `src/index.ts` autoriza antes del snapshot y excluye lecturas futuras; tests actuales cubren tiempos, escape, saturación y diagnóstico. No prueban altura, foco o continuidad real. Mantener cookies/secreto fuera del registro UI.

**Alternatives considered**: Endpoints nuevos o cálculos clínicos no pertenecen al alcance. Snapshots completos de HTML no demuestran composición; no se necesita nueva dependencia de navegador para revisión manual reproducible.

## Unknowns

Sin decisiones bloqueantes pendientes. Dimensiones, contraste y usabilidad se verificarán durante implementación contra criterios definidos; no se consideran satisfechos por este plan.
