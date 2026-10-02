# GlucoEasy Constitution

## Core Principles

### I. Respaldo de alcance limitado y uso informativo

GlucoEasy DEBE mantenerse como servicio secundario de monitorización y recuperación
de datos de glucosa, sencillo de desplegar y compatible con clientes existentes.
La documentación y las interfaces que presentan lecturas DEBEN indicar que el
proyecto no es un dispositivo médico ni sirve para dosificación o decisiones de
tratamiento. Ninguna funcionalidad DEBE recomendar dosis, ejecutar tratamientos
ni presentar el servicio como sustituto del sistema médico principal.

Toda ampliación DEBE justificar cómo mejora la recepción, conservación reciente,
consulta o diagnóstico operativo de los datos. Convertir el producto en un
Nightscout completo, añadir análisis clínico o cambiar su finalidad requiere una
enmienda explícita de esta constitución antes de su implementación. La finalidad
es ofrecer un respaldo comprensible sin prometer disponibilidad o validez clínica
que el proyecto no puede garantizar.

### II. Compatibilidad verificable con clientes Nightscout

Los cambios DEBEN conservar los contratos soportados de `/api/v1/`: métodos,
variantes de rutas con y sin `.json`, formatos de respuesta, campos, filtros,
identificadores y mecanismos de autenticación utilizados por los clientes.
La compatibilidad DEBE demostrarse con pruebas de contrato o integración para el
comportamiento afectado; no basta con declarar compatibilidad genérica con Nightscout.

La base existente incluye `entries`, `treatments`, perfil actual, estado y
`devicestatus` vacío como respuesta de compatibilidad. Se DEBEN preservar la
aceptación de objetos individuales y lotes donde esté soportada, los campos
adicionales de clientes y el borrado idempotente de tratamientos. El secreto
directo, su representación SHA-1 y Basic Auth son contratos de interoperabilidad;
SHA-1 no DEBE reutilizarse como diseño de seguridad para funciones nuevas.

Una incompatibilidad deliberada DEBE identificar los clientes afectados, aportar
una justificación y documentar una transición o migración antes de publicarse.
Las limitaciones DEBEN describirse en la guía técnica; una respuesta vacía de
compatibilidad no DEBE anunciarse como funcionalidad completa.

### III. Integridad de datos y persistencia acotada

Las entradas DEBEN validarse y normalizarse antes de persistirlas. Las lecturas
DEBEN conservar valores numéricos finitos y marcas temporales interpretables;
los tratamientos DEBEN conservar sus identificadores y fechas normalizadas.
Los campos adicionales necesarios para interoperabilidad DEBEN mantenerse cuando
no contradigan las reglas de validación. Los datos ausentes o inválidos no DEBEN
convertirse en lecturas o tratamientos inventados.

La combinación de registros DEBE ser determinista, deduplicar según el contrato
de cada colección y ordenar de más reciente a más antiguo. Los reintentos no
DEBEN multiplicar registros equivalentes. La retención DEBE estar limitada por
configuración y conservar los registros más recientes; no se promete archivo
histórico completo. Los límites de petición y consulta DEBEN ser explícitos y
verificarse al modificar la ingestión o el almacenamiento.

Las modificaciones de claves, esquemas o identidad del Durable Object DEBEN
evaluar los datos desplegados y definir una migración cuando sea necesaria.
Las páginas de estado DEBEN distinguir ausencia de datos y mostrar la fecha o
antigüedad de la última lectura; el estado operativo del servidor no DEBE
interpretarse como garantía de recepción reciente.

### IV. Credenciales protegidas y exposición explícita de datos

Toda escritura o borrado público de datos DEBE exigir un secreto válido y
rechazarse si la configuración del secreto está incompleta. La inicialización
DEBE mantener la precedencia del secreto manual `API_SECRET` y limitar la
revelación del secreto generado a la sesión de configuración autorizada, hasta
su confirmación. El secreto no DEBE reaparecer en visitas ordinarias posteriores.

Las lecturas públicas DEBEN depender de la opción explícita `READ_PUBLIC`.
Cuando esté deshabilitada, las rutas que exponen lecturas, tratamientos, perfiles
o resúmenes de estado DEBEN exigir autenticación una vez configurado el servicio.
La documentación de instalación DEBE explicar que habilitar esta opción permite
consultar datos de salud a cualquiera que conozca la URL. El despliegue actual
habilita `READ_PUBLIC=true`; esta constitución no lo presenta como acceso privado.

Los secretos, cabeceras de autenticación, URL con credenciales y cuerpos completos
con datos de salud no DEBEN incorporarse al repositorio, registros operativos ni
mensajes de error. La observabilidad DEBE usar metadatos mínimos, como ruta,
resultado y recuentos. Las pruebas DEBEN emplear credenciales y datos sintéticos.
Los cambios en autenticación, configuración o renderizado DEBEN comprobar rechazos,
revelación del secreto y escape del contenido externo que llegue al HTML.

### V. Simplicidad operativa y calidad comprobable

La arquitectura de referencia es TypeScript estricto sobre Cloudflare Workers,
con persistencia en Durable Objects y una página de estado ligera. Las reglas de
normalización, combinación y consulta DEBEN poder probarse separadas del transporte
HTTP; el Worker DEBE coordinar rutas y autenticación, y el Durable Object la
persistencia. Nuevas dependencias, servicios o capas DEBEN justificar una necesidad
concreta y su coste operativo.

