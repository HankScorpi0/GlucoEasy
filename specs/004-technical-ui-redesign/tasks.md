# Tasks: Rediseño integral con identidad técnica

**Input**: Documentos de `specs/004-technical-ui-redesign/`.
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contrato de página](contracts/health-page.md), [contrato visual](contracts/visual-design.md) y [quickstart.md](quickstart.md).
**Tests**: Se reutiliza y adapta la cobertura existente según los escenarios de la especificación y los controles obligatorios de la constitución. No se exige TDD para reglas que ya están cubiertas, snapshots completos ni pruebas que dupliquen la decoración. Las regresiones nuevas reproducibles sí requieren cobertura.
**Organization**: Historias ordenadas por prioridad, con preparación común y cierre transversal. Esta lista no implementa la interfaz ni acredita validaciones futuras.

## Format: `[ID] [P?] [Story] Description`

- `[P]` indica archivos distintos y ausencia de dependencia mutua, una vez cumplidos los prerrequisitos indicados.
- `[US1]`, `[US2]`, `[US3]` corresponden a las historias de `spec.md`. Preparación, fundamentos y cierre no llevan etiqueta de historia.
- Rutas relativas a la raíz del repositorio. Los elementos se marcan completados solo con evidencia real; consultar el estado de ejecución al final.
- Los documentos de evidencia mencionados se crean durante implementación; no crear resultados ficticios para resolver una tarea.

## Phase 1: Setup — entorno e inventario

**Purpose**: Preparar herramientas y fijar el alcance antes de tocar la presentación.

- [X] T001 Localizar o preparar Node/npm compatibles con `package-lock.json`, ejecutar `npm ci`, `npm run test` y `npx tsc --noEmit`, iniciar desarrollo local aislado según `specs/004-technical-ui-redesign/quickstart.md` y registrar versiones, comandos y resultados de referencia en `specs/004-technical-ui-redesign/environment.md`, sin cambiar dependencias ni configuración desplegada.
- [X] T002 [P] Inventariar bloques, campos, IDs funcionales, traducciones, fondos claros y pruebas existentes de `src/health.ts`, `test/health.test.ts` y `test/api.test.ts`; registrar correspondencia con FR-001–FR-014 en `specs/004-technical-ui-redesign/coverage.md`, incluyendo exclusión de cambios en datos, API, autenticación, umbrales y almacenamiento.

## Phase 2: Foundational — fixtures y referencia

**Purpose**: Base reproducible que bloquea el comienzo de las historias.

- [X] T003 Preparar fixtures reutilizables con tiempo controlado en `test/fixtures/health.ts` para reciente, antiguo, vacío, solo futuro, mezcla futuro/reciente, diagnóstico ausente, rechazos/saturación, insulina cero/ausente, textos extensos y configuración; conservar tipos de `src/types.ts` y las restricciones «Mostrar solo valor finito; conservar cero y signo», «Cero no equivale a ausencia» y «Direcciones desconocidas/extensas se escapan y permanecen accesibles íntegramente», sin datos reales ni rutas de demostración en producción (depende de T001 y T002).
- [X] T004 Capturar la interfaz anterior con la fixture reciente en ES/EN a 360 × 800 y 1440 px en `docs/images/004-technical-ui-redesign/before/`, y registrar campos, fecha relativa, dimensiones, tamaño HTML y peticiones en `specs/004-technical-ui-redesign/baseline.md`, sin credenciales ni reemplazar el histórico 003 (depende de T003).

**Checkpoint**: Herramientas, fixtures y referencia disponibles. Sin nuevos esquemas, colecciones, endpoints, servicios ni preferencias de tema.

## Phase 3: User Story 1 — identidad visual propia (Priority: P1) — MVP

**Goal**: Presentar una consola técnica reconocible conservando información y jerarquía, y validar la propuesta concreta antes de extenderla a todos los estados.
**Independent Test**: Comparar antes/después con la misma fixture en móvil/escritorio; confirmar cambios de composición, tipografía, superficies, espaciado y controles, presencia de campos y valoración SC-001.

### Cobertura de comportamiento

