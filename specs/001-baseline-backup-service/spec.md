# Feature Specification: Base existente de GlucoEasy

**Feature Branch**: `001-baseline-backup-service`

**Created**: 2026-10-04

**Status**: Baseline documentada por ingeniería inversa; pendiente de revisión del responsable

**Input**: User description: "Crear una spec que recoja la implementación ya implementada para continuar con desarrollo spec first usando Spec Kit."

Esta especificación describe el comportamiento observable de la versión 0.1.0, revisada en el commit `728af291c77c9cabd8396d8335b92181cea00564`. No propone reconstruir el servicio ni certifica su cumplimiento constitucional. Los requisitos siguientes describen la base que se debe preservar, salvo cambio expresamente especificado. Los contratos detallados y las brechas conocidas figuran en [contracts.md](contracts.md) y [evidence.md](evidence.md).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preparar y proteger una instalación (Priority: P1)

Como propietario, quiero obtener una credencial y configurar mis clientes sin administrar usuarios.

**Why this priority**: La credencial permite enviar datos y controlar su acceso.

**Independent Test**: Visitar una instalación vacía, conservar la credencial y comprobar envío autorizado y rechazo de credenciales incorrectas.

**Acceptance Scenarios**:

1. **Given** una instalación sin secreto manual ni configuración previa, **When** se visita la página de estado, **Then** se genera un secreto de seis caracteres que se muestra a la sesión inicial.
2. **Given** esa sesión, **When** se confirma haber guardado el secreto, **Then** se oculta definitivamente en visitas posteriores y sigue permitiendo escribir datos.
3. **Given** un secreto manual configurado, **When** se consulta o escribe, **Then** ese secreto tiene precedencia y no se muestra en la página.
4. **Given** una instalación configurada, **When** se escribe sin credencial válida, **Then** se rechaza la operación sin modificar los datos.
5. **Given** lectura pública deshabilitada y servicio configurado, **When** un visitante sin credencial consulta datos o estado, **Then** se rechaza el acceso; con lectura pública habilitada se permite.

### User Story 2 - Respaldar y recuperar lecturas recientes (Priority: P1)

Como usuario de un cliente compatible, quiero enviar lecturas y recuperar las más recientes para disponer de un respaldo informativo.

**Why this priority**: Es la finalidad principal del servicio.

**Independent Test**: Enviar lecturas sintéticas individuales y en lote, repetirlas y consultar la última y un intervalo temporal.

**Acceptance Scenarios**:

1. **Given** una credencial válida, **When** se envía un objeto o lote con valores y fechas aceptados, **Then** se conservan las lecturas normalizadas y sus campos adicionales.
2. **Given** lecturas ya guardadas, **When** se reenvía una lectura con el mismo identificador o instante, **Then** no se multiplica y la versión entrante tiene precedencia.
3. **Given** varias lecturas, **When** se consulta la última, una cantidad o un intervalo, **Then** se devuelven las coincidencias de más reciente a más antigua.
4. **Given** un límite de conservación N, **When** se superan N lecturas diferentes, **Then** se conservan las N más recientes.

### User Story 3 - Respaldar y borrar tratamientos (Priority: P2)

Como usuario de una integración compatible, quiero conservar eventos de tratamiento ya registrados y poder eliminarlos sin ejecutar tratamientos.

**Why this priority**: Mantiene el intercambio con clientes existentes.

**Independent Test**: Enviar eventos sintéticos, filtrar por fecha y tipo y repetir el borrado de un identificador.

**Acceptance Scenarios**:

1. **Given** eventos válidos, **When** se envían individualmente o en lote, **Then** se normalizan fechas e identidad y se conservan campos adicionales.
2. **Given** registros de distintas fechas, **When** se consulta sin filtro temporal, **Then** solo se devuelven los de las últimas 24 horas, con un máximo predeterminado de 1000.
3. **Given** eventos equivalentes por identidad alternativa o fecha y tipo, **When** se reenvían, **Then** se deduplican y prevalece el primer evento entrante equivalente.
4. **Given** un identificador de tratamiento, **When** se borra dos veces con autorización, **Then** ambas respuestas son satisfactorias e indican respectivamente si se eliminó algún registro.

### User Story 4 - Intercambiar el perfil actual (Priority: P2)

Como integración, quiero guardar y recuperar un perfil actual compatible sin requerir historial de perfiles.

