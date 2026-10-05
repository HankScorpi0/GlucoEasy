# Research: Diagnóstico de recepción

**Date**: 2026-10-04

## Persistencia y atomicidad

**Decision**: Mantener DO SQLite y añadir dos claves KV. Usar ctx.storage.transaction para datos, recepción y último envío, y otra transacción por rechazo. Esperar commit antes de responder. Callbacks limitados a almacenamiento y transformación local.

**Rationale**: Una operación compuesta debe confirmar o revertir conjuntamente. Cloudflare documenta KV asíncrono sobre SQLite y transacciones atómicas; aunque existen garantías implícitas, la transacción explícita facilita revisar el límite datos+diagnóstico. [Documentación oficial](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/#transaction).

**Alternatives considered**: waitUntil introduce retraso y posibles huecos. Nuevas tablas SQL o servicios externos añaden estructura innecesaria. transactionSync no encaja con KV asíncrono existente.

## Identidad, reintentos y legado

**Decision**: Mapa de date a firstAcceptedAt|null limitado a lecturas retenidas. Consultar _id y fecha en datos ordinarios solo en memoria para reproducir mergeEntries; no persistir IDs diagnósticos.

**Rationale**: mergeEntries prioriza incoming y deduplica por _id o date. Un mapa solo por fecha sin considerar _id pierde recepción si se modifica fecha. Trasladar procedencia al ganador evita rejuvenecer duplicados. Legado desconocido permanece null incluso al reenvío.

**Alternatives considered**: Añadir campo a CgmEntry cambia salida pública. Copiar _id o hashes conserva correlación innecesaria. Guardar solo recepción de última lectura falla con lotes atrasados y futuras.

## Consulta y fechas futuras

**Decision**: Snapshot privado para health, sin cambiar /snapshot ni StatusPayload. Seleccionar máximo date <= evaluatedAt y contar todas las date > evaluatedAt retenidas. Umbral max(300000, 2 * refreshMs).

**Rationale**: Cumple opción A. getServiceState actual acepta edad negativa como reciente y formatElapsed la convierte en cero. Instante único evita incoherencias en límites temporales.

**Alternatives considered**: Rechazar o corregir futuras rompe recepción. Modificar status.json contradice aclaración. Examinar solo entries[0] oculta referencias válidas.

## Categorización y privacidad

**Decision**: Enums authentication, payloadTooLarge, invalidPayload e internalFailure. Separar causa por fase y registrar una vez, conservando códigos actuales. Reducir logs afectados a lista permitida y errores propios seguros.

**Rationale**: index.ts devuelve 400 para causas distintas, incluido almacenamiento; los códigos no bastan. getWriteDebugContext copia cabeceras y User-Agent, el perfil registra defaultProfile y JSON.parse puede devolver fragmentos del cuerpo en su mensaje. Esta brecha afecta directamente FR-009.

**Alternatives considered**: Historial de Request o errores textuales viola minimización. Cambiar exceso de tamaño a 413 cambia contrato. Deduplicar rechazos por emisor requiere identidad prohibida; cada petición observable cuenta una vez.

## Inicialización, límites y recuperación

**Decision**: Inicio de observación en primera health autorizada o primer intento de envío instrumentado. Resumen fijo; recepciones podadas. Contadores hasta MAX_SAFE_INTEGER con saturación visible como “al menos”. No reintentar llamadas de rechazo externamente.

**Rationale**: No reconstruye historia ni atribuye cero a fallos anteriores. Saturación fija espacio y evita pérdida silenciosa de precisión. Un reintento de incremento tras respuesta perdida puede duplicar evento. Fallo al guardar rechazo conserva respuesta original y se explica como limitación general.

**Alternatives considered**: Contadores decimales ilimitados crecen sin cota; ventanas móviles y reinicio manual cambian semántica. Omitir rechazos de autorización abarata pero incumple alcance. Rollback de código debe tratar intervalo sin instrumentación como discontinuidad al reactivar.

## Status

Investigación local y agente de investigación completados; sin decisiones técnicas pendientes. Versiones del lockfile; no nuevas dependencias. No cambios previstos en bindings ni migraciones.