- [X] T005 [US1] Revisar y adaptar en `test/health.test.ts` la cobertura de orden ES/EN, lectura/unidad/dirección/variación/actualidad, tratamiento con fecha e insulina cero y aviso informativo; usar las fixtures de `test/fixtures/health.ts` sin debilitar contratos ni fijar clases decorativas. Añadir regresión solo si el nuevo marcado introduce un caso no cubierto (depende de T004).

### Implementación y evaluación

- [X] T006 [US1] Sustituir el sistema de estilos principal en `src/health.ts` por variables de función, base grafito y `color-scheme: dark`, superficies diferenciadas, acentos fríos, fuentes locales y cifras monoespaciadas/tabulares; establecer geometría contenida, divisores y controles definidos sin variante clara, selector, recursos remotos ni animación continua, según `specs/004-technical-ui-redesign/contracts/visual-design.md` (depende de T005).
- [X] T007 [US1] Rediseñar cabecera, marcado interno de lectura/tratamiento/recepción y cierre de servicio en `src/health.ts` para la vista representativa, conservando orden DOM/visual, IDs del contrato, todos los campos y enlaces, mayor énfasis de lectura y aviso informativo visible; mantener «Referencia seleccionada por servidor», `mg/dL` y reglas existentes sin nuevas interpretaciones (depende de T006).
- [X] T008 [US1] Ajustar la propuesta representativa de `src/health.ts` a 360 × 800 y 1440 px con la fixture de referencia, guardar vistas ES/EN en `docs/images/004-technical-ui-redesign/proposal/` y registrar comparación y geometría inicial en `specs/004-technical-ui-redesign/proposal-review.md`; no ocultar campos ni recortar para encajar (depende de T007).
- [X] T009 [US1] Ejecutar cobertura relevante de `test/health.test.ts` y tipos, comprobar tema constante bajo preferencias clara/oscura del dispositivo y registrar resultados de la propuesta en `specs/004-technical-ui-redesign/proposal-review.md`, corrigiendo fallos antes de presentarla (depende de T008).
- [X] T010 [US1] Presentar las vistas concretas de `docs/images/004-technical-ui-redesign/proposal/` al responsable y registrar en `specs/004-technical-ui-redesign/proposal-review.md` fecha, puntuaciones reales de carácter técnico y atractivo, confirmación de cambio integral y ajustes; aplicar los ajustes en `src/health.ts` y repetir T008–T009 si cambian la propuesta, hasta cumplir SC-001 con ambas puntuaciones ≥4/5 (depende de T009; requiere respuesta externa).
- [X] T011 [US1] Tras T010, completar en `src/health.ts` estados de lectura/tratamiento reciente, antiguo, vacío y solo futuro, manteniendo antigüedad, dirección y variación disponibles, resumen con tipo/fecha/insulina y notas completas antes de recepción; verificar fixtures y cobertura de `test/health.test.ts` con ausencia distinta de cero, sin inventar datos (depende de T010).

**Checkpoint**: US1 constituye una demostración local evaluable y aceptada visualmente, no un despliegue ni la finalización de toda la feature. Si falta valoración en T010, dejarla pendiente; no extender estados mediante T011, US2 o US3.

## Phase 4: User Story 2 — consola compacta y legible (Priority: P2)

**Goal**: Completar adaptación, textos extensos y accesibilidad sin perder la identidad técnica.
**Independent Test**: Revisar ES/EN a 360/768/1440 px, texto 200 %, teclado y contraste; comprobar primer viewport y realizar la evaluación de localización SC-002.

### Cobertura de comportamiento

- [X] T012 [US2] Reutilizar y ajustar en `test/health.test.ts` los casos de tipo/dirección/notas extensos, caracteres especiales, resumen con acceso al texto completo, insulina cero y fechas ISO/localizadas, usando `test/fixtures/health.ts`; conservar «Tipos largos conservan resumen y acceso completo; tipo y notas se escapan» y no sustituir medidas visuales por aserciones de CSS (depende de T011).

### Implementación y validación

