# Quickstart: validar diagnóstico de recepción

Guía de validación local; los resultados ejecutados figuran al final.

## Preparación

Desde raíz con Node/npm compatibles disponibles en PATH:

```powershell
npm ci
npm run test
npx tsc --noEmit
npm run dev
```

Tests usan READ_PUBLIC=false y reset entre casos. Para validación manual crear .dev.vars local ignorado con secreto sintético API_SECRET y READ_PUBLIC=false. No usar datos reales ni guardar secretos en capturas/commits. En la sesión de planificación node no está en PATH; preparar entorno antes de checks.

## Recorrido manual

Con Wrangler en localhost:8787 y API_SECRET=local-test-only solo en entorno local:

```powershell
$diagnosticHeaders = @{ 'api-secret' = 'local-test-only'; 'Content-Type' = 'application/json' }
$diagnosticBody = @{ sgv = 123; date = [DateTimeOffset]::UtcNow.AddHours(-2).ToUnixTimeMilliseconds() } | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:8787/api/v1/entries.json -Method Post -Headers $diagnosticHeaders -Body $diagnosticBody
Invoke-WebRequest -Uri http://localhost:8787/es/health -Headers $diagnosticHeaders
Invoke-WebRequest -Uri http://localhost:8787/health -Headers $diagnosticHeaders
```

Esperado: servidor disponible, envío recién aceptado, lectura antigua y retraso cercano a dos horas. Repetir con fecha actual y luego diez minutos futura: referencia sigue no futura y advertencia visible. Reenviar lectura actual después: aceptación del envío cambia, primera recepción no. Enviar tratamiento y perfil: cambia colección de último envío sin cambiar referencia temporal de lectura.

Consultar status.json y colecciones: mismos campos y selección de antes. Health sin autorización rechaza y no revela diagnóstico. En entorno separado probar READ_PUBLIC=true y verificar acceso público documentado. No desplegar para estas pruebas.

## Matriz automatizada

| Grupo | Casos y esperado |
|---|---|
| Tiempo | Ahora, umbral exacto y +1 ms; clasificación correcta |
| Futuras | Solo futura, futura+antigua, futura+reciente; ninguna edad cero inventada |
| Aceptación | Antiguas recién enviadas, tratamiento, perfil POST/PUT, vacíos y duplicados |
| Procedencia | Mismo ID/nueva fecha, misma fecha/otro ID, colisiones y desorden; recepción previa o null |
| Legado | Sembrar datos sin claves nuevas; no inventar recepción al consultar ni reenviar |
| Retención | Superar MAX_ENTRIES; recepciones limitadas a fechas retenidas |
| Rechazos | Autenticación/configuración, >256 KiB, JSON, validación, almacenamiento |
| Lotes | Un inválido rechaza lote existente; solo un incremento por petición |
| Concurrencia | 20 rechazos simultáneos suman exactamente 20; aceptación conserva máximo instante |
| Persistencia | Recrear instancia sobre mismo almacenamiento con helper soportado o prueba dirigida; reset borra datos y no demuestra reinicio |
| Atomicidad | Fallo de escritura revierte datos/aceptación; fallo de rechazo no cambia respuesta original |
| Privacidad | Marcadores sintéticos en cuerpo/cabeceras/ID/perfil ausentes en claves diagnósticas, logs y errores |
| Permisos/setup | Público/privado, cookie de revelación, confirmación y secreto no reaparece |
| UI | EN/ES, escape, delta no futuro, desconocido e indisponibilidad |
| Límites | Saturación artificial próxima a MAX_SAFE_INTEGER con cota inferior visible |
| Contratos | Aliases, códigos incluido 400 de tamaño, secreto directo/SHA-1/Basic y StatusPayload intacto |

Helpers puros y SELF.fetch para comportamiento completo; inspeccionar solo metadatos desde test. Inyectar fallos con almacenamiento sintético controlado o mocks de frontera, sin rutas públicas de depuración.

## Cierre

Ejecutar npm run test y npx tsc --noEmit. Si cambia configuración/bindings/migración, exigir npm run cf:deploy:dry; también recomendado para bundling final sin publicar. Revisar README.md y README.es.md, screenshots sintéticas EN/ES escritorio/móvil en docs/images, sin secretos. Registrar resultados, compatibilidad, datos, coste y límites observacionales. Referencias: [contrato health](contracts/health-diagnostics.md), [contrato interno](contracts/internal-reception.md) y [modelo](data-model.md).

## Recovery after rollback

Procedimiento de mantenimiento para una reactivación posterior a un intervalo sin instrumentación. No se ejecuta automáticamente, no es un control de usuario ni una ruta pública. El operador debe preparar y revisar una versión temporal de mantenimiento, desplegarla sobre la misma clase/binding/identidad global y verificar antes de restaurar la versión normal.

1. Mantener lecturas, tratamientos, perfil y setup. En una copia revisada del constructor de EntriesDurableObject, añadir el siguiente bloque usando un identificador de época único para esa operación. La marca tiene tamaño constante y se sobrescribe en futuras operaciones; no guarda historial.