**Why this priority**: Permite sincronización mínima con clientes que utilizan perfiles.

**Independent Test**: Guardar dos perfiles consecutivos y verificar que solo se recupera el último.

**Acceptance Scenarios**:

1. **Given** ausencia de perfil, **When** se consulta el actual o la colección, **Then** se obtiene respectivamente un objeto vacío o una colección vacía.
2. **Given** un perfil guardado, **When** se envía otro mediante cualquiera de las dos formas de escritura soportadas, **Then** el nuevo sustituye completamente al anterior.

### User Story 5 - Comprobar recepción y estado (Priority: P2)

Como propietario, quiero ver el estado en español o inglés y distinguir datos recientes, antiguos y ausentes.

**Why this priority**: Permite diagnosticar el respaldo sin atribuirle validez clínica.

**Independent Test**: Consultar ambas páginas con cero, una y dos lecturas y con tratamientos con y sin insulina.

**Acceptance Scenarios**:

1. **Given** dos lecturas, **When** se abre el estado en cualquiera de los idiomas, **Then** se muestra la última glucosa en mg/dL, dirección, antigüedad y diferencia con la anterior.
2. **Given** ausencia de lecturas o lecturas antiguas, **When** se consulta el estado, **Then** se distingue espera de datos de recepción antigua.
3. **Given** tratamientos guardados, **When** se consulta el estado, **Then** se selecciona el más reciente con un campo de insulina numérico o texto no vacío; solo un valor numérico se muestra como cantidad en unidades.
4. **Given** configuración confirmada, **When** permanece abierta la página, **Then** se recarga con el intervalo configurado, 30 segundos por defecto; durante la revelación o configuración pendiente no se recarga automáticamente.

### Edge Cases

- Un lote con un elemento inválido se rechaza completo antes de guardarse; un lote vacío se acepta sin añadir registros.
- Un cuerpo mayor de 256 KiB o JSON inválido se rechaza con error de solicitud.
- Escribir o borrar antes de configurar el secreto se rechaza por servicio no preparado; las consultas anteriores a la configuración no exigen secreto.
- Un intervalo sin coincidencias devuelve una colección vacía; la consulta de última lectura sigue devolviendo una colección de cero o un elemento.
- Eventos distintos que comparten fecha normalizada y tipo se consideran duplicados aunque difieran en otros campos.
- El secreto puede volver a verse en la sesión inicial mientras no se confirme; perder esa sesión no concede acceso de revelación a otro visitante.
- Un filtro de tratamientos sobre un campo ausente no coincide; los operadores no soportados se ignoran.
- Los valores coercibles a número, incluidos `null`, cadena vacía o booleanos en glucosa, tienen el comportamiento existente registrado en las brechas; no se declara validación clínica.
- No existe recuperación o rotación del secreto generado desde la interfaz.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El servicio DEBE ofrecer respaldo reciente para una única instalación compartida, sin cuentas ni aislamiento entre pacientes (historias 1–5).
- **FR-002**: El propietario DEBE poder inicializar el secreto desde cualquiera de las dos páginas de estado, con revelación limitada a la sesión inicial hasta confirmación y precedencia del secreto manual (historia 1).
- **FR-003**: Toda escritura y borrado DEBE exigir credencial válida y rechazar operaciones antes de disponer de secreto; la lectura de datos y estado DEBE depender de la opción de exposición pública una vez configurado (historia 1).
- **FR-004**: Los clientes DEBEN poder usar las formas de credencial existentes, con precedencia definida y sin crear usuarios (historia 1; contratos de autenticación).
- **FR-005**: El servicio DEBE recibir lecturas individuales o en lote, normalizar valor, fecha e identidad, conservar campos adicionales y rechazar lotes inválidos completos según las reglas existentes (historia 2; contratos de normalización).
- **FR-006**: Las lecturas DEBEN deduplicarse por identificador o instante, con precedencia de los datos entrantes, orden descendente y conservación acotada (historia 2).
- **FR-007**: Los clientes DEBEN poder consultar lecturas por cantidad, límites temporales inclusivos, tipo de glucosa o última lectura (historia 2).
- **FR-008**: El servicio DEBE recibir tratamientos individuales o en lote con fecha interpretable, preservar atributos adicionales y normalizar identidad y fechas (historia 3).
- **FR-009**: Los tratamientos DEBEN deduplicarse por cualquiera de sus identidades soportadas o por fecha y tipo, conservarse por orden descendente y someterse al mismo límite configurable que las lecturas, en una colección independiente (historia 3).
- **FR-010**: Los clientes DEBEN poder combinar filtros de tratamientos por igualdad o comparación; sin filtro temporal se aplica una ventana de 24 horas y sin cantidad explícita un máximo de 1000 (historia 3).
- **FR-011**: El borrado autorizado DEBE admitir las identidades alternativas soportadas y ser idempotente (historia 3).
- **FR-012**: El servicio DEBE guardar un único perfil actual, reemplazarlo completo y ofrecer las formas de consulta vacías y pobladas existentes, sin historial (historia 4).
- **FR-013**: El estado en español e inglés DEBE mostrar la última lectura, antigüedad, dirección, diferencia disponible y recuentos de registros; la selección del tratamiento visible sigue la regla de insulina de la historia 5.
- **FR-014**: El estado DEBE distinguir ausencia de lecturas, recepción reciente y recepción antigua; reciente significa antigüedad no superior al mayor entre cinco minutos y dos intervalos de refresco (historia 5).
- **FR-015**: El servicio DEBE conservar las respuestas mínimas de identificación y compatibilidad, incluida colección vacía de estado de dispositivos, sin anunciar compatibilidad Nightscout completa (contratos; historia 5).
- **FR-016**: El límite de cuerpo DEBE ser 256 KiB; la retención predeterminada DEBE ser 2000 registros por colección y el refresco predeterminado 30 segundos, con reglas de configuración descritas en contratos (historias 2, 3 y 5).

