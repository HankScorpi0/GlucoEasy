# Tasks: Diagnóstico de recepción

**Input**: Design documents from `specs/002-reception-diagnostics/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/health-diagnostics.md](contracts/health-diagnostics.md), [contracts/internal-reception.md](contracts/internal-reception.md) y [quickstart.md](quickstart.md).

**Tests**: Incluidos por los criterios verificables de la especificación y los requisitos de pruebas funcionales, regresión e integración de la constitución. Escribirlos antes de implementar el comportamiento correspondiente y comprobar que fallan por la ausencia de esa capacidad; no por errores del entorno.

**Organization**: Historias US1 y US2 con prioridad P1; US3 con P2. Diagnóstico solo en páginas EN/ES. No ejecutar despliegues ni crear rutas públicas de diagnóstico.

## Format: `[ID] [P?] [Story] Description`

- `[P]` señala trabajos sobre archivos distintos que pueden realizarse a la vez tras cumplir sus prerrequisitos.
- `[US1]`, `[US2]`, `[US3]` corresponden a las historias de spec.md.
- Rutas relativas a la raíz del repositorio. No paralelizar tareas que modifiquen el mismo archivo.

## Path Conventions

Código en src/, pruebas en test/, documentación bilingüe en README.md y README.es.md, capturas sintéticas en docs/images/. Evidencia de ejecución en specs/002-reception-diagnostics/quickstart.md.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar entorno y confirmar contratos actuales sin modificar comportamiento.

- [X] T001 Localizar o preparar Node/npm compatibles, ejecutar npm ci desde package-lock.json y registrar versiones y disponibilidad en specs/002-reception-diagnostics/quickstart.md; no renovar dependencias ni lockfile por esta función.
- [X] T002 Ejecutar línea base npm run test y npx tsc --noEmit usando package.json y tsconfig.json; registrar resultados y fallos preexistentes en specs/002-reception-diagnostics/quickstart.md.
- [X] T003 Revisar src/index.ts, src/durable-object.ts, src/entries.ts y test/api.test.ts; confirmar códigos, aliases, deduplicación, lotes vacíos/inválidos, perfil, autorización y setup, y corregir solo discrepancias documentales del diseño en specs/002-reception-diagnostics/contracts/health-diagnostics.md antes de implementar.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos y fronteras compartidas; completar antes de historias.

- [X] T004 Definir ReceptionSummary, EntryReceipts, HealthReceptionSnapshot y ReceptionEvaluation en src/types.ts según data-model.md: version 1, “Collection = entries | treatments | profile”, “Enums cerrados; sin texto del cliente”, “Fechas finitas e interpretables”, lastAccepted nullable, cuatro categorías y cuatro indicadores saturated; mantener StatusPayload y CgmEntry sin campos nuevos.
- [X] T005 Preparar src/reception.ts con constructores puros de resumen y comprobación del esquema: “Contadores enteros no negativos, saturados en Number.MAX_SAFE_INTEGER”, “Total derivado mediante suma segura, no persistido”; lastAccepted inicia null, fechas finitas y enums cerrados; no importar Request ni almacenamiento.
- [X] T006 Incorporar en src/durable-object.ts acceso transaccional compartido a claves reception-summary y entry-receipts, sin tocar entries/treatments/profile/setup ni binding/clase/global; “Metadatos ilegibles no se reinician silenciosamente: informar indisponibilidad y preservar datos ordinarios”; callbacks sin red/logs ni allowUnconfirmed.

**Checkpoint**: Infraestructura compartida lista; ningún metadato se ha añadido a respuestas Nightscout.

## Phase 3: User Story 1 — Comprender qué está funcionando (Priority: P1)

**Goal**: Distinguir servidor que responde, última aceptación y antigüedad/recepción de referencia, incluso con datos viejos recién enviados.

**Independent Test**: Instalación vacía, lectura de hace dos horas aceptada ahora, lectura reciente, reintento, tratamiento y perfil; comprobar indicadores, retraso y permisos en EN/ES sin necesitar recuentos de US3.

### Tests for User Story 1

- [X] T007 [P] [US1] Añadir pruebas de procedencia en test/reception.test.ts: _id/fecha coincidentes, cambio de fecha, colisiones, lote fuera de orden, ganador incoming, null legado, poda y reintroducción tras retención; incluir “Si alguna recepción coincidente es desconocida, conservar null; si todas son conocidas, tomar la menor”.
- [X] T008 [P] [US1] Añadir regresiones en test/api.test.ts para vacío, envío antiguo recién aceptado, duplicado, tratamientos y perfil POST/PUT, aliases y StatusPayload sin metadatos; sembrar legado, recrear instancia sobre mismo almacenamiento y comprobar commit/rollback de aceptación con fallos controlados, sin nuevas rutas públicas.
- [X] T009 [P] [US1] Crear pruebas HTML en test/health.test.ts de tres indicadores, recepción desconocida, fecha/zona, retraso, precisión de minutos o mejor, umbral visible, escape, diagnóstico indisponible y equivalencia EN/ES; comprobar que el rótulo antiguo no mezcla disponibilidad y actualidad.

### Implementation for User Story 1

- [X] T010 [US1] Implementar asociación de recepción en src/reception.ts siguiendo ganadores de mergeEntries sin alterar src/entries.ts: “Mapa serializable de fecha normalizada, como string numérico, a number|null”, “Solo fechas: sin _id, sgv, device, notas o contenido”, “Dominio igual a fechas retenidas; máximo MAX_ENTRIES elementos efectivos”, “Ausencia de entrada de lectura preexistente equivale a null”; trasladar recepción con cambio de fecha y podar por retención.
- [X] T011 [US1] Implementar evaluación temporal común y último envío en src/reception.ts: “Usar evaluatedAt en todos los cálculos”, “thresholdMs = max(300000, 2 * refreshMs); edad <= umbral es reciente”, readingState empty/futureOnly/recent/stale; retraso firstAcceptedAt-date y desconocido nullable, sin truncar valores negativos; mantener máximo instante y colección anterior en empate.
- [X] T012 [US1] Integrar en src/durable-object.ts transacciones de lecturas, tratamientos y perfil con lastAccepted y mapa cuando corresponda; inicializar observación perezosamente, mantener legado null y guardar antes de respuesta, incluidos vacíos/duplicados; no emitir aceptación tras rollback.
- [X] T013 [US1] Implementar GET interno /health/snapshot en src/durable-object.ts con evaluatedAt único y vista coherente de lecturas/resumen; selección no futura básica, previousReference y futureCount preparados para US2; no modificar /snapshot ni /treatments/snapshot existentes.
- [X] T014 [US1] Integrar snapshot en src/index.ts solo tras autorización health; comprobar response.ok en escrituras y lectura interna, mantener secreto manual/sesión de revelación, evitar rutas públicas nuevas y ofrecer fallback seguro cuando diagnóstico falla pero datos ordinarios están disponibles.
- [X] T015 [US1] Renderizar tres indicadores EN/ES en src/health.ts con referencia no futura, delta de pareja no futura, aceptación/recepción/antigüedad separadas, umbral y ausencia/desconocido; usar evaluatedAt común, textos accesibles y aviso de respaldo informativo, conservando setup y refresco.
- [X] T016 [US1] Ampliar test/api.test.ts con consultas privadas/públicas, cookie de revelación y confirmación sin reaparición del secreto, concurrencia de aceptaciones, consultas/borrados/setup sin modificar lastAccepted y fallback de metadatos ilegibles sin reinicio silencioso; verificar T007–T009 y registrar resultados en specs/002-reception-diagnostics/quickstart.md.

**Checkpoint**: US1 funciona sin recuentos visibles; no presentar la sección de US3 como implementada. La exclusión básica de futuras es invariante del evaluador compartido; US2 completa su advertencia y validación.

## Phase 4: User Story 2 — Reconocer fechas futuras (Priority: P1)

**Goal**: Evitar falso estado reciente y explicar la anomalía sin cambiar recepción ni conservación de datos.

**Independent Test**: Fecha futura sola, futura+antigua y futura+reciente; comprobar advertencia, número y referencia válida, manteniendo aceptación/API ordinarias.

### Tests for User Story 2

- [X] T017 [P] [US2] Extender test/reception.test.ts con date=ahora, date=ahora+1 ms, umbral exacto/+1 ms, futura sola/mezclada, futura que deja de serlo, retraso negativo y retroceso de reloj de lastAccepted; verificar conteo sobre toda colección retenida y ausencia de edad cero inventada.
- [X] T018 [P] [US2] Extender test/health.test.ts con advertencia futura EN/ES independiente de reciente/antigua, solo futuras frente a vacío, cifra de futuras, delta sin referencias futuras y aviso de desfase temporal de aceptación.
- [X] T019 [P] [US2] Añadir en test/api.test.ts escenarios end-to-end de lecturas futuras que permanecen aceptadas y consultables por API, mezclas/desorden y retención; comprobar snapshot/status originales intactos y actualización tras consulta/refresco normal.

### Implementation for User Story 2

- [X] T020 [US2] Completar reglas de anomalías en src/reception.ts y snapshot en src/durable-object.ts: “date > evaluatedAt es futura; igualdad es válida”, selección máxima no futura y conteo retenido completo; “Retroceso de reloj que deje lastAcceptedAt futuro genera aviso de desfase, sin edad cero inventada”; preservar lecturas originales.
- [X] T021 [US2] Incorporar en src/health.ts advertencia y recuento de futuras junto a estados empty/futureOnly/recent/stale y anomalías de retraso/aceptación, con etiquetas EN/ES y sin clamp a cero; no presentar lecturas futuras como referencia reciente.
- [X] T022 [US2] Ejecutar pruebas de T017–T019 más regresiones US1 y registrar límites temporales y resultados en specs/002-reception-diagnostics/quickstart.md.

**Checkpoint**: US2 verificable mediante lecturas sintéticas sin depender de rechazos US3.

## Phase 5: User Story 3 — Identificar rechazos sin exponer datos (Priority: P2)

**Goal**: Recuentos por petición y motivo, persistentes y mínimos, sin cuerpos/credenciales ni cambio de resultado público.

**Independent Test**: Rechazar dos envíos por autorización y uno por formato; total tres, categorías dos/uno, aceptación intacta y ningún marcador sensible en diagnóstico, logs o errores.

### Tests for User Story 3

- [X] T023 [P] [US3] Extender test/reception.test.ts con enum cerrado de categorías, incremento único, suma segura y saturación artificial: “mostrar ‘al menos’ si alguna categoría saturó o suma supera límite”; garantizar tamaño fijo y sin desbordamiento.
- [X] T024 [P] [US3] Añadir en test/api.test.ts rechazos por configuración/autenticación, tamaño, JSON, normalización y almacenamiento, lote inválido como una petición, vacíos aceptados sin rechazo, 20 rechazos concurrentes exactos y persistencia; fallos de registro conservan respuesta y no generan segundo evento.
- [X] T025 [P] [US3] Añadir pruebas EN/ES en test/health.test.ts para total/categorías, inicio de observación visible, limitaciones de persistencia y eventos previos, cota inferior y ausencia de información diagnóstica cuando no está disponible.

### Implementation for User Story 3

- [X] T026 [US3] Implementar incremento y suma segura en src/reception.ts para authentication/payloadTooLarge/invalidPayload/internalFailure y flags saturated, sin total redundante ni texto del cliente; cero desde observedSince y sin historial de eventos.
- [X] T027 [US3] Implementar POST interno /reception/rejections en src/durable-object.ts: solo category y sin propiedades adicionales, enum inválido 400 sin efecto, éxito 204 tras transacción; inicialización y primer incremento juntos, sin cambiar lastAccepted ni permitir pérdida de incrementos concurrentes.
- [X] T028 [US3] Separar fases y centralizar resultado de envíos en src/index.ts; registrar exactamente una categoría antes de responder, usando solo enum y reloj DO, sin reintentos externos, waitUntil ni recursión por fallo diagnóstico; preservar 400 de tamaño/payload y códigos actuales de autenticación/configuración, aliases y envoltorios.
- [X] T029 [US3] Sanear logs/errores de flujos afectados en src/index.ts: eliminar cabeceras, User-Agent, URL recibidas con credenciales, defaultProfile, IDs del remitente y texto de excepciones; lista permitida de ruta canónica/colección/resultado/recuentos, mensajes propios seguros para parser/almacenamiento y mensajes estáticos de validación conservados; no modificar datos aceptados ordinarios.
- [X] T030 [US3] Mostrar en src/health.ts total y categorías acumuladas desde observedSince, limitación de eventos no observados/no guardados y cota inferior de saturación, con equivalencia EN/ES y permisos de snapshot existentes.
- [X] T031 [US3] Incorporar en test/api.test.ts captura de logs y revisión de claves diagnósticas con marcadores sintéticos en cuerpo, cabeceras, ID y perfil; comprobar cero filtraciones en metadatos/logs/errores, rutas internas no expuestas y consultas/borrados/setup excluidos; ejecutar T023–T025 y registrar evidencia en specs/002-reception-diagnostics/quickstart.md.

**Checkpoint**: Tres historias completas; recuentos y última aceptación no se confunden.

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T032 [P] Actualizar README.md con semántica de indicadores, primera recepción desconocida, futuras, rechazos acumulados y límites, saneamiento de errores, exposición READ_PUBLIC y coste adicional de llamadas/escrituras.
- [X] T033 [P] Actualizar README.es.md con contenido equivalente a T032, incluido respaldo informativo, compatibilidad Nightscout y ausencia de historial clínico.
- [X] T034 Verificar EN/ES en escritorio/móvil según contracts/health-diagnostics.md y guardar capturas sintéticas sin secretos en docs/images/reception-diagnostics-en-desktop.png, docs/images/reception-diagnostics-es-desktop.png, docs/images/reception-diagnostics-en-mobile.png y docs/images/reception-diagnostics-es-mobile.png; corregir src/health.ts si aparecen problemas.
- [X] T035 Revisar persistencia aditiva, aislamiento de API y coste en src/durable-object.ts, src/index.ts y wrangler.jsonc; documentar en specs/002-reception-diagnostics/quickstart.md rollback/reactivación como nueva época explícita cuando haya intervalo sin instrumentación, sin borrar datos ordinarios ni afirmar continuidad falsa.
- [X] T036 Ejecutar matriz completa de specs/002-reception-diagnostics/quickstart.md, npm run test y npx tsc --noEmit; ejecutar npm run cf:deploy:dry para bundle final y obligatoriamente si hubo cambios de bindings/migraciones/configuración; resolver fallos y registrar resultados, limitaciones y revisión de privacidad/compatibilidad, sin publicar.

## Dependencies & Execution Order

### Phase Dependencies

Setup T001–T003 → Fundamentos T004–T006 → US1 T007–T016 → US2 T017–T022 → US3 T023–T031 → Cierre T032–T036.

Las historias comparten src/reception.ts, src/durable-object.ts, src/index.ts, src/health.ts y test/api.test.ts. El orden de integración es secuencial; la independencia se refiere a escenarios de aceptación, no a editar concurrentemente los mismos archivos. US3 usa resumen/snapshot de US1 y no depende funcionalmente de advertencias de US2, pero se integra después para evitar conflictos.

### Within Each User Story

- T007/T008/T009 pueden escribirse juntos tras T006. T010 → T011 → T012 → T013 → T014 → T015 → T016; cada implementación valida primero las pruebas de su comportamiento.
- T017/T018/T019 pueden escribirse juntos tras T016. T020 → T021 → T022.
- T023/T024/T025 pueden escribirse juntos tras T022. T026 → T027 → T028 → T029 → T030 → T031.
- T032/T033 pueden realizarse juntos tras T031; luego T034 → T035 → T036. Revisar equivalencia de guías una vez ambas terminen.

## Parallel Example: User Story 1

Tras fundamentos, preparar T007 en test/reception.test.ts, T008 en test/api.test.ts y T009 en test/health.test.ts simultáneamente. Esperar su integración antes de implementar los módulos compartidos.

## Parallel Example: User Story 2

Tras US1, preparar T017, T018 y T019 en sus respectivos archivos de prueba; no solaparlos con cambios de pruebas de otra historia. T020 y T021 se ejecutan en orden porque UI consume la evaluación temporal.

## Parallel Example: User Story 3

Tras US2, preparar T023, T024 y T025 en archivos distintos. Incremento, transporte interno, coordinación y renderizado se integran en orden T026–T030. Al cerrar US3, README.md y README.es.md admiten paralelismo T032/T033.

## Implementation Strategy

### MVP First

Completar Setup + Fundamentos + US1 y validar instalación vacía, envío viejo recién aceptado y recepción de duplicados. US1 aporta el primer incremento demostrable; el mínimo recomendado para publicar este diagnóstico incluye también US2 por su prioridad P1 y la regresión de falsas lecturas recientes. No considerar cumplida la petición completa hasta US3 y cierre.

### Incremental Delivery

US1: indicadores y procedencia → US2: anomalías temporales → US3: rechazos privados y persistentes → revisión visual, documentación y checks. Cada checkpoint permite una demostración local; no autoriza despliegue ni declara hechos no verificados.

## Coverage and Format Validation

| Requisitos | Tareas principales |
|---|---|
| FR-001/002/005/013 | T007–T016 |
| FR-003/004/006 | T011, T013, T015, T017–T022 |
| FR-007/008/009 | T023–T031 |
| FR-010 | T014, T016, T031–T033 |
| FR-011/014 | T009, T015, T018, T021, T025, T030, T032–T034 |
| FR-012/015 | T003, T004, T008, T013, T014, T019, T024, T028, T035, T036 |
| FR-016 | T004, T005, T023, T025, T026, T030 |
| SC-001/006 | T007–T016 |
| SC-002 | T017–T022 |
| SC-003/004 | T023–T031 |
| SC-005 | T014–T016, T019, T022, T030, T034, T036 |

36 tareas: Setup 3, Fundamentos 3, US1 10, US2 6, US3 9 y Cierre 5. Once tareas [P] sobre archivos distintos con prerrequisitos explícitos. IDs consecutivos, 36 tareas completadas, etiquetas de historia solo en sus fases y rutas concretas en todas las tareas. Evidencia de implementación y validación registrada en quickstart.md.