```typescript
ctx.blockConcurrencyWhile(() => ctx.storage.transaction(async (txn) => {
  const epoch = "reception-maintenance-2026-10-05";
  if (await txn.get("reception-maintenance-epoch") !== epoch) {
    await txn.delete(["reception-summary", "entry-receipts"]);
    await txn.put("reception-maintenance-epoch", epoch);
  }
}));
```

2. Ese bloque elimina solo las dos claves diagnósticas y marca la operación atómicamente, antes de aceptar peticiones. La misma época no vuelve a eliminar metadatos al recrear la instancia. No cambiar wrangler.jsonc ni idFromName("global").
3. Consultar health con los permisos existentes: debe comenzar nueva observación, contadores cero si no hubo rechazos nuevos y aceptación no registrada hasta nuevo envío. Lecturas previas conservan valores/fechas, pero su primera recepción se muestra desconocida, incluso tras reintento.
4. Comparar consultas ordinarias de lecturas, tratamientos, perfil y setup antes/después. Retirar el bloque temporal y volver a la versión normal; conservar la marca de mantenimiento para evitar repetir accidentalmente la misma operación. No presentar como acumulados los eventos durante la versión sin instrumentación.

La prueba de integración de recuperación ejecuta esta misma transacción en almacenamiento sintético, comprueba conservación e idempotencia. No se ha desplegado ni ejecutado este procedimiento sobre datos reales.

## Evidencia de implementación y validación

Validación local completada el 5 de octubre de 2026:

- Entorno: Node v24.16.0 y npm 11.13.0; npm ci completado sin cambiar package.json ni package-lock.json.
- Línea base: 36 pruebas aprobadas. TypeScript detectó problemas previos de importación de Env, tipado de colección vacía, branding de DurableObjectStub y tipos del entorno de pruebas; corregidos conservando clase, binding e identidad del almacenamiento.
- Regresión antes de implementación: seis pruebas de helpers fallaron por funcionalidad ausente; cinco pruebas de renderizado fallaron antes de integrar el panel. Después se incorporaron las regresiones de integración, anomalías temporales y privacidad descritas en la matriz.
- Resultado final: npm run test aprobó 66 pruebas en seis archivos; npx tsc --noEmit terminó sin errores. La suite cubre reinicio real de instancia con almacenamiento conservado, rollback transaccional mediante fallo inyectado, ocho aceptaciones concurrentes, veinte rechazos concurrentes, retención, legado y mantenimiento idempotente.
- npm run cf:deploy:dry completado: bundle 75.59 KiB, gzip 17.40 KiB. Sin cambios de bindings, migraciones ni wrangler.jsonc; no se publicó el Worker.
- Cuatro capturas sintéticas revisadas visualmente: EN/ES en escritorio de 1365 px y móvil de 390 px. Comprobación automatizada de ausencia de desbordamiento horizontal; fechas y textos largos se ajustan al ancho.
- Revisión de privacidad: pruebas con marcadores sintéticos verifican ausencia de cuerpos, credenciales, cabeceras, IDs y texto de excepciones en diagnósticos, logs y errores. Datos ordinarios y contratos Nightscout permanecen separados de los metadatos.
- Checklist de requisitos conservado sin modificaciones: 16 de 16 criterios satisfechos. Las 36 tareas de implementación quedan completadas.

Límites comprobados/documentados: primera recepción de datos heredados desconocida; rechazos anteriores a observedSince o cuyo registro falla quedan fuera del recuento; saturación se expresa como cota inferior. Las pruebas y capturas son locales con datos sintéticos; no demuestran funcionamiento en una instalación de producción. El coste adicional corresponde a consultas del snapshot y escrituras diagnósticas descritas en las guías técnicas.

## Cierre aceptado: 2026-10-05

El usuario confirma que la implementación es correcta y solicita cerrar la especificación. Las 36 tareas están completadas. Las fechas visibles se convierten a la zona horaria del navegador mediante Intl.DateTimeFormat, con indicación de zona y conservación del datetime ISO UTC; las antigüedades y reglas de actualidad siguen calculándose sobre instantes absolutos.

Validación final tras esa corrección: 67 pruebas aprobadas y TypeScript sin errores. Prueba real de navegador en Europe/Madrid y America/New_York, tanto local como en producción, confirmó la conversión de horas. Documentación EN/ES actualizada.

Despliegue autorizado en el servicio existente tinyscout-lite, con wrangler.jsonc corregido para futuros despliegues. Versión publicada: adde0e5c-1e90-4669-981f-3a157147d1d6. HTTP 200 y diagnóstico visible; API_SECRET y bindings existentes conservados. Bundle publicado: 76.17 KiB, gzip 17.63 KiB. Las verificaciones públicas fueron de lectura; no se enviaron datos sintéticos a este servicio.

El despliegue inicial apuntó por error a glucoeasy, el nombre anterior del archivo de configuración. Ese Worker adicional sigue existiendo; su eliminación no forma parte de este cierre.
