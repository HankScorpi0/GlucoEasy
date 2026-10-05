# Implementation evidence

Fecha: 2026-10-05. Rama: `004-redesign-homepage`.

## Entorno y preparación

- Node v24.19.0 disponible en el runtime local de Codex; no está en PATH. Dependencias del lockfile ya instaladas. Sin instalaciones ni cambios del lockfile.
- npm/npx no disponibles en esta consola. Se ejecutan sus mismos entrypoints locales con Node: `node node_modules/vitest/vitest.mjs run` y `node node_modules/typescript/bin/tsc --noEmit`.
- Prueba inicial: `test/health.test.ts`, 8/8 aprobadas.
- `.gitignore` cubre dependencias, build, logs, secretos locales y archivos temporales; paquete privado, sin publicación npm ni otros ignore files necesarios.

## Matriz de validación

ES/EN; lectura reciente/antigua/vacía/solo futura; tratamiento presente/ausente/insulina cero; tipo, notas y dirección extensos/maliciosos; recepción disponible/ausente/rechazos/saturación; sesión autorizada/otra sesión/configuración confirmada; anchos 360 × 800, 768 y 1440, ampliación 200 %, teclado y contraste; refresco con detalles abiertos/cerrados, foco y scroll, APIs de almacenamiento bloqueadas; red sin recursos externos ni peticiones adicionales. Todo con fixtures sintéticos.

## Implementación y pruebas

- Se conservan rutas, autorización, selección de datos, unidades, umbrales de actualidad y persistencia; no hay cambios de bindings, migraciones o configuración.
- Jerarquía visual y documental: lectura/actualidad, tratamiento, recepción y servicio. Configuración pendiente conserva prioridad temporal. Aviso informativo junto a lectura, fuera del desplegable.
- Resumen de tratamiento con tipo, fecha localizada, antigüedad e insulina cuando existe; cero permanece cero. Notas completas a continuación. Tipos extensos se resumen con acceso al valor completo mediante desplegable nativo; direcciones extensas/desconocidas se escapan y conservan acceso a su texto completo.
- Diagnóstico cerrado inicialmente, con resumen y avisos visibles fuera. Cifras, categorías, saturación y alcance de observación conservados.
- Continuidad: metadatos de un solo uso por pestaña, fallback de historial sin cambiar URL, IDs de foco constantes, validación de ruta/tiempo/rangos y limpieza. Se restaura únicamente tras navegación de tipo recarga; visitas independientes empiezan cerradas. No se almacenan datos médicos, texto externo, credenciales ni URL completas.
- Las pruebas nuevas se escribieron antes del cambio correspondiente: se observaron cuatro fallos iniciales de jerarquía/fecha/escape y dos fallos de desplegable antes de implementar esas funciones. Tras corrección, pasan.
- Resultado final: **6 archivos de pruebas, 85 pruebas aprobadas** mediante `node node_modules/vitest/vitest.mjs run` (equivalente al script `npm run test`).
- TypeScript: **sin errores**, `node node_modules/typescript/bin/tsc --noEmit` (equivalente a `npx tsc --noEmit`).
- Integración `SELF.fetch`: ambas variantes, configuración autorizada/otra sesión/confirmación, acceso privado rechazado y enlaces existentes; pruebas de escape, actualidad, futuro y saturación preservadas. Pruebas de script: registro de campos UI exclusivamente, corrupción/caducidad/ruta, APIs bloqueadas y control desaparecido.

## Verificación de navegador

Chrome 154.0.8037.92 y Edge 154.0.4258.53, headless con Playwright disponible en el runtime; no se añadió dependencia al proyecto. Fixtures sintéticos renderizados por `renderHealthPage` en un servidor local temporal; el comportamiento Worker–Durable Object se valida por separado en la suite de integración.

