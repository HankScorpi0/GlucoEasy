# Tasks: Página principal compacta y jerarquizada

**Input**: Documentos de `specs/003-redesign-homepage/`: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contrato](contracts/health-page.md) y [quickstart.md](quickstart.md).

**Prerequisites**: Especificación aclarada y plan completos. Ejecutar `$speckit-analyze` antes de implementar.

**Tests**: Pruebas funcionales proporcionadas al cambio, exigidas por la constitución y las instrucciones del repositorio. No se exige TDD; añadir pruebas de contrato antes de los cambios correspondientes permite observar el defecto inicial. La revisión de navegador y la evaluación con personas no se sustituyen por tests de cadenas HTML.

**Organization**: Tres historias de usuario, con fases de preparación, base compartida y cierre. Estado de ejecución: 27 tareas completadas; T016 pendiente de evaluación con personas. Implementación técnica y documentación completas, sin declarar cierre total de la feature.

## Format: `[ID] [P?] [Story] Description`

- `[P]` indica trabajos en archivos distintos que pueden ejecutarse simultáneamente dentro de la misma fase, una vez satisfechos sus prerrequisitos.
- `[US1]`, `[US2]`, `[US3]` corresponden a las historias de la especificación, no a las posiciones de los bloques.
- Rutas relativas a la raíz del repositorio. Las modificaciones en `src/health.ts` se ejecutan secuencialmente.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar el entorno existente sin añadir herramientas o dependencias innecesarias.

- [X] T001 Comprobar dependencias de `package-lock.json` y scripts de `package.json`, instalar con `npm ci` solo si es necesario y registrar versiones/comandos del entorno en `specs/003-redesign-homepage/evidence.md`, sin secretos.
- [X] T002 Preparar la matriz de casos de `specs/003-redesign-homepage/quickstart.md` en `specs/003-redesign-homepage/evidence.md`: ES/EN, reciente/antiguo/vacío/futuro, tratamiento presente/ausente/cero, textos extensos, recepción ausente y configuración; usar fixtures sintéticos y almacenamiento local aislado.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establecer puntos comunes de presentación para las tres historias, conservando el contrato actual.

- [X] T003 Añadir identificadores constantes de bloques y controles en `src/health.ts` según `specs/003-redesign-homepage/contracts/health-page.md` (`latest-reading`, `latest-treatment`, `reception`, `service-info`, `status-link`, `repository-link`), también en estados vacíos; no derivarlos de datos externos ni alterar rutas, autorización o almacenamiento.
- [X] T004 Centralizar los textos compartidos de títulos, actualidad, fechas, aviso informativo y controles en `src/health.ts`, con equivalencia ES/EN y escape de contenido externo; conservar formateo local de `time[datetime]`, incluso cuando la configuración pausa el refresco.

**Checkpoint**: Las historias pueden usar bloques estables y textos localizados; no hay cambios del modelo persistente ni de `HealthViewModel` que requieran migración.

## Phase 3: User Story 1 — Entender lo esencial (Priority: P1) — MVP

**Goal**: Lectura y actualidad primero, tratamiento crítico segundo, recepción después y enlaces secundarios al final.

**Independent Test**: Renderizar y abrir fixtures recientes, antiguos, vacíos y futuros en ambos idiomas; verificar orden visual/documental, actualidad explícita y conservación de valores. No necesita el nuevo desplegable ni el CSS final para entregar valor.

### Tests for User Story 1

- [X] T005 [US1] Añadir pruebas de contrato en `test/health.test.ts` para orden lectura → tratamiento → recepción → servicio, tratamiento vacío en segundo lugar, lectura antigua/vacía/futuro y aviso visible fuera del diagnóstico; verificar que servidor disponible no equivale a datos recientes (FR-001/002/005/010).

### Implementation for User Story 1

- [X] T006 [US1] Reordenar las interpolaciones HTML de `src/health.ts` conforme a FR-001, manteniendo configuración pendiente antes de los datos y el orden de lectura asistida idéntico al visual; preservar URLs de estado y repositorio.
- [X] T007 [US1] Mostrar actualidad explícita junto a lectura y estados vacíos en `src/health.ts`, reutilizando `evaluateReception` de `src/reception.ts` sin cambiar umbral o selección; cumplir «nunca inventar valores ni considerar servidor disponible equivalente a recepción reciente» de `data-model.md` y conservar unidad, dirección y variación disponibles.
- [X] T008 [US1] Separar resumen y notas del tratamiento en `src/health.ts`: tipo, fecha localizada y antigüedad e insulina si existe; cumplir «Cero válido sigue siendo cero; falta no se convierte en cero» y «Notas completas después, antes de recepción» de `data-model.md`; mantener tipo ausente y tratamiento ausente explícitos y escapar tipo/notas.
- [X] T009 [US1] Situar el aviso bilingüe de respaldo informativo junto al área de lectura/tratamiento en `src/health.ts`, visible sin desplegar diagnóstico y sin introducir recomendaciones o acciones terapéuticas.
- [X] T010 [US1] Ejecutar las pruebas de `test/health.test.ts` y revisar el incremento US1 en navegador con los fixtures de T002; registrar orden, estados y resultados en `specs/003-redesign-homepage/evidence.md` sin atribuir todavía cumplimiento de viewport o usabilidad final.