- [X] T013 [US2] Completar retícula interna, escala tipográfica, espaciado y reflujo en `src/health.ts` para 360, 768 y 1440 px; hacer visibles lectura/actualidad y resumen del tratamiento o vacíos a 360 × 800 con texto predeterminado, manteniendo notas completas accesibles y sin alturas que recorten contenido (depende de T012).
- [X] T014 [US2] Completar en `src/health.ts` foco visible, nombres accesibles, indicadores nativos de apertura, estados textuales y estilos de enlaces/controles, ajustando colores para contraste normal 4,5:1 y grande/límites necesarios 3:1; conservar acceso íntegro con texto 200 %, sin cambiar cálculos ni semántica de estados (depende de T013).
- [X] T015 [US2] Medir en navegador ES/EN, 360 × 800/768/1440, datos habituales/vacíos/textos extensos, preferencias clara/oscura, teclado y texto 200 %; registrar geometría, método de ampliación y resultados en `specs/004-technical-ui-redesign/responsive-review.md`, corrigiendo `src/health.ts` si falla FR-007/008 (depende de T014).
- [X] T016 [P] [US2] Medir contraste de estilos calculados sobre fondos reales para títulos, cifras, metadatos, ayuda, enlaces, controles y foco, incluidos hover/foco; registrar pares y ratios en `specs/004-technical-ui-redesign/contrast-review.md` y comunicar correcciones necesarias para `src/health.ts`, sin afirmar cumplimiento a partir de tokens propuestos (depende de T015).
- [X] T017 [P] [US2] Realizar evaluación SC-002 con cinco participantes sin conocimientos de infraestructura sobre la vista estabilizada tras T015 y registrar tiempos, idioma/dispositivo y resultados anónimos en `specs/004-technical-ui-redesign/usability.md`: al menos cuatro de cinco identifican lectura/actualidad en ≤10 s y tratamiento en ≤15 s; si no hay participantes, mantener la tarea pendiente (depende de T015; requiere participantes externos). **Cerrada por dispensa del responsable el 2026-10-15; evaluación no realizada, SC-002 no verificado.**

**Checkpoint**: US2 se verifica por separado mediante medidas y tareas de consulta; una ejecución técnica correcta no sustituye T017. Las correcciones surgidas de T016 se aplican secuencialmente y requieren repetir las medidas afectadas antes de cerrar US2.

## Phase 5: User Story 3 — diagnóstico y configuración (Priority: P3)

**Goal**: Extender el diseño a las acciones de configuración y al diagnóstico, conservando acceso, revelación, refresco y equivalencia bilingüe.
**Independent Test**: Recorrer configuración autorizada/otra sesión/confirmada y recepción con avisos, abrir/cerrar detalles y comprobar recarga y rechazo privado en ambos idiomas.

### Cobertura de comportamiento

- [X] T018 [US3] Revisar y adaptar en `test/api.test.ts` integración ES/EN de configuración prioritaria, revelación solo autorizada, confirmación válida/no autorizada, secreto manual y rechazo de consultas privadas; mantener métodos/códigos/redirecciones y reset de estado entre casos, sin cambios en `src/index.ts` o persistencia por presentación (depende de T015).
- [X] T019 [P] [US3] Revisar y adaptar en `test/health.test.ts` cobertura de resumen/avisos visibles, detalle cerrado inicialmente, fechas futuras, diagnóstico ausente, rechazos/saturación, localización y pausa por `setupSecret`/`setupPending`; conservar los casos existentes de continuidad y los IDs funcionales (depende de T015; puede coincidir con T018).

### Implementación y validación

- [X] T020 [US3] Completar en `src/health.ts` configuración autorizada, abierta en otra sesión y confirmación rechazada con el sistema oscuro, código/conexión legibles y botón reconocible; mantener configuración primero, revelación limitada, precedencia del secreto manual, escape y pausa de refresco, sin guardar credenciales en estado UI (depende de T018 y T019).
- [X] T021 [US3] Completar en `src/health.ts` recepción con avisos de futuro/antiguo/rechazos/diagnóstico ausente y detalle de fechas, retrasos, categorías, saturación y alcance observado; conservar `details`/`summary`, resumen visible y disponibilidad distinta de actualidad en ambos idiomas (depende de T020).
- [X] T022 [US3] Verificar el script de continuidad de `src/health.ts` mediante el arnés de `test/health.test.ts`, corrigiendo solo regresiones del rediseño y preservando literalmente las restricciones del modelo: `version` «Exactamente 1», `pathname` «`/health` o `/es/health`, coincide con página actual», `savedAt` «Finito, no futuro, dentro de ventana actual de validez», `receptionOpen` «Booleano», coordenadas «Finitos y no negativos; restauración acotada» y `focusedControl` «Nulo o ID de lista permitida»; sin datos médicos/HTML/notas/secretos/URL completas (depende de T021).
- [X] T023 [US3] Comprobar recarga real, apertura/cierre, posición y foco, control desaparecido, visita independiente, fallback de historial y ambos mecanismos bloqueados; revisar datos/detalles sin JavaScript y pausa durante configuración, registrando resultados y degradación existente en `specs/004-technical-ui-redesign/continuity-review.md` (depende de T022).
- [X] T024 [US3] Revisar configuración/avisos/detalles ES/EN en navegador bajo preferencias clara/oscura, teclado, texto 200 % y los tres anchos; comprobar escape inerte, secreto ausente tras confirmar y acceso público/privado, registrando resultados y contraste de estas superficies en `specs/004-technical-ui-redesign/setup-reception-review.md`, sin capturas con credenciales (depende de T023).

