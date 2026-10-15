# Feature Specification: Rediseño integral con identidad técnica

**Feature Branch**: `004-technical-ui-redesign`

**Created**: 2026-10-15

**Status**: Closed — 2026-10-15, por solicitud expresa del responsable. Implementación técnica completada y diseño aceptado; 34 tareas ejecutadas y 2 cerradas por dispensa. SC-002 no verificado: evaluación humana no realizada, exceptuada para este cierre. Evidencia en [validation-results.md](validation-results.md).

**Input**: User description: "sigue sin gustarme la interfaz web actual, necesito que hagas una limpieza y rediseño total. Los modulos con los datos que muestra creo que son correctos, pero el diseño es un poco insulso. No se si darle un aspecto más técnico, más de desarrollo le daría un toque más acertado"

## Clarifications

### Session 2026-10-15

- Q: ¿Cómo quieres que funcione el tema visual de la nueva interfaz? → A: Siempre oscuro, con fondo grafito y acentos fríos; sin variante clara ni selector de tema.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar un respaldo con identidad visual propia (Priority: P1)

Como usuario habitual, quiero una interfaz con el carácter de una herramienta técnica cuidada, reconocer la lectura y su actualidad inmediatamente y encontrar después el último tratamiento, conservando la información que ya utilizo.

**Why this priority**: El problema expresado es visual. La renovación debe percibirse en toda la página y conservar la utilidad de los módulos.

**Independent Test**: Comparar la interfaz actual y la propuesta con los mismos datos sintéticos, en escritorio y móvil, verificando composición, jerarquía y presencia de campos.

**Acceptance Scenarios**:

1. **Given** una instalación con lectura y tratamiento, **When** se abre la página, **Then** cabecera, lectura, tratamiento, recepción y pie comparten una composición técnica coherente, con cifras alineadas, separadores definidos y mayor énfasis en la lectura.
2. **Given** los mismos datos en ambas versiones, **When** se comparan, **Then** cambian composición, tipografía, superficies, espaciado y controles, conservando todos los campos disponibles.
3. **Given** datos recientes, antiguos, inexistentes o exclusivamente futuros, **When** se consulta la lectura, **Then** el estado se expresa con texto y la disponibilidad del servidor se distingue de la recepción reciente.

---

### User Story 2 - Utilizar una consola compacta y legible (Priority: P2)

Como usuario de móvil y ordenador, quiero una presentación precisa y compacta con etiquetas comprensibles, sin necesitar conocimientos de desarrollo.

**Why this priority**: La identidad técnica debe conservar la accesibilidad de la consulta cotidiana.

**Independent Test**: Recorrer la página a 360, 768 y 1440 píxeles, con teclado, ampliación y textos extensos en ambos idiomas.

**Acceptance Scenarios**:

1. **Given** una pantalla de 360 × 800 píxeles y configuración completada, **When** se consulta con texto predeterminado, **Then** lectura, actualidad y resumen del tratamiento —tipo, fecha e insulina cuando exista— o sus estados vacíos se ven antes de desplazarse, sin desbordamiento horizontal; las notas completas pueden quedar más abajo.
2. **Given** una pantalla de escritorio, **When** se abre la página, **Then** los campos relacionados se alinean y aprovechan el ancho disponible conservando el recorrido lectura, tratamiento, recepción e información secundaria.
3. **Given** teclado o texto ampliado al 200 %, **When** se recorren acciones y detalles, **Then** se conserva el contenido y hay foco visible y nombres comprensibles para todos los controles.
4. **Given** notas, tipos, direcciones o direcciones de conexión extensas, **When** se muestran, **Then** no invaden otros campos y cualquier abreviación permite consultar el contenido íntegro.
5. **Given** un dispositivo con preferencia de apariencia clara u oscura, **When** se abre cualquiera de las páginas o estados de configuración, **Then** la interfaz mantiene su tema oscuro grafito con acentos fríos, sin selector de tema.

---

### User Story 3 - Conservar diagnóstico y configuración (Priority: P3)

Como responsable de una instalación, quiero consultar recepción y completar la configuración con el mismo lenguaje visual de la consulta habitual, manteniendo acciones y protecciones.

**Why this priority**: El rediseño integral incluye las situaciones que requieren actuar y los estados sin datos.

**Independent Test**: Revisar configuración autorizada, otra sesión, visita posterior a confirmación y recepción con avisos, en español e inglés.

**Acceptance Scenarios**:

1. **Given** configuración pendiente en la sesión autorizada, **When** se abre la página, **Then** aparece antes de los módulos habituales y el secreto, la dirección de conexión y la confirmación son legibles y utilizables.
2. **Given** otra sesión o una visita posterior a confirmación, **When** se abre la página, **Then** no se revela el secreto y se conserva el mensaje aplicable.
3. **Given** rechazos, fechas futuras o diagnóstico no disponible, **When** se consulta recepción, **Then** el resumen y sus avisos son visibles con los detalles cerrados inicialmente; pueden abrirse y cerrarse con teclado o puntero.
4. **Given** detalles abiertos y un control con foco, **When** ocurre una actualización periódica, **Then** se conservan apertura, posición y foco en las condiciones soportadas actualmente.
5. **Given** los mismos datos en ambos idiomas, **When** se consultan las páginas, **Then** coinciden módulos, prioridades, acciones y significado de estados.

### Edge Cases

- Sin lecturas ni tratamientos: estados vacíos explícitos y compactos, sin cifras inventadas ni grandes paneles sin contenido.
- Solo fechas futuras o datos antiguos: advertencias legibles que no sugieren recepción reciente.
- Diagnóstico no disponible: conservar los datos disponibles y explicar la limitación.
- Tratamiento sin insulina, tipo o notas: distinguir ausencia de cero, sin completar valores inventados.
- Textos extensos y ampliación: el acceso completo al contenido prevalece sobre la visibilidad inicial exigida con texto predeterminado.
- Almacenamiento por pestaña y estado del historial bloqueados: conservar funcionamiento y actualización, con la limitación existente de restauración documentada.
- Acceso no autorizado a lecturas privadas: conservar el rechazo sin revelar resúmenes ni credenciales.
- Contenido externo con caracteres especiales: mostrar texto inerte sin ejecución ni alteración de la interfaz.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El rediseño DEBE abarcar cabecera, lectura, tratamiento, recepción, información del servicio, configuración, estados vacíos, avisos, enlaces y controles. DEBE renovar composición, tipografía, superficies, espaciado y controles como conjunto, superando un simple cambio de paleta.
- **FR-002**: La identidad DEBE evocar una consola operativa de desarrollo mediante alineaciones consistentes, separadores definidos, superficies de geometría contenida, cifras de ancho uniforme y tipografía monoespaciada para valores y metadatos. Los textos de ayuda DEBEN tener tipografía de lectura cómoda y lenguaje comprensible sin conocimientos de infraestructura.
- **FR-003**: Toda la interfaz DEBE usar siempre un tema oscuro con base grafito, superficies distinguibles y acentos fríos contenidos, independientemente de la preferencia de apariencia del dispositivo. No DEBE incorporar variante clara ni selector de tema. Los colores de estado DEBEN mantener significados consistentes y acompañarse de texto. La elección del tema está confirmada; la ejecución visual concreta sigue sujeta a la evaluación de SC-001.
- **FR-004**: El orden visual y de lectura asistida DEBE ser lectura y actualidad, último tratamiento, recepción e información del servicio. La configuración pendiente DEBE precederlos cuando requiera atención. La lectura DEBE tener mayor énfasis que el tratamiento y este mayor énfasis que los detalles operativos.
- **FR-005**: La consulta DEBE conservar valor, unidad, dirección y variación de lectura cuando estén disponibles, su actualidad y los campos actuales del tratamiento: insulina, tipo, fecha, antigüedad y notas. DEBE conservar estados de ausencia y acceso al contenido íntegro de campos abreviados.
- **FR-006**: Recepción DEBE conservar resumen, avisos y todos los datos de diagnóstico existentes. El resumen y los avisos DEBEN permanecer visibles; el detalle DEBE empezar cerrado y permitir apertura y cierre con teclado o puntero.
- **FR-007**: A 360, 768 y 1440 píxeles DEBE conservarse la jerarquía sin desplazamiento horizontal. A 360 × 800 con texto predeterminado y configuración completada, lectura, actualidad y resumen del tratamiento —tipo, fecha e insulina cuando exista, sin exigir notas completas— o sus estados vacíos DEBEN verse sin desplazamiento vertical.
- **FR-008**: Todos los controles DEBEN tener nombres accesibles, foco visible y operación por teclado. El contraste DEBE alcanzar 4,5:1 para texto normal y 3:1 para texto grande y límites visuales necesarios para identificar controles. Al ampliar texto al 200 % DEBEN conservarse contenido y acciones sin recortes ni superposiciones.
- **FR-009**: La actualización periódica DEBE conservar apertura de detalles de recepción, posición y foco bajo las condiciones actualmente soportadas y seguir pausada durante configuración pendiente. No DEBEN introducirse animaciones continuas ni parpadeos.
- **FR-010**: Español e inglés DEBEN ofrecer los mismos módulos, campos, orden, acciones y estados, con textos adaptados y sin desbordamiento por traducción.
- **FR-011**: La configuración DEBE conservar la revelación del secreto limitada a la sesión autorizada y hasta su confirmación, la dirección de conexión y la confirmación. Acceso público o privado y enlaces existentes DEBEN conservar su comportamiento. El contenido externo DEBE mostrarse como texto inerte.
- **FR-012**: El aviso de respaldo informativo, sin uso para dosificación ni decisiones de tratamiento, DEBE seguir visible junto al área principal sin abrir detalles. La identidad técnica no DEBE añadir promesas de disponibilidad, precisión clínica o recomendaciones.
- **FR-013**: El alcance DEBE limitarse a la interfaz existente y sus idiomas. Excluye nuevos módulos de datos, gráficos históricos, edición de tratamientos, navegación multipágina, interpretación clínica y cambios en autenticación, conservación, compatibilidad con clientes o almacenamiento.
- **FR-014**: Antes de extender la propuesta a todos los estados, DEBE existir una vista representativa de escritorio y móvil con lectura, tratamiento y recepción sintéticos para evaluar la dirección frente a la versión actual. La entrega final DEBE incluir capturas en ambos idiomas y actualizar la documentación visual afectada en español e inglés.