**Checkpoint**: MVP de jerarquía y contenido implementado, verificable sin US2/US3. No publicar automáticamente.

## Phase 4: User Story 2 — Interfaz clara y compacta (Priority: P2)

**Goal**: Lectura y resumen del tratamiento visibles inicialmente a 360 × 800, aspecto sobrio y acceso sin pérdida en distintos anchos o con zoom.

**Independent Test**: Abrir los bloques existentes a 360 × 800, 768 y 1440 px en ES/EN, con textos largos y estados vacíos. Medir visibilidad y desbordamiento; recorrer controles por teclado y ampliar al 200 %. Puede verificarse sin implementar el desplegable de recepción.

### Tests for User Story 2

- [X] T011 [US2] Ampliar `test/health.test.ts` con casos de tipo/notas/dirección desconocida extensos y maliciosos, comprobando escape, acceso al contenido completo y presencia de etiquetas localizadas; no usar snapshots de CSS para afirmar cumplimiento visual (FR-008/009/011).

### Implementation for User Story 2

- [X] T012 [US2] Simplificar CSS y estructura decorativa de `src/health.ts` según `plan.md`: fuente local base 16 px, una columna, paneles opacos, bordes discretos, espaciado 8/12/16/24 px y móvil con margen 12 px/relleno 12–16 px; glucosa de mayor tamaño y tratamiento más destacado que detalles técnicos (FR-006).
- [X] T013 [US2] Ajustar lectura, aviso y resumen del tratamiento en `src/health.ts` para FR-007 a 360 × 800 y texto predeterminado; evitar grandes reservas vacías y permitir resumen de tipo largo solo con acceso al valor completo dentro del tratamiento. Conservar «Textos extensos conservan acceso al valor completo» de `data-model.md` y notas completas después del resumen.
- [X] T014 [US2] Incorporar ajustes de texto y foco en `src/health.ts`: nombres accesibles, `:focus-visible`, estados textuales además del color, contraste mínimo 4,5:1 normal/3:1 grande y zoom 200 % sin recortes, superposición o pérdida de acciones (FR-008).
- [X] T015 [US2] Medir en navegador ambos idiomas a 360 × 800, 768 y 1440 px y zoom 200 %, incluidos tipo/notas largos y estados vacíos; registrar dimensiones, contraste medido, teclado/foco y capturas sintéticas ES/EN en `specs/003-redesign-homepage/evidence.md` y `docs/images/003-redesign-homepage/`; corregir `src/health.ts` si falla cualquier criterio, sin sustituir medidas por tests de HTML.
- [ ] T016 [US2] Preparar y realizar evaluación con al menos cinco personas sin conocimientos de infraestructura usando fixtures sintéticos de `quickstart.md`; registrar resultados anónimos en `specs/003-redesign-homepage/usability.md` para SC-001 (≥80 % identifica lectura/actualidad en ≤10 s) y SC-005 (≥80 % valora claridad/facilidad 4–5/5). Sin participantes o resultados, dejar esta tarea pendiente y documentar la limitación; no inventar evidencia.

**Checkpoint**: Composición y accesibilidad comprobadas en navegador. US2 no se considera completamente validada mientras falten resultados requeridos de usabilidad.

## Phase 5: User Story 3 — Acciones y detalles cuando hacen falta (Priority: P3)

**Goal**: Configuración protegida, detalles de recepción cerrados inicialmente, resumen/avisos visibles y continuidad durante recarga.

**Independent Test**: Visita inicial, abrir/cerrar con teclado, recarga con foco/scroll y configuración autorizada/otra sesión/confirmada en ES/EN; no requiere el CSS final para probar su comportamiento.

### Tests for User Story 3

- [X] T017 [P] [US3] Añadir en `test/health.test.ts` contratos de `details`/`summary` cerrado inicialmente, avisos fuera del desplegable, todos los detalles actuales accesibles y scripts de continuidad: estado abierto/cerrado, foco permitido, scroll acotado, registro consumido, corrupto/caducado/ruta distinta, almacenamiento bloqueado y fallback de historial; mantener prueba de localización durante configuración.
- [X] T018 [P] [US3] Ampliar/reutilizar integración `SELF.fetch` en `test/api.test.ts` con reset existente para ES/EN: sesión autorizada revela hasta confirmación, otra sesión y visita posterior no revelan, prioridad de configuración, ausencia de temporizador mientras pendiente, acceso privado rechazado y enlaces/rutas existentes preservados (FR-004/009/011).