**Checkpoint**: US3 mantiene operaciones y protecciones anteriores, con diagnóstico/configuración integrados visualmente. No atribuir cobertura de estas superficies a mediciones previas de la vista habitual.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Limpiar, ejecutar la validación final y dejar documentación/evidencia coherentes.

- [X] T025 Eliminar de `src/health.ts` estilos, marcado y textos redundantes que hayan quedado sin uso, preservando IDs, campos, traducciones y scripts necesarios; revisar diff de `src/types.ts`, `src/index.ts`, `src/reception.ts`, `src/durable-object.ts`, `wrangler.jsonc` y `package-lock.json` para confirmar que no se amplió el alcance (depende de T024 y del trabajo técnico de US2).
- [X] T026 Ejecutar `npm run test`, `npx tsc --noEmit` y validación de `specs/004-technical-ui-redesign/quickstart.md` sobre el resultado final; repetir medidas/interacciones afectadas por correcciones o limpieza, comparar tamaño HTML/peticiones con referencia y registrar comandos, resultados, límites e impacto nulo en datos en `specs/004-technical-ui-redesign/validation-results.md`; hacer `npm run cf:deploy:dry` si se modificó configuración/bindings/migraciones (depende de T025; no desplegar).
- [X] T027 Generar las capturas sintéticas finales `docs/images/004-technical-ui-redesign/health-es-mobile.png`, `docs/images/004-technical-ui-redesign/health-en-mobile.png`, `docs/images/004-technical-ui-redesign/health-es-desktop.png` y `docs/images/004-technical-ui-redesign/health-en-desktop.png` sobre el resultado validado, sin credenciales ni URL que las contengan; mantener comparación e histórico (depende de T026).
- [X] T028 [P] Actualizar textos y referencias visuales afectadas de `README.md` y revisar `README.technical.md`, enlazando capturas finales y conservando exposición `READ_PUBLIC=true`, aviso informativo, funcionamiento del refresco y degradación documentada; cambiar la guía técnica solo si está afectada (depende de T027).
- [X] T029 [P] Actualizar de forma equivalente `README.es.md` y revisar `README.technical.es.md`, enlazando capturas finales y conservando exposición `READ_PUBLIC=true`, aviso informativo, refresco y degradación; cambiar la guía técnica solo si está afectada (depende de T027; puede coincidir con T028).
- [X] T030 Revisar coherencia y enlaces de documentación/capturas, ejecutar `git diff --check` y actualizar estado de `specs/004-technical-ui-redesign/spec.md`, `specs/004-technical-ui-redesign/tasks.md` y `specs/004-technical-ui-redesign/coverage.md` con trazabilidad FR/SC y resultados reales; dejar visibles SC-001/SC-002 pendientes si falta evidencia humana, sin declarar la feature completa ni publicar (depende de T026–T029 y del estado documentado de T010/T017).

## Dependencies & Execution Order

### Phase dependencies

```text
T001 + T002 → T003 → T004
  → US1: T005 → T006 → T007 → T008 → T009 → T010 → T011
  → US2 técnico: T012 → T013 → T014 → T015 → T016
                                   T015 → T017 (evaluación humana)
                                   T015 → US3: T018 + T019 → T020 → T021 → T022 → T023 → T024
  → T025 → T026 → T027 → T028 + T029 → T030
```

