# Contrato interno Worker–Durable Object

El Worker obtiene `ENTRIES_DO.idFromName("global")` y llama a `stub.fetch` con URLs `https://entries.internal/...`. El hostname es una convención interna, no un servicio externo ni ruta pública. Autenticación y normalización se aplican en Worker; el DO espera datos preparados.

| Método y ruta | Entrada | Salida JSON |
| --- | --- | --- |
| GET `/setup` | Sin cuerpo | SetupState o null |
| POST `/setup/bootstrap` | Sin cuerpo | Estado existente o generado |
| POST `/setup/acknowledge` | `{revealToken?:string}` | `{acknowledged:boolean}` |
| GET `/entries` | Query EntryQuery serializado y codificado en parámetro `query` | CgmEntry[] |
| POST `/entries` | CgmEntry[] | `{stored,total}` |
| GET `/treatments` | Query TreatmentQuery serializado y codificado en parámetro `query` | Treatment[] |
| POST `/treatments` | Treatment[] | `{stored,total}` |
| DELETE `/treatments/:id` | Identidad codificada | `{status:"ok",deleted,_id}` |
| GET `/profile/current` | Sin cuerpo | Perfil o objeto vacío |
| GET `/profile` | Sin cuerpo | Colección de cero o un perfil |
| POST/PUT `/profile` | Documento | Documento recibido |
| GET `/snapshot` | Sin cuerpo | `{count,last,previous}` |
| GET `/treatments/snapshot` | Sin cuerpo | `{count,last}` |

`stored` es cantidad recibida y `total` cantidad conservada. Respuestas atendidas usan `Response.json`; rutas no atendidas devuelven texto `Not found` con 404. No existe validación interna completa o contrato uniforme de error. Worker deserializa según tipos esperados sin verificar exhaustivamente el status interno. No se presume exposición pública ni transacción conjunta de varias llamadas.