### Implementation for User Story 3

- [X] T019 [US3] Reestructurar recepción en `src/health.ts` con `details id="reception-details"` y `summary id="reception-summary"` etiquetados, cerrados inicialmente; mantener disponibilidad, actualidad y avisos de rechazos/futuro/diagnóstico ausente fuera y conservar dentro tiempos, colección, umbral, retraso, categorías, saturación y límites de observación. Cumplir «Null significa desconocido; saturación conserva «al menos»» de `data-model.md`.
- [X] T020 [US3] Implementar captura UI justo antes de recarga automática en `src/health.ts`, clave `glucoeasy.health.refresh.v1` y fallback `glucoeasyHealthRefresh` en `history.state` preservando propiedades ajenas y sin URL: version «literal 1», pathname «/health o /es/health», savedAt «número finito, no futuro», receptionOpen «booleano», scrollX/scrollY «finitos no negativos», focusedControl «ID permitido o null»; permitir únicamente IDs constantes de controles conocidos y nunca datos médicos, HTML, secretos, cookies o valores de formulario.
- [X] T021 [US3] Implementar consumo/borrado y restauración en `src/health.ts` después de localizar fechas, con apertura → foco sin scroll inducido → posición acotada; validar «Caducidad: dos intervalos de refresco más 60 segundos» y ruta actual. Manejar registro corrupto y control ausente, sin robar foco en visita inicial; proteger ambas APIs y seguir funcionando si ambas fallan. No capturar/restaurar durante configuración y limpiar restos; conservar temporizador, mínimo y pausa existentes.
- [X] T022 [US3] Revisar textos, configuración y enlaces secundarios en `src/health.ts` en ambos idiomas, manteniendo acciones existentes y equivalencia de etiquetas/estados/avisos; no tocar autorización en `src/index.ts`, API o persistencia como efecto incidental.
- [X] T023 [US3] Ejecutar `test/health.test.ts` y `test/api.test.ts`, y verificar recarga real en navegador con detalles abiertos/cerrados, summary/enlaces enfocados, scroll, altura distinta, almacenamiento bloqueado y JavaScript deshabilitado; registrar resultados y metadatos sin información sensible en `specs/003-redesign-homepage/evidence.md`, corrigiendo `src/health.ts` si falla continuidad o acceso.

**Checkpoint**: Configuración y acceso conservados, detalle accesible y continuidad verificada. Si almacenamiento e historial fallan simultáneamente, documentar límite sin afirmar cumplimiento total del escenario afectado.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Completar documentación y evidencia, y validar el conjunto sin ampliar alcance.

- [X] T024 [P] Actualizar `README.md` sobre nueva jerarquía y detalles desplegables, enlazando capturas sintéticas; conservar alcance informativo, configuración y explicación de exposición `READ_PUBLIC=true`.
- [X] T025 [P] Actualizar `README.es.md` con el mismo comportamiento de `README.md`, jerarquía, desplegable y capturas; conservar alcance informativo, configuración y explicación de exposición `READ_PUBLIC=true`.
- [X] T026 Revisar paridad ES/EN y ejecutar la matriz completa de `specs/003-redesign-homepage/quickstart.md`, incluidos recarga y primer viewport con desplegable nuevo; revisar las peticiones durante la carga inicial y un refresco automático, confirmar que no se incorporan recursos externos ni peticiones adicionales respecto al comportamiento previo y registrar el resultado. Actualizar capturas finales en `docs/images/003-redesign-homepage/` y evidencias en `specs/003-redesign-homepage/evidence.md`.
- [X] T027 Ejecutar `npm run test` y `npx tsc --noEmit` para `src/` y `test/`, registrar resultados en `specs/003-redesign-homepage/evidence.md`; ejecutar `npm run cf:deploy:dry` solo si el diff cambia bindings, migraciones o configuración de `wrangler.jsonc`, documentando entonces el motivo. No desplegar.
- [X] T028 Revisar diff y enlaces de `README.md`, `README.es.md` y artefactos de `specs/003-redesign-homepage/`; registrar cobertura FR-001–012/SC-001–006, compatibilidad, impacto de datos nulo y cualquier validación pendiente en `specs/003-redesign-homepage/evidence.md`. No marcar evaluación humana o comprobaciones fallidas como completadas.

## Dependencies & Execution Order

### Phase Dependencies

