# Data Model: Presentación técnica del respaldo

Sin nuevos modelos persistentes. El Durable Object sigue siendo fuente de verdad; `index.ts` construye el modelo autorizado y `health.ts` lo presenta. Se conservan `types.ts` y las reglas de `entries.ts`, `treatments.ts` y `reception.ts`.

## HealthViewModel existente

| Campo | Tipo actual | Uso y restricción |
|---|---|---|
| `latest` | `CgmEntry` o `null` | Referencia seleccionada por servidor |
| `latestDelta` | Número o `null`, opcional | Mostrar solo valor finito; conservar cero y signo |
| `count` | Número | Distingue vacío y ausencia de lectura no futura |
| `latestTreatment` | `Treatment` o `null`, opcional | Último tratamiento |
| `treatmentCount` | Número, opcional | Recuento existente; no exige módulo nuevo |
| `reception` | `HealthReceptionSnapshot` o `null`, opcional | Referencia temporal y diagnóstico |
| `refreshSeconds` | Número, opcional | Mínimo efectivo existente de 5 segundos |
| `baseUrl` | Texto | Construcción de conexión; escapar al presentar |
| `setupSecret` | Texto o `null`, opcional | Revelación autorizada; nunca guardar en registro UI |
| `setupPending` | Booleano, opcional | Otra sesión de configuración; pausa de refresco |

`locale` conserva `en`/`es` como argumento, inglés por defecto. No existe preferencia de tema: siempre oscuro.

## Lectura presentada

`CgmEntry` aporta `_id`, `sgv`, `date`, `dateString`, dirección opcional y campos de compatibilidad existentes. Presentar valor, `mg/dL`, dirección, variación disponible y antigüedad, sin unidades nuevas ni interpretación. Referencias futuras siguen almacenadas y accesibles a clientes, pero excluidas de actualidad por la selección actual. Ausente, antiguo y solo futuro se distinguen explícitamente. Direcciones desconocidas/extensas se escapan y permanecen accesibles íntegramente.

## Tratamiento presentado

`Treatment` conserva `_id`, `eventType`, `created_at`, `mills`, notas opcionales y campos adicionales. `insulin` está dentro de los campos adicionales y se muestra cuando es numérico; no hace falta modificar la interfaz para rediseñarlo. Resumen con insulina cuando exista, tipo, fecha y antigüedad; notas completas después, antes de recepción. Cero no equivale a ausencia. Tipos largos conservan resumen y acceso completo; tipo y notas se escapan.

## Diagnóstico presentado

`HealthReceptionSnapshot` conserva `evaluatedAt`, `count`, `futureCount`, `reference`, `previousReference`, `referenceReceivedAt`, `summary`. `ReceptionSummary` aporta versión, inicio de observación, último envío aceptado con colección/fecha, recuentos y saturación por categoría. `evaluateReception` calcula `empty`, `futureOnly`, `recent` o `stale`, antigüedad, retraso, umbral y rechazos. Sin nuevos umbrales. Lectura y diagnóstico comparten referencia evaluada; disponibilidad es independiente de actualidad y último envío aceptado.

## Configuración y transiciones existentes

1. Sin secreto manual ni estado: servidor inicializa y autoriza revelación con cookie existente.
2. Sesión autorizada con `setupSecret`: configuración primero, refresco pausado y secreto visible hasta confirmación.
3. Otra sesión con `setupPending`: aviso sin secreto y refresco pausado, bajo acceso actual.
4. Confirmación válida: invalidar revelación, borrar cookie y redirigir al idioma correspondiente.
5. Visita posterior: consulta sin secreto. Mantener precedencia y flujo de secreto manual.

Sin cambiar `SetupState`, token, cookie, métodos, códigos ni transiciones. La confirmación no autorizada conserva rechazo y mensaje de configuración pendiente con tema oscuro.

## Estado efímero conservado

Registro `glucoeasy.health.refresh.v1`, fallback `history.state.glucoeasyHealthRefresh`:

| Campo | Restricción |
|---|---|
| `version` | Exactamente 1 |
| `pathname` | `/health` o `/es/health`, coincide con página actual |
| `savedAt` | Finito, no futuro, dentro de ventana actual de validez |
| `receptionOpen` | Booleano |
| `scrollX`, `scrollY` | Finitos y no negativos; restauración acotada |
| `focusedControl` | Nulo o ID de lista permitida |

Se guarda antes del refresco, valida y consume una vez; restaura solo en recarga. Sin datos médicos, HTML, notas, secretos ni URL completas. Si desaparece el control, conservar fallback al resumen de recepción. Con ambos mecanismos bloqueados refresca sin restaurar contexto. No añadir estado de tema.

## Impacto en datos

Ninguno: sin migración, clave nueva, cambio de identidad, retención, ingestión, deduplicación ni consulta. Este documento describe los contratos existentes que el rediseño debe preservar.
