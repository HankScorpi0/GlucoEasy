# Feature Specification: Diagnóstico de recepción

**Feature Branch**: `002-reception-diagnostics`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Diagnóstico de recepción. Distinguir servidor disponible, último envío aceptado y última lectura reciente. Mostrar retraso y recuentos mínimos de rechazos, sin guardar cuerpos ni credenciales. Detectar fechas futuras para evitar un falso estado de datos recientes."

## Clarifications

### Session 2026-10-04

- Q: ¿Dónde deben poder consultarse los nuevos indicadores de diagnóstico? → A: Solo en las páginas de estado en español e inglés; la respuesta de estado para clientes permanece sin cambios y no se añade una consulta independiente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprender qué está funcionando (Priority: P1)

Como responsable de una instalación, quiero distinguir si el servidor responde, si ha aceptado envíos y si contiene lecturas recientes, para comprobar el respaldo sin confundir estos estados.

**Why this priority**: Un servidor que responde puede llevar tiempo sin recibir datos; un envío aceptado puede contener datos antiguos.

**Independent Test**: Consultar el estado con una instalación vacía, con una lectura antigua recién enviada y con una lectura reciente; comprobar los tres indicadores por separado.

**Acceptance Scenarios**:

1. **Given** una instalación sin envíos, **When** se consulta su estado, **Then** se indica que el servidor responde, que no hay envíos aceptados registrados y que no hay lecturas disponibles.
2. **Given** una lectura de hace dos horas, **When** se acepta ahora su envío, **Then** el último envío figura como recién aceptado y la lectura como antigua, con dos horas de antigüedad y dos horas de retraso de recepción.
3. **Given** una lectura reciente almacenada, **When** se acepta únicamente un tratamiento o perfil, **Then** se actualiza el último envío aceptado identificando su colección, sin cambiar la fecha ni la recepción de la lectura.
4. **Given** un envío rechazado, **When** se consulta el estado, **Then** no se modifica el último envío aceptado ni se anuncia una nueva lectura.

---

### User Story 2 - Reconocer fechas futuras (Priority: P1)

Como persona que consulta el respaldo, quiero reconocer lecturas con fechas futuras para que un reloj desajustado no haga parecer recientes los datos.

**Why this priority**: Una fecha futura puede ocultar la ausencia de lecturas recientes durante mucho tiempo.

**Independent Test**: Combinar lecturas futuras y antiguas o recientes con un instante de consulta controlado y comprobar la advertencia y la clasificación.

**Acceptance Scenarios**:

1. **Given** únicamente lecturas posteriores al instante actual, **When** se consulta el estado, **Then** se advierte de fechas futuras y se indica que no hay lecturas con fecha válida para evaluar actualidad.
2. **Given** una lectura futura y una lectura de hace dos horas, **When** se consulta el estado, **Then** se muestra la advertencia y la lectura no futura como antigua; la fecha futura no produce un indicador de datos recientes.
3. **Given** una lectura futura y otra de hace un minuto, **When** se consulta el estado, **Then** se indica que existe una lectura reciente y también la anomalía futura, sin sustituir la fecha de referencia por la futura.
4. **Given** el umbral de actualidad T, **When** una lectura tiene antigüedad exactamente T, **Then** se considera reciente; con antigüedad superior a T deja de serlo. Una fecha exactamente igual al instante actual no es futura.

---

### User Story 3 - Identificar rechazos sin exponer datos (Priority: P2)

Como responsable de la instalación, quiero ver recuentos básicos de envíos rechazados y sus motivos generales para localizar problemas de configuración sin recopilar información sensible adicional.

**Why this priority**: Los recuentos permiten distinguir problemas de autorización y formato sin conservar un historial de peticiones.

**Independent Test**: Enviar peticiones sintéticas rechazadas por cada motivo y revisar los recuentos, permisos de consulta y metadatos conservados.

**Acceptance Scenarios**:

1. **Given** un resumen vacío, **When** se rechazan dos envíos por autenticación y uno por formato, **Then** el total aumenta en tres y las categorías muestran dos y uno respectivamente.
2. **Given** un lote parcialmente válido que el comportamiento existente acepta, **When** se procesa, **Then** figura como envío aceptado y no se cuenta como petición rechazada; no se inventan rechazos por registros omitidos.
3. **Given** lectura pública deshabilitada, **When** una persona sin autorización consulta el diagnóstico, **Then** no obtiene fechas, colecciones ni recuentos de recepción.
4. **Given** peticiones con cuerpos y credenciales sintéticas distintivas, **When** se revisa la información generada por el diagnóstico, **Then** no aparece ninguno de esos contenidos ni identificadores del remitente.