```text
T001 → T002 → T003 → T004
                    │
                    ├─ US1: T005 → T006 → T007 → T008 → T009 → T010
                    ├─ US2 técnica: T011 → T012 → T013 → T014 → T015
                    │                                      └─ T016 (validación humana)
                    └─ US3: (T017 ∥ T018) → T019 → T020 → T021 → T022 → T023
US1 + US2 técnica + US3 → (T024 ∥ T025) → T026 → T027 → T028
T016 + cierre técnico T028 → cierre total de la feature
```

Todas las historias requieren la base T001–T004. El orden recomendado de integración es US1 → US2 → US3 por prioridad y por compartir `src/health.ts`; no editar ese archivo simultáneamente. No hay dependencia funcional que obligue a implementar otra historia para comprobar cada prueba independiente: US2 puede compactar los bloques existentes y US3 puede introducir el desplegable sin el estilo final. T026 comprueba el conjunto integrado.

T016 no bloquea US3, documentación ni comprobaciones técnicas T024–T028. Si faltan participantes, esas tareas pueden completarse con la evaluación humana explícitamente pendiente. T016 sigue siendo obligatoria para cerrar totalmente la feature; T028 debe registrar su estado real y no declarar cumplimiento total mientras siga pendiente.

### Within Each User Story

- Escribir pruebas de comportamiento antes del cambio correspondiente, reutilizando fixtures y cobertura existentes; no añadir tests que solo reflejen CSS o snapshots completos.
- Implementar tareas de `src/health.ts` en orden, sin cambiar selección/normalización, identidad del Durable Object ni acceso existente.
- Validar el incremento antes de pasar al siguiente. La comprobación de contenido no prueba dimensiones ni usabilidad.

### Parallel Opportunities and Examples

- **US1**: Sin tareas de edición paralelas: HTML, textos y pruebas de esta historia se integran secuencialmente. Tras T009, la revisión manual ES y EN de T010 puede dividirse por escenario, consolidando `evidence.md` con un único editor.
- **US2**: Sin tareas de edición paralelas: CSS, textos y layout comparten archivo. Tras T014, las mediciones ES/EN de T015 y la recogida de respuestas de T016 pueden organizarse por participante/escenario; no editar simultáneamente las evidencias.
- **US3**: T017 (`test/health.test.ts`) y T018 (`test/api.test.ts`) pueden prepararse en paralelo tras T004; ambas preceden implementación. T019–T022 son secuenciales.
- **Cierre**: T024 (`README.md`) y T025 (`README.es.md`) pueden redactarse en paralelo después de fijar el comportamiento, con comparación bilingüe posterior en T026.

Estas oportunidades describen coordinación posible; no requieren delegación ni añaden dependencias o archivos de implementación nuevos.

## Implementation Strategy

### MVP First (User Story 1 Only)

Completar T001–T004 y T005–T010: el MVP muestra lectura/actualidad primero y tratamiento crítico segundo, con aviso informativo y estados correctos. Verificar pruebas y tipos antes de considerar una integración. Todavía no representa cumplimiento total de compactación, desplegable o evaluación humana. Ninguna tarea autoriza publicación automática.

### Incremental Delivery

Añadir US2 para presentación compacta, primer viewport y accesibilidad; añadir US3 para desplegable y continuidad; cerrar con documentación bilingüe y verificación global. Si falta disponibilidad de participantes, continuar el trabajo técnico independiente y dejar T016 pendiente con evidencia explícita. El cierre total de la feature exige resolver las validaciones pendientes de sus criterios de aceptación.

## Traceability

| Requisito/criterio | Tareas principales |
|---|---|
| FR-001, SC-002 | T005–T006, T010, T026 |
| FR-002 | T005, T007, T010 |
| FR-003 | T017, T019–T021, T023 |
| FR-004 | T006, T018, T022–T023 |
| FR-005 | T005, T008, T013, T015 |
| FR-006 | T012–T015 |
| FR-007, SC-003 | T013, T015, T026 |
| FR-008, SC-004 | T014–T015, T019, T023, T026 |
| FR-009 | T004, T011, T018, T022, T024–T026 |
| FR-010 | T005, T009, T015 |
| FR-011, SC-006 | T011, T017–T018, T020–T023, T027 |
| FR-012 | T003, T022, T028 |
| SC-001, SC-005 | T016, T028 |

## Notes

- No crear migraciones, endpoints, dependencias ni un frontend independiente para esta feature.
- Capturas, fixtures y evidencias solo con datos sintéticos; no registrar credenciales.
- `[x]` en tareas significará trabajo completado con evidencia. El checklist de requisitos tiene otro significado y no sustituye pruebas.
- La falta de participantes o herramientas de navegador se documenta; no reduce por sí sola los criterios de aceptación.
