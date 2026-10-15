# Research: Rediseño integral con identidad técnica

Fecha: 2026-10-15. Investigación basada en el repositorio, la aclaración del usuario y la revisión delegada de validación solicitada por `speckit-plan`. No se necesitan servicios ni bibliotecas nuevas. Las decisiones siguientes resuelven las incógnitas técnicas de planificación; no acreditan resultados de implementación.

## 1. Arquitectura de presentación

- **Decision**: Mantener `renderHealthPage(view, locale)` y HTML/CSS/script incorporados en `src/health.ts`. Usar funciones locales para separar bloques si facilitan su lectura. Conservar `HealthViewModel`, rutas, selección de datos y evaluación de recepción.
- **Rationale**: `src/index.ts` ya autoriza y construye el modelo antes de renderizar. La renovación visual cabe en la capa existente y no necesita cliente de datos, proceso de compilación adicional ni peticiones de recursos.
- **Alternatives considered**: Aplicación de página única, biblioteca de componentes y CSS remoto: aumentan dependencias y superficie de cambio sin resolver una necesidad funcional. Hoja externa: exige una ruta o activos nuevos y no aporta ventaja necesaria en esta página única.

## 2. Identidad y composición

- **Decision**: Tema oscuro fijo con `color-scheme: dark`, paleta por funciones, tipografía de sistema para prosa y pila local monoespaciada para cifras, unidades y metadatos. Cabecera breve, secciones verticales de geometría contenida, divisores y campos alineados. La retícula organiza los campos internos, sin adelantar recepción al tratamiento en escritorio.
- **Rationale**: La respuesta A confirma oscuridad permanente. El rediseño debe cambiar la composición y el tratamiento de la información, además de colores. El orden vertical facilita conservar la jerarquía visual y asistida existente.
- **Alternatives considered**: Adaptación automática al dispositivo o selector: descartados por aclaración explícita. Tarjetas actuales con otra paleta: insuficiente para FR-001. Consola ficticia con comandos, logs o indicadores inventados: añade contenido ajeno al respaldo.

## 3. Compactación y textos extensos

- **Decision**: Mantener lectura y actualidad primero; resumen del tratamiento antes de notas, con todos los campos actuales. Partir de un presupuesto móvil de cabecera ≤56 px, lectura con aviso ≤240 px y resumen de tratamiento ≤180 px; estos son objetivos de ajuste, no límites que recorten contenido. Medir el borde inferior del resumen en el viewport real de 360 × 800.
- **Rationale**: El contrato exige información esencial inicialmente visible en ambos idiomas. Las fuentes monoespaciadas y las etiquetas largas pueden aumentar saltos de línea y deben medirse en navegador. A 200 % prima acceso completo al contenido.
- **Alternatives considered**: Ocultar fecha/actualidad, reducir texto hasta hacerlo ilegible o fijar alturas con recorte: contradicen FR-005, FR-007 y FR-008. Reordenación por columnas: puede desalinear orden visual y asistido.

## 4. Interacciones y continuidad

- **Decision**: Conservar `details`/`summary`, IDs de bloques y controles, script de localización de fechas y script de refresco existentes. No ampliar el registro `glucoeasy.health.refresh.v1`. Mantener pausa por `setupSecret` o `setupPending`, fallback de historial y degradación si ambos mecanismos están bloqueados.
- **Rationale**: `test/health.test.ts` ya prueba recarga, consumo del registro, foco, scroll acotado, registros inválidos y mecanismos bloqueados. Cambiar los IDs durante la limpieza rompería una dependencia real del comportamiento.
- **Alternatives considered**: Acordeón propio y refresco parcial nuevo: esfuerzo y riesgo innecesarios. Guardar el modelo completo en navegador: inadmisible para el contrato de privacidad.

## 5. Pruebas y evidencia

- **Decision**: Reutilizar Vitest y el pool Workers. Ajustar aserciones de marcado solo cuando cambie estructura legítima; mantener pruebas de comportamiento, campos, escape, acceso, configuración y continuidad. Complementar con revisión de navegador para composición, contraste, foco, ampliación y preferencia clara/oscura del dispositivo.
- **Rationale**: Las cadenas HTML y el arnés de script no miden geometría ni estilos calculados. No hay dependencia directa de automatización de navegador en `package.json`; la implementación puede usar un navegador disponible y registrar pasos reproducibles, sin incorporar una suite nueva solo para este cambio.
- **Alternatives considered**: Acreditar accesibilidad mediante presencia de reglas CSS o copiar resultados de 003: insuficiente. Añadir snapshots de toda la página: frágil y poco informativo para los riesgos relevantes.

## 6. Validación humana y documentación

- **Decision**: Crear primero vistas representativas del renderizador real con datos sintéticos en móvil/escritorio; registrar puntuaciones reales del responsable para SC-001 antes de extender la propuesta a todos los estados. Conservar SC-002 como evaluación de cinco participantes, sin sustituirla por pruebas técnicas. Preparar capturas nuevas en `docs/images/004-technical-ui-redesign/` y actualizar los enlaces afectados de ambas guías.
- **Rationale**: La insatisfacción visual motiva la feature; confirmar solo el tema no confirma la ejecución estética. La evaluación anterior pendiente no demuestra aceptación del nuevo diseño.
- **Alternatives considered**: Afirmar aprobación por la respuesta A o inventar participantes/puntuaciones: no prueba los criterios. Sustituir las capturas históricas: elimina la referencia útil para comparación.

## 7. Compatibilidad, datos y recursos

- **Decision**: Ninguna migración ni nueva colección, clave, binding, servicio, dependencia o petición de datos. Conservar cadencia de refresco y límites existentes; ningún cambio en `READ_PUBLIC`. Usar fuentes locales y decoración CSS sin activos remotos.
- **Rationale**: La feature afecta presentación. `wrangler.jsonc` configura un Durable Object, retención 2000, lecturas públicas y refresco de 30 segundos; no hay necesidad de modificarlos.
- **Alternatives considered**: Telemetría de diseño, fuentes alojadas o servicios de analítica: innecesarios para una revisión local con datos sintéticos.

## Evidencia y límites

- Fuentes locales: `src/health.ts`, `src/index.ts`, `src/types.ts`, `src/reception.ts`, `test/health.test.ts`, `test/api.test.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `wrangler.jsonc`, las dos guías README y `specs/003-redesign-homepage/quickstart.md`.
- El lockfile fija TypeScript 6.0.3, Vitest 4.1.8 y Wrangler 4.99.0; no se propone actualizarlo. Versiones observadas en el archivo, no recomendaciones de versiones actuales.
- `node` y `npm` no están disponibles en el PATH de la sesión de planificación. No bloquea estos documentos; la implementación debe localizar o preparar el entorno antes de ejecutar comprobaciones. No se ejecutaron pruebas de aplicación en esta fase documental.
- El estudio de producto mencionado en el IDE no está presente en el checkout. No se han inferido requisitos adicionales a partir de él.
- Sin incógnitas técnicas bloqueantes. La aceptación visual y la evaluación de participantes son evidencia futura pendiente, no aclaraciones de arquitectura.