- **108 casos**: 2 navegadores × 2 idiomas × 3 anchos (360, 768, 1440) × 9 estados (reciente, vacío, texto largo, antiguo, futuro, diagnóstico ausente, insulina cero, rechazado, configuración pendiente). Orden correcto, sin desplazamiento horizontal, detalles inicialmente cerrados.
- A 360 × 800, el borde inferior del resumen del tratamiento en casos ordinarios está a 458 px en inglés y 487 px en español; el máximo con tipo y dirección extensos es **584 px**, dentro del viewport. Estados vacíos también caben. Las capturas finales se regeneraron tras los últimos ajustes y se volvieron a medir 14 casos móviles en Chrome.
- Reflujo ensayado con `body.style.zoom=2` y, separadamente, tamaño raíz de texto a 32 px (200 %); sin desbordamiento en ambos idiomas/navegadores con contenido largo. No se afirma una prueba de zoom de la interfaz nativa del navegador ni de un dispositivo físico.
- Teclado: Tab recorre los cinco controles de dirección/tipo completo, recepción, estado y repositorio en orden con foco visible. Enter abre recepción y espacio la cierra. Desplegable usable sin JavaScript en ambos navegadores; fechas ISO permanecen como fallback.
- Contraste medido sobre colores computados y fondos opacos de los casos ensayados con detalles abiertos; mínimo **5,49:1**, por encima de 4,5:1 normal y 3:1 grande.
- **8 recargas reales**: abierto/cerrado y almacenamiento normal/bloqueado en ambos navegadores. Foco y scroll preservados exactamente; registro consumido tanto en almacenamiento como historial. Ningún error de página observado.
- Pruebas reales adicionales en Chrome: enlace secundario conserva foco, control desaparecido usa el resumen de recepción como fallback y contenido más corto mantiene posición acotada. Con ambas APIs bloqueadas, la lectura sigue visible y la página se actualiza sin excepción; apertura/foco/posición no se conservan, según la excepción de FR-003.
- Red: comparación con el renderer original de HEAD usando el mismo servidor de fixtures. Carga inicial + un refresco = **2 solicitudes de documento antes y después**, sin solicitudes de recursos externos de interfaz.

Resultados detallados: [validation-results.json](validation-results.json). Scripts auxiliares y servidor usados para validación se mantienen en `.wrangler/`, ignorado por Git; los escenarios reproducibles están en [quickstart.md](quickstart.md).

## Capturas y documentación

- [Móvil ES](../../docs/images/003-redesign-homepage/health-es.png) y [móvil EN](../../docs/images/003-redesign-homepage/health-en.png).
- [Escritorio ES](../../docs/images/003-redesign-homepage/health-es-desktop.png) y [escritorio EN](../../docs/images/003-redesign-homepage/health-en-desktop.png).
- README.md y README.es.md describen la misma jerarquía, visibilidad inicial, desplegable, continuidad y limitación de almacenamiento; conservan advertencia informativa y exposición por READ_PUBLIC=true.
- Capturas con datos sintéticos únicamente; ninguna pantalla de revelación de credenciales se incluye.

## Cobertura y cierre

| Requisitos/criterios | Evidencia | Estado |
|---|---|---|
| FR-001/002/005, SC-002 | Contratos y matriz de navegador | Validado técnicamente |
| FR-003 | Contratos, scripts y recargas normales/bloqueadas | Validado, incluida excepción documentada |
| FR-004/011, SC-006 | Suite de acceso/configuración/escape y scripts | Validado técnicamente |
| FR-006/007, SC-003 | Dimensiones, capturas y reflujo 200 % | Validado en condiciones de navegador descritas |
| FR-008/009, SC-004 | Teclado, nombres nativos, foco, contraste y paridad | Validado en navegadores ensayados |
| FR-010/012 | Aviso visible y revisión de alcance del diff | Validado técnicamente |
| SC-001/005 | Evaluación con al menos cinco personas | **Pendiente, T016** |

La implementación técnica y documentación quedan completas; no se declara cierre total ni cumplimiento de usabilidad humana. [usability.md](usability.md) prepara el protocolo y registra la ausencia de participantes/resultados. Ninguna tarea técnica depende de completar esa evaluación, pero T016 es obligatoria para cerrar totalmente la feature.

Impacto: ningún cambio de datos almacenados, contratos de cliente, retención o identidad del Durable Object. Sin dependencias ni peticiones adicionales. La validación previa a la publicación mediante `wrangler deploy --dry-run` pasó correctamente. Durante la fase de implementación no se publicó el Worker.