### Key Entities *(include if feature involves data)*

- **Lectura presentada**: Valor, unidad, dirección, variación disponible y actualidad de la lectura existente, con sus estados de ausencia y limitación temporal.
- **Tratamiento presentado**: Último tratamiento existente, campos disponibles y estados de ausencia.
- **Diagnóstico de recepción**: Resumen, avisos y detalle operativo disponibles, diferenciados de disponibilidad del servidor.
- **Estado de configuración**: Inicialización y confirmación que determinan acciones pendientes y visibilidad temporal autorizada del secreto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al comparar la propuesta representativa con la interfaz actual usando los mismos datos, el responsable del producto puntúa al menos 4 sobre 5 tanto su carácter técnico como su atractivo visual y confirma que percibe un rediseño integral. Se registran puntuaciones y ajustes solicitados antes de considerar validada la dirección.
- **SC-002**: Al menos cuatro de cinco participantes sin conocimientos de infraestructura identifican lectura y actualidad en diez segundos o menos y localizan el último tratamiento en quince segundos o menos, sin ayuda.
- **SC-003**: En el 100 % de escenarios de aceptación de ambos idiomas se conservan campos, acciones y estados aplicables, sin datos inventados, secretos fuera de la sesión autorizada ni información privada en accesos rechazados.
- **SC-004**: Todas las vistas revisadas a 360, 768 y 1440 píxeles cumplen FR-007; con texto al 200 % conservan acceso a contenido y acciones. La revisión incluye datos habituales, ausencia y textos extensos en ambos idiomas. El 100 % de las vistas, incluida la configuración, conserva el tema oscuro tanto con preferencia clara como oscura del dispositivo.
- **SC-005**: El 100 % de las acciones puede completarse con teclado, todos los estados tienen texto y todas las superficies cumplen los contrastes de FR-008.
- **SC-006**: Las comprobaciones de actualización conservan apertura, posición y foco en todas las condiciones soportadas y confirman pausa durante configuración y degradación documentada cuando se bloquean los mecanismos existentes de conservación del estado.

## Assumptions

- «Interfaz web actual» comprende `/health`, `/es/health`, su acceso inicial existente y los estados de configuración que presentan.
- Los módulos y datos actuales se consideran correctos. `003-redesign-homepage` es antecedente funcional; esta feature sustituye su dirección estética conservando su jerarquía y contratos de consulta.
- «Más técnico, más de desarrollo» se interpreta como consola operativa legible. El tema siempre oscuro grafito con acentos fríos está confirmado por el usuario; FR-014 y SC-001 evalúan su ejecución visual concreta. No requiere comandos, jerga adicional ni nuevas herramientas de administración.
- La limpieza permite eliminar estilos, elementos y textos redundantes sin eliminar campos, avisos, explicaciones necesarias ni acciones.
- Se depende del comportamiento existente de lecturas, tratamientos, recepción, configuración y acceso, sin nuevas fuentes de datos ni servicios externos obligatorios. Los defectos funcionales previos descubiertos se documentarán por separado.
- El documento `docs/estudio-producto-2026-10-07.es.md` mencionado por el IDE no está disponible en este checkout; no se han supuesto conclusiones sobre su contenido. Se han revisado código, especificación previa y capturas del repositorio.
- La implementación, capturas y validación técnica se registran en `validation-results.md`. El responsable valoró carácter técnico y atractivo con 4/5 y confirmó el rediseño integral. Tras confirmar que no dispone de resultados de cinco personas, solicitó «cierra la feature». SC-002 queda sin verificar y exceptuado del cierre de esta feature; no se ha sustituido por mediciones automáticas ni declarado satisfecho.