### Key Entities *(include if feature involves data)*

- **Lectura**: Valor de glucosa, instante numérico, fecha textual normalizada, identidad, tipo, dispositivo y atributos opcionales del cliente.
- **Tratamiento**: Evento recibido con identidad principal y alternativas, fecha, tipo, notas, autor, marcas de creación/modificación y atributos adicionales, como insulina o carbohidratos.
- **Perfil actual**: Último documento de configuración recibido; puede contener perfiles nombrados y uno predeterminado. No representa historial.
- **Configuración inicial**: Secreto persistente y autorización temporal para mostrarlo hasta confirmación.
- **Resumen de estado**: Recuentos, última y penúltima lectura y tratamiento seleccionado para presentación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Estos resultados son criterios de aceptación de la base, no métricas de producción ni afirmaciones de cobertura exhaustiva.

- **SC-001**: Dos envíos equivalentes producen un solo registro recuperable y conservan la versión entrante según su contrato de deduplicación.
- **SC-002**: Al enviar N+1 registros distintos, se recuperan como máximo N y se conserva el más reciente, tanto en lecturas como en tratamientos.
- **SC-003**: Una consulta de última lectura devuelve como máximo un registro; los intervalos y cantidades limitan todas las respuestas al conjunto solicitado.
- **SC-004**: Cero escrituras o borrados con credenciales incorrectas alteran los datos; cero consultas protegidas sin credencial revelan datos una vez configurado.
- **SC-005**: Después de confirmar la configuración, el secreto generado aparece cero veces en las visitas ordinarias posteriores.
- **SC-006**: Las dos versiones de la página muestran los mismos datos sintéticos y distinguen los tres estados de recepción.
- **SC-007**: Dos borrados consecutivos del mismo tratamiento terminan satisfactoriamente y dejan cero registros con la identidad eliminada.
- **SC-008**: Después de sustituir el perfil, solo se recupera el último documento y la colección contiene como máximo un perfil.

## Assumptions

- El alcance es informativo y secundario. No incluye cálculo de dosis, ejecución de tratamientos, análisis clínico, alertas, archivo completo ni Nightscout completo.
- La constitución 1.0.0 prevalece. Las brechas de la base no son excepciones aprobadas ni autorización para conservar defectos en cambios futuros.
- El propietario controla el despliegue y los clientes; la primera sesión que visita el estado puede inicializarlo. No existe identidad de propietario previa a esa visita.
- La configuración distribuida habilita lectura pública: quien conoce la URL puede consultar datos de salud. Esto no equivale a un despliegue privado.
- El servicio depende de la plataforma de alojamiento y de clientes compatibles para recibir datos; no promete disponibilidad, costes constantes ni validez clínica.
- Esta entrega modifica documentación y contexto local de Spec Kit; no altera comportamiento, secretos, datos desplegados ni esquemas.
