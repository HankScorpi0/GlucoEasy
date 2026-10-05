# Data Model: Diagnóstico de recepción

## ReceptionSummary — clave reception-summary

| Campo | Tipo | Regla |
|---|---|---|
| version | 1 | Versión interna |
| observedSince | number | Época en milisegundos; inicio de observación, no antigüedad de instalación |
| lastAccepted | null o { at: number, collection: Collection } | Actualización conjunta con escritura exitosa |
| rejected | cuatro números | authentication, payloadTooLarge, invalidPayload, internalFailure |
| saturated | cuatro booleanos | Categorías que alcanzaron límite numérico |

Collection = entries | treatments | profile. Enums cerrados; sin texto del cliente. Fechas finitas e interpretables. Contadores enteros no negativos, saturados en Number.MAX_SAFE_INTEGER. Total derivado mediante suma segura, no persistido; mostrar “al menos” si alguna categoría saturó o suma supera límite.

Inicializar en primera consulta health autorizada o intento de envío observado, con cero y lastAccepted null. Inicialización y primer rechazo se realizan juntos cuando corresponda. observedSince permanece en reinicios y consultas.

## EntryReceipts — clave entry-receipts

Mapa serializable de fecha normalizada, como string numérico, a number|null de primera aceptación conocida. Solo fechas: sin _id, sgv, device, notas o contenido. Dominio igual a fechas retenidas; máximo MAX_ENTRIES elementos efectivos. Ausencia de entrada de lectura preexistente equivale a null.

### Procedencia y deduplicación

1. Crear mapas temporales por _id y fecha a partir de existing y sus recepciones. Identificadores permanecen solo en memoria y datos ordinarios.
2. Para cada incoming, buscar coincidencias existentes por _id o date. Si alguna recepción coincidente es desconocida, conservar null; si todas son conocidas, tomar la menor. Sin coincidencia asignar instante actual de aceptación.
3. Reproducir ganadores con orden incoming seguido de existing y conjuntos de IDs/fechas de mergeEntries, sin modificar su selección. Conservar recepción asociada al ganador.
4. Aplicar orden y retención de mergeEntries; guardar recepción por fecha resultante. Si mismo _id cambia fecha, trasladar su recepción anterior. Podar fechas ausentes.
5. Duplicados del mismo lote nuevo comparten instante. Legado sigue null tras reintento. Si un registro salió de retención y se reintroduce, inicia nueva recepción conocida: no hay historia fuera de la ventana conservada.

Retraso = firstAcceptedAt - date; negativo se marca como anomalía, no se trunca a cero. Transformaciones diagnósticas no alteran registros ordinarios ni salida Nightscout.

## HealthReceptionSnapshot — derivado

evaluatedAt, count, futureCount, reference y previousReference no futuras, referenceReceivedAt|null y ReceptionSummary. Referencias son datos ordinarios para HTML, no copias persistidas en diagnóstico. Leer entries y metadatos en vista coherente; inicializar resumen transaccionalmente si falta. /snapshot público interno existente conserva entries[0] y entries[1].

## ReceptionEvaluation — vista

Disponibilidad observada al responder, edad/colección de último envío, readingState (empty|futureOnly|recent|stale), fecha y antigüedad de referencia, recepción/retraso conocido, thresholdMs, futureCount, total/categorías de rechazo, observedSince y señales de cota inferior.

Usar evaluatedAt en todos los cálculos. date > evaluatedAt es futura; igualdad es válida. thresholdMs = max(300000, 2 * refreshMs); edad <= umbral es reciente. Retroceso de reloj que deje lastAcceptedAt futuro genera aviso de desfase, sin edad cero inventada.

## State Transitions

| Operación | Resultado |
|---|---|
| Lecturas aceptadas | merge + recepciones podadas + lastAccepted, una transacción |
| Tratamiento/perfil aceptado | datos + lastAccepted, una transacción |
| Vacío/duplicado exitoso | actualiza lastAccepted, conserva procedencia |
| Rechazo observado | incrementa una categoría; lastAccepted intacto |
| Health | inicializa si falta y deriva; no cuenta peticiones |
| Consultas API/borrado/setup | no altera resumen |
| Reinicio | recupera metadatos |
| Fallo de commit | revierte datos y aceptación; intento separado de rechazo interno |

lastAccepted conserva máximo instante; en empate mantener colección previa. Callbacks transaccionales sin logs ni red. No usar allowUnconfirmed ni escribir diagnóstico en segundo plano.

## Migración y protección

Mantener claves entries, treatments, profile, setup, clase, binding y global. Inicialización aditiva sin fechas históricas inventadas. No modificar StatusPayload ni objetos Nightscout. Metadatos ilegibles no se reinician silenciosamente: informar indisponibilidad y preservar datos ordinarios. Fallo de instrumentación no genera otro rechazo.
