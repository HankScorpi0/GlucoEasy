# Guía Técnica De GlucoEasy

Este documento es para desarrolladores y usuarios avanzados.  
Si solo quieres desplegarlo y configurarlo en `xDrip+`, consulta [README.es.md](README.es.md).

Version in English: see [README.technical.md](README.technical.md).

## Alcance

GlucoEasy es un servicio reducido de monitorización de glucosa diseñado para:

- aceptar `entries`
- aceptar `treatments`
- ofrecer compatibilidad mínima con `profile`
- exponer una página de `health` y estado
- mantener un despliegue pequeño, simple y barato

Limitaciones actuales:

- no es Nightscout completo
- el borrado de `treatments` es mínimo y busca sobre todo compatibilidad con clientes
- no guarda historial completo de perfiles
- `devicestatus` se expone como colección vacía por compatibilidad

## Intención Del Diseño

El objetivo no es reemplazar todas las funciones de Nightscout.

El objetivo es conservar la superficie de API de Nightscout que muchas apps e integraciones ya entienden, reduciendo al mismo tiempo la complejidad operativa al mínimo.

## Variables De Entorno

- `API_SECRET`: secreto manual opcional
- `READ_PUBLIC`: `true` en esta configuración
- `MAX_ENTRIES`: `2000` por defecto
- `HEALTH_REFRESH_SECONDS`: `30` por defecto, valor efectivo mínimo `5`

## Endpoints Principales

- `POST /api/v1/entries`
- `GET /api/v1/entries`
- `GET /api/v1/entries/current`
- `GET /api/v1/status.json`
- `POST /api/v1/treatments`
- `GET /api/v1/treatments`
- `DELETE /api/v1/treatments/:id`
- `GET /api/v1/profile/current`
- `GET /api/v1/profile`
- `POST /api/v1/profile`
- `PUT /api/v1/profile`
- `GET /api/v1/devicestatus`
- `GET /health`
- `GET /es/health`

## Soporte De Profile

### Diagnóstico de recepción y compatibilidad de datos

Health usa un snapshot interno DO separado. Estado y registros Nightscout conservan campos y selección. Datos del envío y aceptación se confirman juntos. Dos claves aditivas guardan diagnóstico: `reception-summary` (fechas/contadores por categoría) y `entry-receipts` (fechas retenidas y primera recepción o null). Identidad `global`, clase, bindings y claves de datos no cambian; no hace falta migración Wrangler.

Las recepciones siguen deduplicación por ID/fecha, permanecen desconocidas para duplicados del legado y se podan con retención. Los contadores se saturan en `Number.MAX_SAFE_INTEGER` indicando cota inferior. Los lotes inválidos siguen rechazándose completos; cuerpos excesivos mantienen `400`, con categoría interna diferenciada. Los logs omiten cabeceras, IDs del cliente, nombres de perfil y excepciones arbitrarias; mensajes del parser/almacenamiento se sanean.

Cada rechazo añade llamada/escritura DO, también sin autorización. No hay polling adicional. `READ_PUBLIC=true` expone resúmenes y datos de salud a cualquiera con la URL; `false` exige autenticación existente después de configurar, manteniendo sesión autorizada de revelación única. Solo se cuentan eventos observados cuyo diagnóstico pudo guardarse.

Al reactivar tras rollback sin instrumentación, usar el [procedimiento de nueva época](specs/002-reception-diagnostics/quickstart.md#recovery-after-rollback), explícito y protegido. Solo reinicia metadatos diagnósticos y conserva datos ordinarios y configuración. No hay ruta pública de reinicio.

El soporte actual de perfiles incluye:

- `GET /api/v1/profile/current`
- `GET /api/v1/profile`
- `POST /api/v1/profile`
- `PUT /api/v1/profile`

## Gestión Del Secreto

En la primera visita, GlucoEasy puede generar automáticamente un `API_SECRET` de 6 caracteres y mostrarlo una sola vez.

Si necesitas gestionarlo manualmente, define `API_SECRET` tú mismo en la configuración del Worker de Cloudflare.

## Desarrollo Local

```bash
npm install
npm run test
npm run dev
```

## Licencia

Este proyecto está licenciado bajo MIT. Consulta [LICENSE](LICENSE).