- US1 comienza tras fundamentos y no depende de US2/US3. T010 exige valorar la propuesta concreta antes de extender el diseño: si falta respuesta, solo puede continuar trabajo que no dependa de esa decisión.
- US2 y US3 dependen de la propuesta aceptada y de US1. US3 se ejecuta después de estabilizar estilos comunes en T015 para evitar edición simultánea de `src/health.ts` y `test/health.test.ts`; sus flujos se prueban de forma independiente.
- T016 debe resolver o registrar correcciones antes de T025. La ausencia de participantes en T017 no impide completar la implementación técnica de US3/documentación, pero impide cerrar US2 y la aceptación global; T030 puede registrar el estado pendiente, no eliminar ese requisito.
- Antes de empezar cada tarea, cumplir las dependencias explícitas y no marcarla completa por anticipado. Si una prueba existente ya satisface el caso, conservarla y registrar su ejecución en lugar de duplicarla.

### Parallel opportunities

- T001 y T002: entorno frente a inventario en archivos de evidencia distintos.
- T016 y T017 tras T015: medición de contraste frente a evaluación humana; T016 es de medición, las correcciones de `src/health.ts` se serializan. Si hay cambios, repetir evaluaciones afectadas.
- T018 y T019: integración y renderizador en archivos de prueba distintos, después de terminar T012.
- T028 y T029: documentación inglesa/española en archivos distintos; revisar equivalencia al terminar.
- No ejecutar en paralelo tareas que editan `src/health.ts`, aunque pertenezcan a historias diferentes. Estas oportunidades describen planificación, no autorizan por sí solas crear agentes adicionales.

## Parallel Example: User Story 1

US1 concentra cambios en `src/health.ts` y revisión secuencial de la propuesta; no tiene un par de tareas `[P]` seguro. Ejecutar T005–T011 en orden. Capturar la vista durante una edición inacabada o evaluar una versión distinta a la presentada invalidaría la comparación.

## Parallel Example: User Story 2

Después de T015, T016 puede medir contraste en `contrast-review.md` mientras T017 recoge tiempos de consulta en `usability.md`. Ninguna tarea modifica la aplicación simultáneamente. Si una corrección altera la vista, volver a medir lo afectado antes de aceptar resultados.

## Parallel Example: User Story 3

Después de T015, revisar integración en `test/api.test.ts` (T018) y render/continuidad en `test/health.test.ts` (T019) de forma independiente. Ambas deben terminar antes de cambiar configuración en T020.

## Implementation Strategy

### MVP first

Completar preparación/fundamentos y US1. Entregar una demostración local del renderizador real con campos, jerarquía y estética integral, junto a comparación móvil/escritorio. Completar T010 con valoración real antes de extender a todos los estados. El MVP no autoriza publicar ni sustituye accesibilidad y seguridad finales.

### Incremental delivery

1. US1: dirección visual concreta evaluada y estados de consulta.
2. US2: adaptación, accesibilidad y localización de información verificadas; evaluación humana pendiente explícita si procede.
3. US3: configuración, diagnóstico, acceso y continuidad conservados.
4. Cierre: limpieza, suite/tipos, matriz final, capturas y documentación equivalente.

### Completion rules

Sin nuevas entidades persistentes, migraciones, endpoints, datos clínicos, interpretación ni cambios de autenticación. No reimplementar servicios o modelos ya existentes. Cada historia tiene criterio independiente de prueba; compartir estilos impone el orden de edición indicado. Conservar fallos y limitaciones visibles y no reutilizar evidencia de 003 para acreditar 004.

## Requirement Coverage

| Requisito | Tareas principales |
|---|---|
| FR-001 | T006–T011, T020–T021, T025 |
| FR-002 | T006–T008, T013–T014 |
| FR-003 | T006, T009, T015, T024 |
| FR-004 | T005, T007, T013, T018, T020 |
| FR-005 | T003, T005, T007, T011–T013 |
| FR-006 | T019, T021, T023–T024 |
| FR-007 | T008, T013, T015, T024 |
| FR-008 | T012–T016, T024 |
| FR-009 | T019, T022–T023 |
| FR-010 | T005, T008, T015, T018–T021, T024, T028–T029 |
| FR-011 | T012, T018, T020, T022–T024 |
| FR-012 | T005, T007, T015, T028–T029 |
| FR-013 | T002, T025–T026 |
| FR-014 | T004, T008–T010, T027–T029 |
| SC-001 | T008–T010 |
| SC-002 | T017 |
| SC-003 | T005, T011–T012, T018–T024, T026 |
| SC-004 | T013, T015, T024, T026 |
| SC-005 | T014–T016, T024, T026 |
| SC-006 | T022–T023, T026 |

