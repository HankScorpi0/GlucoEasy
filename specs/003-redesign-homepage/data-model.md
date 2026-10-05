# Data Model: Presentación

Sin nuevas entidades persistentes, claves de Durable Object ni migraciones. Reutilizar `HealthViewModel` en `src/types.ts`.

## Lectura

Fuente: `latest`, `latestDelta`, `count`, `reception.evaluatedAt`. Mostrar sgv en mg/dL, dirección, variación disponible y fecha/antigüedad. Reutilizar evaluación reciente/antigua/vacía/futuro; nunca inventar valores ni considerar servidor disponible equivalente a recepción reciente. Escapar dirección desconocida.

## Tratamiento

Fuente: `latestTreatment`, `treatmentCount`. Resumen: tipo `eventType` o etiqueta existente, fecha `mills`/`created_at` normalizada, antigüedad e insulina si existe según contrato actual. Cero válido sigue siendo cero; falta no se convierte en cero. Notas completas después, antes de recepción. Tipo y notas escapados. Textos extensos conservan acceso al valor completo. Ausencia muestra segundo bloque compacto explícito.

## Recepción

Fuente: snapshot y evaluación existentes. Resumen visible: disponibilidad, actualidad, rechazos relevantes y total saturado, fechas futuras y diagnóstico ausente. Detalle: último envío/colección/fecha, umbral, fecha/antigüedad de lectura, primera recepción, retraso, categorías, inicio y alcance de observación. Null significa desconocido; saturación conserva «al menos».

## Configuración

Fuente: `setupSecret`, `setupPending`, `baseUrl`. Conservar estados de sesión autorizada, otra sesión y confirmación. Prioridad cuando hay acción pendiente; pausa de recarga. No capturar ni restaurar estado UI en configuración; limpiar restos sin registrar credenciales.

## Continuidad por pestaña

Clave propuesta: `glucoeasy.health.refresh.v1`; fallback en propiedad `glucoeasyHealthRefresh` de `history.state`, preservando propiedades ajenas y sin cambiar URL.

| Campo | Validación | Uso |
|---|---|---|
| version | literal 1 | Versionar formato |
| pathname | /health o /es/health | Coincidir con ruta actual; sin query ni URL completa |
| savedAt | número finito, no futuro | Caducidad: dos intervalos de refresco más 60 segundos |
| receptionOpen | booleano | Estado de details |
| scrollX, scrollY | finitos no negativos | Acotar al documento nuevo |
| focusedControl | ID permitido o null | Restaurar solo control existente y visible |

IDs permitidos iniciales: `reception-summary`, `status-link`, `repository-link`; añadir solo IDs constantes para controles de texto completo si se introducen. Nunca IDs derivados de datos, valores de formularios, HTML, notas, lecturas, secretos ni cookies.

Transiciones:

1. Visita inicial sin registro: cerrado, sin restauración de foco/scroll.
2. Interacción: apertura local, sin preferencia persistente.
3. Antes del refresco automático: escribir registro validado; si falla almacenamiento, intentar historial.
4. Documento nuevo: leer y consumir ambas fuentes; borrar registro antes de restaurar. Validar tiempo, ruta y campos; apertura tras localizar fechas, luego foco sin scroll inducido y posición.
5. Registro corrupto/obsoleto, otro idioma o elemento desaparecido: ignorar de forma segura; fallback a summary si había foco permitido y sigue disponible. No robar foco en visita inicial.
6. APIs bloqueadas: continuar sin excepción y documentar limitación si ambas fallan; datos y desplegable siguen utilizables.

Identidad, relaciones, deduplicación y conservación del dominio intactas.