### Edge Cases

- Reintentos y duplicados: un reintento aceptado actualiza el último envío, pero no rejuvenece la fecha ni la primera recepción conocida de una lectura ya almacenada.
- Lotes fuera de orden: la referencia de actualidad es la lectura almacenada con mayor fecha que no esté en el futuro, independientemente del orden de llegada.
- Datos anteriores a esta función: se conserva la fecha de lectura, pero la aceptación histórica y el retraso desconocidos se muestran como no disponibles.
- Vacío o sin registros nuevos: si la operación existente termina con éxito, cuenta como aceptación y no prueba la existencia de nuevas lecturas.
- Fallo de almacenamiento: no se registra aceptación; se contabiliza como fallo interno si el resumen puede guardarse, sin alterar el resultado original ni inventar un recuento cuando no pueda guardarse.
- Cambios del reloj: las fechas futuras se evalúan en cada consulta; no se sustituyen edades negativas por cero ni retrasos negativos por recepción inmediata.
- Consultas, borrados, configuración y rutas desconocidas quedan fuera de los recuentos de envíos.
- Peticiones concurrentes: cada rechazo observable se cuenta una sola vez sin perder incrementos; el último envío conserva el instante de aceptación más reciente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El diagnóstico DEBE presentar por separado disponibilidad observada al consultar, último envío aceptado y actualidad de lecturas. Responder ahora no DEBE prometer disponibilidad histórica ni recepción continua.
- **FR-002**: El último envío aceptado DEBE incluir fecha de aceptación según el reloj del servicio, tiempo transcurrido y colección: lecturas, tratamientos o perfil. Solo una operación de envío finalizada con éxito puede actualizarlo, incluidos reintentos y operaciones sin nuevos registros que ya se acepten.
- **FR-003**: El diagnóstico DEBE distinguir ausencia de lecturas, lecturas recientes, lecturas antiguas y ausencia de lecturas no futuras. La referencia será la lectura conservada con mayor fecha no posterior al instante de consulta.
- **FR-004**: El umbral de actualidad DEBE ser visible y conservar la regla existente: el mayor entre cinco minutos y dos intervalos de refresco configurados. Una antigüedad entre cero y el umbral inclusive se considera reciente.
- **FR-005**: Para la lectura de referencia se DEBEN mostrar fecha y antigüedad respecto a la consulta, instante de su primera aceptación conocida y retraso de recepción, definido como aceptación menos fecha de lectura. Las magnitudes desconocidas DEBEN indicarse como no disponibles. La precisión temporal mostrada DEBE ser al menos de minutos.
- **FR-006**: Toda lectura conservada con fecha posterior al instante de consulta DEBE identificarse como futura y excluirse del cálculo de actualidad. El diagnóstico DEBE mostrar una advertencia y el número de lecturas futuras conservadas; ninguna debe simular antigüedad cero. Cuando se muestre su retraso, un valor negativo DEBE identificarse como anomalía temporal.
- **FR-007**: El sistema DEBE contar peticiones de envío rechazadas en las colecciones soportadas, con un total y categorías mutuamente excluyentes: autenticación/configuración incompleta, cuerpo excesivo, formato/validación y fallo interno. Cada petición suma una vez, según el motivo que determina su respuesta; los registros de un lote no se cuentan como peticiones independientes.
- **FR-008**: Los recuentos DEBEN ser acumulados desde el inicio de observación indicado, comenzar en cero, persistir entre consultas y reinicios ordinarios y ocupar espacio acotado sin historial de eventos. Los fallos anteriores al servicio o que impidan guardar el resumen no se presentarán como contabilizados; esta limitación DEBE explicarse.
- **FR-009**: La información adicional de diagnóstico DEBE limitarse a fechas, colección, categoría, recuentos y parámetros de interpretación. No DEBE guardar ni registrar cuerpos, valores de glucosa, notas, credenciales, cabeceras, direcciones del remitente ni URL con credenciales. Esto no modifica la conservación ordinaria de datos aceptados del respaldo.
- **FR-010**: El diagnóstico DEBE respetar los permisos de consulta existentes y la opción explícita de lectura pública. Las consultas no autorizadas no DEBEN revelar sus metadatos; la exposición pública DEBE describirse en las guías.
- **FR-011**: Las páginas de estado en español e inglés DEBEN mostrar indicadores y explicaciones equivalentes, incluyendo ausencia de datos y limitaciones. Las guías en ambos idiomas DEBEN explicar aceptación, actualidad, retraso, fechas futuras y recuentos.
- **FR-012**: Esta función DEBE conservar los contratos de recepción, autenticación, consulta, deduplicación y retención existentes. Detectar fechas futuras no cambia su aceptación, almacenamiento ni respuestas a clientes; solo cambia su interpretación diagnóstica.
- **FR-013**: La función DEBE mantener los datos existentes sin borrarlos ni atribuirles fechas de recepción inventadas. El inicio de observación DEBE distinguirse de la antigüedad de la instalación.
- **FR-014**: Los indicadores DEBEN presentarse como diagnóstico operativo de un respaldo informativo, sin recomendaciones clínicas ni garantías de validez para decisiones de tratamiento.
- **FR-015**: Los nuevos indicadores DEBEN mostrarse exclusivamente en las páginas de estado existentes en español e inglés. La respuesta de estado para clientes DEBE permanecer sin cambios; no se añade una consulta de diagnóstico independiente.