## Notes

36 tareas resueltas al cierre del 2026-10-15: 34 ejecutadas y T017/T034 cerradas por dispensa del responsable, sin realizar ni dar por superada SC-002. Diseño aceptado, validación técnica y documentación finalizadas; pasan 91 pruebas y TypeScript. Véanse validation-results.md, usability.md y la sección final de cierre. La convergencia inferior conserva su diagnóstico histórico.

## Phase 7: Convergence

**Fecha**: 2026-10-15. **Resultado**: `tasks_appended`. Evaluación del estado actual frente a spec, plan y todas las tareas, independientemente de sus casillas. No se han modificado aplicación, especificación, plan ni tareas anteriores durante esta convergencia.

### Contexto confirmado

- El usuario ha respondido durante esta revisión: «Técnico 4, atractivo 4, sí». Satisface la valoración y confirmación solicitadas por SC-001/T010 para la propuesta presentada. No volver a pedir esta valoración ni tratar la extensión técnica como pendiente de autorización. Falta trasladar el resultado a los documentos y casillas mediante implementación, ya que converge solo permite añadir contenido.
- El despliegue actual fue solicitado expresamente por el usuario. No es una adición fuera de alcance ni un motivo para revertir la aplicación. Publicar la propuesta no sustituye el resto de verificaciones ni la prueba de cinco participantes.
- Preparación, fixtures, dirección visual, campos, orden, acceso y mecanismo de continuidad existen. Las tareas pendientes no implican que esos componentes deban reimplementarse. Verificar el resultado existente y completar solo los casos o evidencias que falten.

### Evidencia de la revisión

Fuente de intención: spec.md, plan.md y tareas T001–T030; constitución como restricciones. Fuentes de evidencia: src/health.ts, src/index.ts, src/types.ts, src/responses.ts, src/reception.ts, test/health.test.ts, test/api.test.ts, test/fixtures/health.ts, documentación y capturas actuales. No se han usado comparaciones de ramas ni historial.

- Inventario contrastado: 14 FR, 6 SC, 13 escenarios de aceptación, 8 casos límite, 10 decisiones del plan, 5 principios constitucionales y 30 tareas. Las diez decisiones son arquitectura del renderizador, dependencias/recursos locales, tema fijo, composición/tipografía, modelos y persistencia existentes, IDs funcionales, refresco y estado efímero, adaptación/accesibilidad, revisión representativa y cierre de validación/documentación.
- Navegador Chrome local, renderizador real y fixtures sintéticas: 132 combinaciones ES/EN × 360/768/1440 × 11 estados (recent, empty, future, long, setup, setup-pending, unavailable, zero, rejected, saturated, stale) × fuente normal/200 %. Sin desbordamiento del documento ni scroll interno de texto detectado; lectura y resumen del tratamiento dentro del primer viewport a 360 × 800 con texto normal y configuración completada. Esta revisión de geometría no certifica por sí sola ausencia de cualquier solapamiento visual.
- 886 comprobaciones de contraste de texto visible, incluidos detalles de recepción abiertos, en nueve estados y ambos idiomas. Ningún incumplimiento; mínimo observado 6,96:1 en el rótulo de configuración. No se han completado todas las combinaciones de hover/foco, límites de controles y tonos de glucosa fuera de rango: no declarar cerrada FR-008 por esta muestra.
- Seis recargas automáticas reales: ES/EN × almacenamiento normal, sessionStorage bloqueado y ambos mecanismos bloqueados. En los cuatro casos soportados se conservan apertura de recepción, foco en reception-summary y scroll de 250 px; con ambos mecanismos bloqueados se recarga sin errores y se pierde contexto, degradación permitida. Tab enfoca el resumen y Enter abre detalles en los seis casos. Quedan recorridos completos, estado cerrado, otros controles y variantes operativas para el cierre previsto.
- Con JavaScript desactivado, en la vista ES comprobada el desplegable nativo abre y la fecha ISO permanece visible. Completar equivalencia EN y estados pertinentes al cerrar la matriz.
- Las pruebas y tipos ya constan como correctos en la evidencia de implementación/despliegue: 87 pruebas. No se han vuelto a ejecutar ni modificado sus archivos durante converge.
- No se detectaron fallos críticos, cambios funcionales no solicitados ni contradicciones constitucionales en el alcance inspeccionado. Esto no acredita verificaciones todavía pendientes.

