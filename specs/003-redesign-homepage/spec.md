# Feature Specification: Página principal compacta y jerarquizada

**Feature Branch**: `004-redesign-homepage`

**Created**: 2026-10-05

**Status**: In progress — technical implementation complete; usability validation pending (T016)

**Input**: User description: "Quiero como usuario ver la información de la página principal de una forma más atractiva e intuitiva, basada en los estilos del 2026, sencilla y compacta, y que la información se organiza por importancia dentro de la web, de más importante a menos de arriba a abajo."

## Clarifications

### Session 2026-10-05

- Q: ¿Qué información del último tratamiento debe verse en móvil sin tener que desplazarse? → A: Lectura y resumen del tratamiento —tipo, fecha e insulina si existe— visibles inicialmente; notas completas más abajo.
- Q: ¿Cómo quieres consultar los detalles técnicos de recepción? → A: Resumen y avisos visibles; detalles desplegables, cerrados inicialmente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender lo esencial al abrir la página (Priority: P1)

Como usuario del respaldo, quiero identificar la última lectura y su antigüedad al abrir la página, consultar inmediatamente después el último tratamiento, que considero información crítica, y luego comprobar si se están recibiendo datos, sin buscar entre detalles secundarios.

**Why this priority**: La lectura y su actualidad ocupan la primera posición; el último tratamiento es información crítica y ocupa la segunda, por delante del diagnóstico de recepción. Un servidor disponible no garantiza datos recientes.

**Independent Test**: Abrir una instalación configurada con datos sintéticos recientes, antiguos y ausentes, y comprobar la información inicial y el orden de sus bloques.

**Acceptance Scenarios**:

1. **Given** una instalación configurada con lecturas, **When** se abre la página, **Then** la última lectura, su unidad, dirección disponible y antigüedad aparecen antes del diagnóstico detallado, tratamientos e información del proyecto.
2. **Given** lecturas antiguas o inexistentes, **When** se abre la página, **Then** el primer bloque distingue datos antiguos de ausencia de datos, sin presentar la disponibilidad del servicio como recepción reciente.
3. **Given** información de recepción y un tratamiento, **When** se recorre la página de arriba abajo, **Then** el orden es lectura y actualidad, último tratamiento, resumen de recepción con sus detalles e información secundaria del servicio.
4. **Given** una instalación sin tratamientos, **When** se recorre la página, **Then** el estado vacío del último tratamiento conserva la segunda posición, antes del resumen de recepción.

---

### User Story 2 - Consultar una interfaz clara y compacta (Priority: P2)

Como usuario, quiero leer una página visualmente coherente, con títulos claros y bloques breves, tanto desde el teléfono como desde el ordenador.

**Why this priority**: La jerarquía necesita una presentación legible que reduzca el esfuerzo de encontrar información.

**Independent Test**: Revisar la página a 360, 768 y 1440 píxeles de ancho, con datos sintéticos y textos largos, y recorrer sus controles con teclado.

**Acceptance Scenarios**:

1. **Given** una pantalla de 360 por 800 píxeles y configuración completada, **When** se abre la página con tamaño de texto predeterminado, **Then** se ven la lectura o su estado vacío, su actualidad y el resumen del último tratamiento (tipo, fecha e insulina si existe) o su estado vacío sin desplazarse, y no hay desplazamiento horizontal; las notas completas quedan más abajo dentro del bloque de tratamiento.
2. **Given** un ordenador o teléfono, **When** se consulta la página, **Then** cada bloque tiene un título reconocible y el valor de la lectura tiene mayor énfasis visual que las cifras secundarias; la decoración no ocupa bloques independientes.
3. **Given** uso de teclado o ampliación del texto al 200 %, **When** se recorren los contenidos y acciones, **Then** los controles tienen foco visible y nombres comprensibles y no se pierde información por recortes o superposición.

---

### User Story 3 - Encontrar acciones y detalles cuando hacen falta (Priority: P3)

Como usuario, quiero acceder a la configuración pendiente, los detalles de recepción y los enlaces del servicio sin que compitan con la lectura principal durante las visitas habituales.

**Why this priority**: Conserva la utilidad operativa y la configuración existente sin sobrecargar la consulta cotidiana.

**Independent Test**: Revisar una sesión de configuración autorizada, otra sesión sin permiso para ver el secreto y una visita posterior a la confirmación, en ambos idiomas.

**Acceptance Scenarios**:

1. **Given** una sesión autorizada con configuración pendiente, **When** se abre la página, **Then** la acción necesaria para guardar y confirmar el secreto aparece antes de la información habitual y conserva su revelación limitada a esa sesión.
2. **Given** configuración completada, **When** se abre la página posteriormente, **Then** no reaparece el secreto y los enlaces de estado y repositorio se encuentran después de los bloques principales.
3. **Given** cualquiera de los dos idiomas disponibles, **When** se consultan los mismos datos, **Then** se mantiene el mismo orden, las mismas acciones y el mismo significado de estados y avisos.
4. **Given** una visita inicial con diagnóstico de recepción, **When** se consulta el bloque de recepción, **Then** su resumen y avisos están visibles y las cifras técnicas detalladas están cerradas; una acción claramente etiquetada permite abrirlas y volver a cerrarlas con teclado o puntero.
5. **Given** detalles de recepción abiertos por el usuario, **When** se actualiza periódicamente la información, **Then** los detalles permanecen abiertos y el usuario conserva la posición de consulta y el foco del control que esté utilizando.

### Edge Cases

- Sin lecturas ni tratamientos: mostrar estados vacíos explícitos, sin valores inventados ni grandes espacios reservados para datos inexistentes.
- Solo lecturas con fecha futura: explicar que no hay lectura no futura disponible y no presentar esas fechas como datos recientes.
- Dirección desconocida, notas extensas o nombres largos: mantener la información legible sin desbordamiento; cualquier contenido abreviado debe poder consultarse completo.
- Diagnóstico de recepción no disponible: indicar esa limitación sin ocultar la lectura disponible ni deducir recepción correcta.
- Envíos rechazados o datos antiguos: mostrar un aviso textual dentro del resumen de recepción; no depender solo de colores o iconos.
- Configuración abierta desde otra sesión: conservar el mensaje correspondiente sin revelar credenciales.
- Actualización periódica: conservar la posición de consulta y el foco del control en uso, sin cerrar los detalles de recepción que el usuario haya abierto.
- Acceso no autorizado con lecturas privadas: conservar el rechazo existente sin mostrar resúmenes de datos mediante el rediseño.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La página DEBE ordenar sus bloques de arriba abajo por esta prioridad: última lectura y actualidad, último tratamiento, recepción, detalles del servicio y enlaces secundarios. El orden de lectura asistida DEBE coincidir con ese orden visual.
- **FR-002**: El bloque principal DEBE mostrar la última lectura válida disponible, su unidad, su fecha o antigüedad y su dirección cuando exista; DEBE distinguir datos ausentes, antiguos y fechas futuras sin inventar valores.
- **FR-003**: La recepción DEBE ofrecer un resumen textual siempre visible que distinga disponibilidad del servicio y actualidad de datos; los avisos de rechazos, datos antiguos y falta de diagnóstico DEBEN quedar visibles sin desplegar detalles. Las cifras técnicas detalladas existentes DEBEN agruparse en una sección desplegable dentro de ese bloque, cerrada inicialmente y accesible mediante una acción claramente etiquetada que permita abrirla y cerrarla con teclado o puntero. La actualización periódica DEBE conservar su estado abierto o cerrado, la posición de consulta y el foco del control en uso. Si el navegador bloquea tanto el almacenamiento por pestaña como el estado del historial, la página DEBE seguir funcionando y actualizándose, aunque no pueda conservar apertura, foco y posición; esta limitación DEBE documentarse y comprobarse.
- **FR-004**: La configuración pendiente que requiera una acción del usuario DEBE ocupar la primera posición, por delante de los bloques habituales, conservando las acciones, restricciones de sesión y confirmación existentes.
- **FR-005**: El último tratamiento DEBE presentarse como información crítica en el segundo bloque, inmediatamente después de la lectura y antes de la recepción, incluso cuando muestre un estado vacío. Su resumen DEBE incluir el tipo, la fecha e insulina cuando exista; las notas completas DEBEN seguir accesibles más abajo dentro del mismo bloque, antes de la recepción. DEBE conservar los campos actualmente disponibles y un estado vacío comprensible cuando no haya tratamientos; su encabezado y contenido DEBEN tener mayor énfasis que los detalles operativos de recepción, sin superar el énfasis de la lectura principal.
- **FR-006**: La presentación DEBE usar títulos breves, tipografía legible, espaciado consistente y superficies visualmente agrupadas. La lectura DEBE ser el dato de mayor tamaño; los textos explicativos y enlaces secundarios DEBEN tener menor énfasis sin perder legibilidad. No DEBE haber bloques puramente decorativos.
- **FR-007**: A 360, 768 y 1440 píxeles de ancho la página DEBE conservar su jerarquía sin desplazamiento horizontal. A 360 por 800 píxeles, tras completar la configuración y con texto predeterminado, la lectura o estado vacío, su actualidad y el resumen del último tratamiento definido en FR-005 o su estado vacío DEBEN estar visibles antes del primer desplazamiento. Esta condición no exige que las notas completas del tratamiento estén visibles inicialmente.
- **FR-008**: Los controles DEBEN poder usarse con teclado y tener foco visible y nombres accesibles. Los estados DEBEN incluir texto además de color o símbolos. Los textos normales DEBEN tener contraste mínimo de 4,5:1 y los textos grandes de 3:1; la ampliación al 200 % DEBE conservar contenido y acciones.
- **FR-009**: Las páginas en español e inglés DEBEN ofrecer equivalencia de información, orden y acciones, con etiquetas y mensajes comprensibles en el idioma seleccionado.
- **FR-010**: La página DEBE conservar un aviso visible de respaldo informativo, sin uso para dosificación o decisiones de tratamiento. El aviso DEBE acompañar el área principal de consulta sin obligar a abrir detalles secundarios.
- **FR-011**: El rediseño DEBE preservar acceso autorizado, exposición pública configurada, revelación limitada del secreto, actualización periódica y enlaces existentes. Ningún texto procedente de datos externos DEBE convertirse en contenido activo de la página.
- **FR-012**: El alcance DEBE limitarse a presentación y organización de la página principal existente; no DEBE añadir interpretación clínica, recomendaciones, nuevas colecciones de datos ni cambios en conservación, compatibilidad con clientes o almacenamiento.

