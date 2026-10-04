# Phase 1: Modelo de datos existente

Fuentes: `src/types.ts`, normalizadores y `src/durable-object.ts`. Tipos TypeScript no implican validación en runtime; reglas exactas en [contracts.md](contracts.md).

## Ámbito y persistencia

Un DO por instalación, sin relaciones entre pacientes, cuentas o claves foráneas. Lecturas y tratamientos son arrays descendentes; perfil y setup son documentos únicos.

| Clave | Tipo esperado | Ausencia | Conservación |
| --- | --- | --- | --- |
| `entries` | `CgmEntry[]` | `[]` | N registros; 2000 por defecto |
| `treatments` | `Treatment[]` | `[]` | N registros; 2000 por defecto |
| `profile` | `NightscoutProfileRecord` | Sin documento | Último documento |
| `setup` | `SetupState` | Sin configuración automática | Secreto persistente y token hasta confirmar |

Se trunca al combinar durante escritura. No hay TTL ni purga periódica: la ventana de 24 horas de tratamientos es filtro de consulta. No se almacena devicestatus.

## Lectura — CgmEntry

| Campo | Tipo normalizado | Regla |
| --- | --- | --- |
| `_id` | string | Recibido no vacío o instante como texto |
| `sgv` | number finito | Conversión numérica actual; coerciones problemáticas en GAP-002 |
| `date` | number | Instante interpretable de `date` o `dateString` |
| `dateString` | ISO string | Fecha textual válida o derivada del instante |
| `type` | string | Recibido o `sgv` |
| `device` | string | Recibido o `xDrip` |
| Dirección y atributos adicionales | unknown según contrato | Preservados sin validación completa de tipos |

Deduplicación por `_id` o `date`: entrantes antes que existentes, primer objeto equivalente prevalece completo. No hay mezcla de campos. El lote completo se normaliza antes de guardar; un error impide guardarlo. Fechas fuera del rango representable por ISO pueden fallar durante conversión. Los dos campos temporales pueden discrepar según el contrato existente.

## Tratamiento — Treatment

| Campo | Tipo esperado/normalizado | Regla |
| --- | --- | --- |
| `_id` | string | Primera identidad disponible o identidad sintética |
| `identifier`, `uuid`, `syncIdentifier` | Opcionales | Aliases usados si son strings |
| `created_at` | ISO string | Fuente temporal según precedencia del contrato |
| `mills` | number | Derivado de `created_at` |
| `eventType` | string | Recibido o vacío |
| `enteredBy`, `notes` | string opcional | Textos no vacíos; omitidos en otro caso |
| `srvCreated`, `srvModified` | ISO string | Fecha textual válida o instante de recepción |
| `insulin`, `carbs` y adicionales | unknown | Preservados sin validación clínica |

Identidad sintética: `mills:eventType:enteredBy:notes`. Se deduplica por cualquier identidad o `created_at:eventType`, sin representar unicidad clínica. Entrantes primero; se puede borrar por cuatro identidades admitidas. Borrado ausente no modifica datos.

## Perfil — NightscoutProfileRecord

Campos opcionales `_id`, `defaultProfile`, `enteredBy`, `startDate`, `created_at`, `store` como mapa de perfiles y atributos adicionales. POST/PUT reemplazan el documento entero. Solo se parsea JSON: forma y contenido no se verifican en runtime, diferencia registrada en GAP-007. No hay historial ni interpretación clínica.

## Configuración — SetupState

`apiSecret: string`, `revealToken: string | null`. Secreto manual prevalece sin reemplazar ni migrar el persistido.

| Estado | Evento | Transición |
| --- | --- | --- |
| Sin secreto manual ni setup | Primera visita a estado | Genera secreto de seis caracteres y token aleatorio; persiste y crea cookie |
| Setup pendiente | Visita con token coincidente | Revela secreto sin regenerarlo |
| Setup pendiente | Visita ajena | No revela; aplica acceso y estado pendiente |
| Setup pendiente | Confirmación autorizada | Conserva secreto, anula token, borra cookie y redirige |
| Setup confirmado | Visita ordinaria | No revela secreto |
| Secreto manual presente | Consulta/autenticación | Usa secreto manual y evita bootstrap |

No hay rotación, recuperación desde interfaz o cuentas de clientes.

## Datos derivados y consultas

- `EntriesSnapshot`: recuento, última y penúltima lectura.
- `TreatmentsSnapshot`: recuento y último evento con insulina numérica o texto no vacío.
- `StatusPayload`: identificación, hora del servidor e instantánea de lecturas.
- `HealthViewModel`: presentación, delta, recuentos, refresco, URL base y estado de revelación.
- `EntryQuery`, `TreatmentQuery`, `QueryFilter`: objetos de consulta enviados al DO, sin persistencia propia.

## Migración

No se cambian claves, formato, clase, binding, identidad ni migración `v1`; no se requiere nueva migración. Una evolución futura debe definir tratamiento de datos desplegados y compatibilidad antes de implementarse. No se atribuyen garantías transaccionales entre llamadas no verificadas.