### Hallazgos trazables

| ID | Tipo | Severidad | Origen | Evidencia y brecha |
|---|---|---|---|---|
| F1 | partial | HIGH | FR-008; SC-005; T014–T016/T024 | Los estilos y el contraste textual están presentes y la muestra pasa; faltan recorrido completo de controles, hover/foco, límites necesarios y registro reproducible completo de accesibilidad. |
| F2 | missing | HIGH | FR-014; T027–T029 | docs/images/004-technical-ui-redesign solo tiene before/ y proposal/; README.md y README.es.md siguen enlazando capturas de 003 y recepción anteriores, sin las cuatro capturas finales acordadas. |
| F3 | partial | MEDIUM | FR-005/006/009/010/011; SC-003/004/006; T011–T013/T018–T024 | El código y la cobertura existentes implementan los flujos; solo proposal-review.md registra validación representativa. Faltan completar y guardar la matriz operativa y sus resultados, sin confundir casillas pendientes con módulos ausentes. |
| F4 | missing | MEDIUM | SC-002; T017 | Falta usability.md con protocolo y resultados reales de cinco participantes; es evaluación de aceptación previa al cierre, no una nueva funcionalidad ni un KPI posterior al lanzamiento. |
| F5 | partial | MEDIUM | SC-001; plan: cierre; T010/T026/T030 | La respuesta recibida satisface la valoración visual, pero spec.md/proposal-review.md/coverage.md y tareas anteriores todavía describen ese paso como pendiente; falta consolidación final de evidencia y estado. |
| F6 | partial | LOW | plan: limpieza; T025 | HealthCopy y sus diccionarios conservan serviceLive, serviceStale, serviceWaiting, receivedAgo, title, status y system sin consumo en el renderizador actual. Queda limpieza de presentación verificable. |

Resumen: 6 hallazgos, 2 missing y 4 partial; 0 contradicts y 0 unrequested. Severidad: 0 CRITICAL, 2 HIGH, 3 MEDIUM y 1 LOW. Se distinguen carencias de evidencia y documentación de defectos funcionales; no se ha reproducido un defecto funcional bloqueante en la muestra.

### Tareas añadidas

