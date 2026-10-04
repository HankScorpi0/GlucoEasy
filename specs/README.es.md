# Flujo de especificaciones

La [base del servicio existente](001-baseline-backup-service/spec.md) documenta mediante ingeniería inversa el comportamiento implementado. Sus [contratos](001-baseline-backup-service/contracts.md) y [evidencias y brechas](001-baseline-backup-service/evidence.md) distinguen lo observado de la cobertura no verificada y las correcciones futuras. La base queda pendiente de revisión del responsable; no aprueba excepciones a la constitución.

Para cada cambio futuro:

1. Usar `$speckit-specify` para crear una feature que describa problema, alcance y criterios de aceptación antes de modificar código. Referenciar requisitos y contratos afectados de la base.
2. Usar `$speckit-clarify` si quedan ambigüedades relevantes.
3. Usar `$speckit-plan` para diseñar el cambio y comprobar constitución, compatibilidad e impacto en datos.
4. Usar `$speckit-tasks` y después `$speckit-analyze` para preparar y revisar el trabajo de implementación.
5. Usar `$speckit-implement` y ejecutar las comprobaciones exigidas para el cambio.
6. Revisar resultados y actualizar los contratos afectados de la base cuando cambie el comportamiento. Usar `$speckit-converge` para comparar código con spec, plan y tareas de una feature.

El [plan retrospectivo](001-baseline-backup-service/plan.md) completa la base con stack, arquitectura, modelo de datos y guía de validación existentes. No reconstruye el servicio ni marca tareas históricas como completadas. Las correcciones pendientes requieren alcance y aceptación propios antes de generar tareas. `.specify/feature.json` señala la feature activa local; las nuevas especificaciones lo actualizan automáticamente. Las especificaciones usan el directorio predeterminado `specs/`, independientemente del nombre de la rama.

English version: [README.md](README.md).