El despliegue DEBE seguir siendo viable con una configuración reducida y orientada
a los límites del plan gratuito, sin prometer que las condiciones del proveedor
sean permanentes. Las mejoras DEBEN explicar cualquier aumento de almacenamiento,
peticiones o mantenimiento. No se DEBEN introducir servicios externos obligatorios
sin documentar por qué la plataforma actual resulta insuficiente.

Los cambios funcionales DEBEN aportar pruebas proporcionadas al riesgo y los
defectos corregidos DEBEN incluir una prueba de regresión cuando sean reproducibles
automáticamente. La documentación en español e inglés DEBE describir el mismo
comportamiento de instalación, autenticación y API. La experiencia de configuración
y estado DEBE ser comprensible para una persona sin conocimientos de infraestructura.

## Restricciones técnicas y de producto

- La base implementada usa un Durable Object por instalación para lecturas,
  tratamientos, perfil actual y estado de configuración. No constituye un sistema
  multiusuario; añadir usuarios o pacientes requiere definir aislamiento y acceso
  en la especificación y revisar su impacto constitucional.
- Los valores actuales de referencia son `MAX_ENTRIES=2000` para cada colección
  de lecturas y tratamientos, límite de cuerpo de 256 KiB y refresco de estado de
  30 segundos. Son configuración o contratos técnicos, no constantes inmutables;
  modificarlos exige documentación y comprobaciones de compatibilidad y recursos.
- Las consultas de tratamientos aplican actualmente una ventana predeterminada
  de 24 horas cuando no hay filtro temporal. El perfil conserva solo el registro
  actual. Estas limitaciones DEBEN mantenerse documentadas al evolucionar la API.
- `/health` y `/es/health` DEBEN conservar equivalencia funcional. Los textos de
  estado DEBEN mostrar datos y limitaciones sin atribuirles interpretación clínica.
- El secreto generado de seis caracteres es el comportamiento inicial existente,
  no una garantía de seguridad suficiente para cualquier exposición. Cambiar su
  formato DEBE evaluar configuración, clientes y transición de instalaciones.
- La configuración de Wrangler, sus bindings y migraciones DEBEN permanecer
  coherentes con el almacenamiento. La licencia MIT DEBE conservarse y las nuevas
  dependencias DEBEN tener licencias compatibles con la distribución del proyecto.

## Flujo de desarrollo y controles de calidad

1. Antes de cambiar comportamiento, la especificación DEBE identificar el problema,
   alcance, clientes afectados y criterios de aceptación. El plan DEBE comprobar
   los cinco principios y registrar cualquier excepción con motivo y alcance.
2. El trabajo DEBE partir de la funcionalidad existente. Una refactorización no
   DEBE alterar contratos o borrar datos de forma incidental; las brechas existentes
   DEBEN registrarse como tareas concretas, sin afirmar cumplimiento no verificado.
3. Para cambios funcionales, la revisión DEBE exigir `npm run test` y comprobación
   de tipos mediante `tsc --noEmit` usando las herramientas del proyecto. Las pruebas
   DEBEN cubrir las reglas afectadas y, si cambian rutas, autenticación o persistencia,
   la interacción Worker–Durable Object en el entorno de pruebas de Workers.
4. Los cambios en configuración de despliegue, bindings o migraciones DEBEN incluir
   `npm run cf:deploy:dry`. Los cambios visibles de configuración o estado DEBEN
   comprobarse en español e inglés. Un cambio exclusivamente documental requiere
   revisión de coherencia y enlaces; no exige ejecutar pruebas de aplicación.
5. Antes de integrar, la revisión DEBE registrar resultados, limitaciones conocidas,
   impacto en datos y compatibilidad, y cambios de documentación necesarios.
   Las comprobaciones fallidas DEBEN resolverse o quedar como excepción explícita
   aceptada por el responsable del proyecto, con tarea de seguimiento.

## Governance

Esta constitución prevalece sobre especificaciones, planes y prácticas internas
que la contradigan. El responsable del proyecto DEBE revisar el cumplimiento en
cada cambio; las excepciones temporales DEBEN indicar principio afectado, motivo,
riesgo, alcance y condición de cierre. Una excepción no modifica por sí misma
la constitución ni autoriza cambiar la finalidad del producto.

Las enmiendas DEBEN proponer el texto concreto, justificar el cambio y evaluar
el impacto en funcionalidad implementada, clientes, datos y documentación. El
responsable del proyecto DEBE aceptar la enmienda antes de integrar cambios que
dependan de ella. Las especificaciones y planes posteriores DEBEN usar la versión
vigente; los artefactos anteriores afectados DEBEN revisarse al retomar su trabajo.

La versión constitucional sigue SemVer, independientemente de la versión de la
aplicación: MAJOR para eliminar o redefinir principios de forma incompatible;
MINOR para añadir principios o ampliar obligaciones; PATCH para aclaraciones
sin cambio de obligaciones. Toda enmienda DEBE actualizar la fecha de modificación
y mantener la fecha original de adopción. La versión 1.0.0 establece la primera
constitución del proyecto existente y no certifica retrospectivamente que todas
sus obligaciones estén cubiertas por el código actual.

**Version**: 1.0.0 | **Ratified**: 2026-10-02 | **Last Amended**: 2026-10-02