### Key Entities *(include if feature involves data)*

- **Lectura presentada**: Valor, unidad, dirección disponible y fecha o antigüedad de la lectura existente seleccionada para consulta.
- **Resumen de recepción**: Estado de disponibilidad, actualidad de datos, envíos aceptados o rechazados y limitaciones del diagnóstico existente.
- **Tratamiento presentado**: Último tratamiento existente con sus campos disponibles y estado de ausencia.
- **Estado de configuración**: Situación de inicialización y confirmación que determina acciones pendientes y acceso autorizado al secreto temporal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una evaluación con al menos cinco personas sin conocimientos de infraestructura, al menos el 80 % identifica la última lectura y su actualidad en diez segundos o menos, sin ayuda, y distingue el estado vacío cuando corresponda.
- **SC-002**: En el 100 % de los escenarios de aceptación de instalaciones configuradas, los cuatro grupos de información mantienen el orden definido en FR-001, en ambos idiomas; la configuración pendiente cumple su excepción explícita.
- **SC-003**: En los tres anchos definidos no hay desbordamiento horizontal; a 360 por 800 píxeles la información esencial cumple FR-007. Con ampliación al 200 % no se pierde información ni acceso a acciones.
- **SC-004**: El 100 % de las acciones se puede completar con teclado, todos los estados tienen una descripción textual y los textos cumplen los contrastes definidos en FR-008.
- **SC-005**: Al menos el 80 % de las personas de la evaluación califica la claridad y la facilidad para localizar información con cuatro o cinco puntos sobre cinco.
- **SC-006**: En todos los escenarios de configuración, privacidad y ausencia de datos, se conserva la visibilidad autorizada de información y credenciales, sin revelar secretos tras la confirmación ni presentar valores inexistentes.

## Assumptions

- «Página principal» se refiere a la página de estado existente y sus variantes en español e inglés, incluyendo las visitas durante configuración.
- «Estilos del 2026» expresa una preferencia por una apariencia contemporánea y sobria: jerarquía tipográfica, agrupaciones simples, espaciado contenido y decoración limitada. No exige una tendencia concreta, tema nuevo ni animaciones.
- La lectura y su actualidad se consideran la información cotidiana más importante. El usuario establece el último tratamiento como información crítica en segundo lugar; la recepción ocupa el tercero, y la configuración pendiente es una excepción temporal de prioridad.
- Se reutilizan datos y estados existentes. Los detalles operativos de recepción siguen disponibles mediante una sección desplegable cerrada inicialmente; el resumen y los avisos permanecen visibles.
- La función depende de los comportamientos existentes de recepción, configuración y acceso; cualquier brecha previa descubierta se documentará por separado.
- La evaluación de usabilidad y las comprobaciones visuales se realizarán durante implementación con datos sintéticos. Los criterios anteriores son objetivos de aceptación, no resultados ya medidos.
- Esta fase entrega la especificación; el diseño detallado, las capturas y la implementación corresponden a fases posteriores.