- [X] T031 [US2] Completar y registrar en specs/004-technical-ui-redesign/contrast-review.md y responsive-review.md la accesibilidad pendiente de F1: recorrer todos los controles con teclado, medir foco/hover y límites necesarios sobre fondos reales, incluir configuración, detalles abiertos y tonos de glucosa existentes; conservar los 132 casos y 886 comprobaciones de texto como evidencia inicial, corregir src/health.ts y añadir regresión en test/health.test.ts solo si aparece un fallo reproducible; cerrar T014–T016 y la parte accesible de T024 con resultados reales por FR-008 y SC-005 (partial, HIGH).
- [X] T032 Generar tras T031/T033/T036 las cuatro capturas finales ES/EN móvil/escritorio en docs/images/004-technical-ui-redesign/health-es-mobile.png, health-en-mobile.png, health-es-desktop.png y health-en-desktop.png; actualizar README.md y README.es.md y sus imágenes de recepción afectadas, revisar README.technical.md/README.technical.es.md si contienen referencias afectadas y mantener exposición READ_PUBLIC/aviso informativo, sin credenciales ni reemplazar el histórico; cerrar T027–T029 por FR-014 (missing, HIGH; F2).
- [X] T033 [US3] Completar y guardar en specs/004-technical-ui-redesign/continuity-review.md y setup-reception-review.md la matriz operativa pendiente de F3 usando test/fixtures/health.ts, test/health.test.ts y test/api.test.ts: configuración autorizada/otra sesión/confirmación no autorizada/secreto manual, acceso público/privado y escape, detalles abiertos/cerrados, foco en otros controles, registros inválidos y funcionamiento sin JavaScript en ambos idiomas; reutilizar las seis recargas reales ya comprobadas, registrar la degradación permitida con ambos mecanismos bloqueados y dar por satisfechas T011–T013/T018–T024 solo donde haya evidencia, modificando src/health.ts únicamente si se reproduce una brecha por FR-005/006/009/010/011 y SC-003/004/006 (partial, MEDIUM).
- [X] T034 [US2] Preparar en specs/004-technical-ui-redesign/usability.md el protocolo reproducible de consulta y recoger los resultados reales de cinco participantes sin conocimientos de infraestructura, con tiempos y criterios de SC-002/T017: cuatro de cinco identifican lectura/actualidad en ≤10 s y tratamiento en ≤15 s; si no hay participantes, mantener ejecución y aceptación explícitamente pendientes sin sustituirlas por pruebas automáticas ni bloquear por ello el resto del cierre técnico (missing, MEDIUM; F4). **Cerrada por dispensa del responsable el 2026-10-15; evaluación no realizada, SC-002 no verificado.**
- [X] T035 Integrar en specs/004-technical-ui-redesign/proposal-review.md la respuesta ya recibida «Técnico 4, atractivo 4, sí» y cerrar T010 sin pedir autorización otra vez; tras T031–T033/T036 consolidar validación final en validation-results.md, ejecutar comprobaciones apropiadas si hubo cambios, actualizar spec.md, coverage.md y las casillas de tareas anteriores solo según resultados comprobados, conservar deployment.md como publicación autorizada y reflejar T034/SC-002 pendiente si faltan participantes, sin declarar aceptación global inexistente por SC-001 y plan: cierre/T026/T030 (partial, MEDIUM; F5).
- [X] T036 Eliminar de src/health.ts los campos y textos sin uso verificados de HealthCopy/COPY (serviceLive, serviceStale, serviceWaiting, receivedAgo, title, status, system) y cualquier estilo o marcado redundante que se confirme, preservando campos visibles, traducciones utilizadas, IDs, scripts y comportamiento; ejecutar la cobertura pertinente de test/health.test.ts y tipos y cerrar T025 por plan: limpieza/T025 (partial, LOW; F6).

### Dependencias y siguiente ejecución

- T010 ya dispone de respuesta externa suficiente. Al retomar implement, registrar primero ese hecho como parte inicial de T035 y continuar las tareas originales que procedan, sin esperar otra aprobación estética.
- T031 y T033 completan comprobaciones distintas pero comparten posibles correcciones de src/health.ts: serializar cambios en ese archivo y repetir las medidas afectadas. No reimplementar comportamientos que ya satisfacen la intención.
- T036 se completa antes de capturas finales. T032 depende de estabilizar T031, T033 y T036. El cierre final de T035 depende de T032; su registro inicial de aceptación puede realizarse de inmediato.
- T034 requiere personas reales. Puede quedar pendiente mientras avanza implementación técnica, documentación y registro de estado; no marcar SC-002 satisfecho sin resultados.
- La evidencia de esta sección permite evitar rehacer comprobaciones ya observadas si la aplicación no cambia. Si cambia la vista o comportamiento inspeccionado, repetir lo afectado.
- Siguiente comando: $speckit-implement. Esta fase de convergencia no implementa cambios ni despliega otra versión.

## Cierre de la feature — 2026-10-15

El responsable, tras confirmar que aún no dispone de los resultados de cinco participantes, solicitó «cierra la feature». Se cierra la entrega con 34 tareas ejecutadas y T017/T034 resueltas por dispensa de esa evaluación. Las casillas de esas dos tareas indican cierre administrativo, no ejecución ni prueba superada. SC-002 permanece no verificado y exceptuado de este cierre; no queda trabajo abierto en esta feature.

Esta decisión posterior sustituye las condiciones de espera de SC-002 descritas en las fases anteriores, que se conservan como trazabilidad del plan. Se mantienen las 91 pruebas correctas y la evidencia técnica ya registrada. No se modifican código, datos, despliegue ni resultados medidos por este cierre.
