# Contract: Worker–Durable Object

Interfaces exclusivamente por ENTRIES_DO; no rutas públicas del Worker ni contratos Nightscout.

## GET /health/snapshot

Devuelve HealthReceptionSnapshot de [data-model.md](../data-model.md). Reloj del servicio para evaluatedAt, lectura coherente de datos y resumen. El Worker llama solo tras autorización health y verifica response.ok. /snapshot y /treatments/snapshot existentes permanecen iguales; el snapshot health puede incluir resumen de tratamientos actual para evitar llamada adicional sin modificar selección existente.

## POST /reception/rejections

Cuerpo permitido: { category: "authentication" | "payloadTooLarge" | "invalidPayload" | "internalFailure" }. Rechazar campos adicionales y texto libre. Fecha generada por DO; no recibir Request, credenciales, cabeceras, ruta del cliente ni cuerpo original. Éxito interno 204 tras commit; cuerpo o enum no admitido, 400 sin efecto en recuentos.

Worker llama una vez desde punto central de resultado de envío rechazado y espera antes de devolver respuesta original. Si falla instrumentación, conservar respuesta sin reintentar incremento ni registrar texto externo. Esta llamada no produce eventos diagnósticos sobre sí misma.

## Escrituras existentes

POST /entries, POST /treatments y POST/PUT /profile conservan cuerpos/respuestas actuales. Datos y lastAccepted se guardan juntos; lecturas incluyen mapa podado en misma transacción. Tomar instante dentro de operación que confirma, no al recibir HTTP. No segunda llamada para registrar aceptación.

Propagar fallos al Worker y comprobar response.ok antes de interpretar éxito. Clasificar por fase, no texto de excepción. No reintentar automáticamente registro externo: respuesta perdida después de commit podría duplicar contador. Rechazos con fallo de resumen no se anuncian como contabilizados; limitación explicada en health.
