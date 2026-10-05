# Contract: páginas de diagnóstico

## Superficie y acceso

GET /health (inglés) y GET /es/health (español) son las únicas superficies de diagnóstico. Mantener rutas, setup, refresco y permisos existentes: READ_PUBLIC=true o secreto válido, con excepción existente de sesión autorizada de revelación. Autorizar antes de recuperar diagnóstico. Visita no autorizada no recibe cifras ni fechas.

No añadir endpoints públicos ni metadatos a /api/v1/status.json o respuestas entries/treatments/profile/devicestatus. El snapshot de API conserva selección previa incluso con futuras.

## Contenido observable

| Indicador | Información mínima |
|---|---|
| Servidor disponible / Server available | Responde ahora, sin garantía histórica |
| Último envío aceptado / Last accepted upload | Fecha, edad y colección, o no registrado |
| Actualidad / Reading freshness | Sin lecturas, solo futuras, reciente o antigua |
| Referencia | Fecha no futura más nueva y antigüedad |
| Recepción de referencia | Primera aceptación y retraso, o desconocido |
| Umbral | Mayor entre cinco minutos y dos intervalos de refresco efectivos |
| Fechas futuras / Future timestamps | Advertencia y número retenido, independiente del estado de actualidad |
| Rechazos / Rejected uploads | Total y cuatro categorías desde inicio visible |

Fechas con zona explícita y precisión de duraciones de minutos o mejor. No confundir fecha de cliente con recepción ni convertir negativas a cero. Futura + reciente muestra ambos hechos; solo futuras se distingue de colección vacía. Delta solo entre referencias no futuras; sin pareja, desconocido. Ajustar antiguo rótulo Service active para que no mezcle servidor y actualidad.

Etiquetas y avisos accesibles mediante texto, sin depender del color; escapar contenido externo. Mantener aviso de respaldo informativo y equivalencia EN/ES.

## Ausencia y fallos

- Vacío: disponible, sin envío registrado, sin lecturas, cero rechazos desde inicio.
- Legado: fecha y antigüedad presentes; recepción y retraso desconocidos.
- Rechazo: no modifica último envío; una categoría aumenta.
- Diagnóstico ilegible: mostrar indisponibilidad si datos ordinarios permiten servir página; si tampoco se recuperan datos, preservar comportamiento de fallo del servicio. No inventar ceros.
- Explicar siempre que los recuentos solo cubren envíos observados y guardados; excluyen fallos previos al servicio y fallos de persistencia del resumen.
- Saturación numérica muestra “al menos”, sin igualdad falsa.

## Compatibilidad y mensajes seguros

Mantener métodos, variantes .json, códigos y formas de respuesta actuales, incluido 400 para cuerpo excesivo. Normalización actual con map rechaza lotes entries/treatments si algún registro es inválido; no introducir aceptación parcial. Vacíos/duplicados aceptados siguen siendo aceptación.

Conservar mensajes estáticos de validación. Sustituir mensajes arbitrarios de JSON.parse o almacenamiento por texto seguro propio, conservando { error: string } y código previo. No devolver cuerpos ni credenciales. Documentar saneamiento en notas de compatibilidad bilingües.

Comprobar escenarios de [spec.md](../spec.md), permisos, setup, escape y ausencia de campos nuevos en API. Capturas sintéticas EN/ES en escritorio y móvil.