### Key Entities *(include if feature involves data)*

- **Resumen de recepción**: Inicio de observación, fecha y colección del último envío aceptado, total de rechazos y recuentos por categoría; pertenece a una instalación.
- **Referencia temporal de lectura**: Fecha original y primera aceptación conocida de una lectura conservada; permite distinguir antigüedad y retraso sin copiar su contenido al diagnóstico.
- **Evaluación de actualidad**: Instante de consulta, umbral, lectura no futura de referencia, clasificación y número de lecturas futuras conservadas; cambia con el tiempo y los datos disponibles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de los escenarios de aceptación, el usuario puede distinguir los tres indicadores en una sola consulta, incluidos servidor disponible sin datos y envío reciente con lecturas antiguas.
- **SC-002**: En el 100 % de los casos con fechas futuras, estas no originan un estado de lecturas recientes; las combinaciones con lecturas antiguas y recientes conservan la clasificación correcta.
- **SC-003**: En una secuencia verificable de 20 peticiones rechazadas, incluidas peticiones simultáneas, el total y las categorías suman exactamente 20 cuando el resumen está disponible; envíos aceptados y consultas no aumentan el total.
- **SC-004**: La información de diagnóstico conservada y mostrada contiene cero cuerpos, credenciales o identificadores de remitentes de las peticiones sintéticas de comprobación.
- **SC-005**: Los nuevos indicadores están disponibles en la siguiente consulta posterior a una operación finalizada y aparecen tras el siguiente refresco normal, con resultados equivalentes en español e inglés.
- **SC-006**: El 100 % de los escenarios de permisos, datos previos y reintentos conserva el acceso esperado y evita inventar fechas de recepción o rejuvenecer lecturas duplicadas.

## Assumptions

- La audiencia son personas que comprueban su instalación de respaldo; el diagnóstico se consulta solo en las páginas de estado existentes en español e inglés, sin añadir alertas, paneles externos, consultas independientes, historial por petición ni diagnóstico clínico.
- Los envíos incluyen las operaciones existentes de creación de lecturas y tratamientos y de creación o sustitución de perfil; quedan fuera borrados, consultas y configuración.
- El reloj del servicio es la referencia para aceptación y consulta. Se considera futura cualquier fecha estrictamente posterior, sin tolerancia implícita; reconocer el desfase no permite corregir el reloj del cliente.
- Se mantienen el umbral de actualidad y el refresco existentes. No se añade una configuración nueva ni se cambia la retención del respaldo.
- Los recuentos comienzan con la activación de la función, no reconstruyen fallos históricos y no requieren un control de reinicio manual en este alcance.
- La interpretación de fechas futuras se limita al diagnóstico de lecturas; no introduce nuevas reglas de validación para tratamientos o perfiles.
- La planificación deberá evaluar compatibilidad, impacto en datos existentes, persistencia acotada y coste operativo según la constitución vigente.
