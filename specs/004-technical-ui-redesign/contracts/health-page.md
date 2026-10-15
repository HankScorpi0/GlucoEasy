# Contract: Página de estado y configuración

## Interfaces conservadas

| Interfaz | Contrato |
|---|---|
| `GET /` | Redirección existente a `/health` |
| `GET /health` | Inglés bajo acceso existente |
| `GET /es/health` | Español equivalente |
| `POST /setup/acknowledge` | Confirmación inglesa protegida por sesión |
| `POST /es/setup/acknowledge` | Confirmación española equivalente |
| Enlace `/api/v1/status.json` | Estado existente con autenticación vigente |
| Enlace al repositorio | URL existente, apertura segura si usa nueva pestaña |

Conservar métodos, códigos, redirecciones, cookies y encabezados. `READ_PUBLIC=true` permite consultar datos a quien conoce la URL; con `false` preservar rechazo sin credencial después de configurar. No modificar respuestas JSON Nightscout ni añadir endpoints.

## Renderizador y DOM

Mantener `renderHealthPage(view: HealthViewModel, locale: "en" | "es" = "en"): string`: documento completo con idioma, viewport y título actuales; selección y evaluación de datos existentes. Escapar todo texto externo, incluidas notas, tipos, direcciones y conexión.

Orden visual/DOM: configuración si aplica → `latest-reading` → `latest-treatment` → `reception` → `service-info`. La retícula interna no reordena módulos.

IDs conservados y únicos:

- Bloques: `latest-reading`, `latest-treatment`, `reception`, `service-info`.
- Recepción: `reception-details`, `reception-summary`.
- Enlaces: `status-link`, `repository-link`.
- Detalles condicionales: `treatment-type-details`, `treatment-type-summary`, `direction-details`, `direction-summary`.

Lista permitida de foco: `reception-summary`, `status-link`, `repository-link`, `treatment-type-summary`, `direction-summary`. Las clases puramente visuales pueden cambiar; sus comportamientos se preservan.

## Contenido e interacción

- Lectura: valor, `mg/dL`, dirección y variación si disponibles, actualidad; aviso informativo visible junto al área principal.
- Tratamiento: insulina si numérica, incluso cero, tipo, fecha y antigüedad; notas completas dentro del bloque. Sin cambios de cálculo.
- Fechas: `time[datetime]` ISO, localización y zona del navegador; sin JavaScript permanece ISO legible.
- Recepción: disponibilidad, actualidad y avisos fuera del detalle, cerrado inicialmente. Conservar todas las fechas, retrasos, categorías, saturación y límites observados. `details`/`summary` nativos operables con teclado/puntero.
- Configuración: misma revelación, conexión y confirmación; nunca persistir credenciales en estado UI ni capturas. Sin refresco con secreto visible/configuración pendiente.
- Refresco: mismo intervalo, restauración y degradación de [data-model.md](../data-model.md); sin segundo temporizador ni peticiones nuevas.
- Tema oscuro en consulta, vacío, avisos y configuración, independientemente de preferencia del dispositivo; sin selector.

## Verificación

Reutilizar `test/health.test.ts` para orden, campos, escape y continuidad, y `test/api.test.ts` para acceso/configuración/contratos. Geometría, contraste e interacción real mediante [quickstart.md](../quickstart.md). Ajustar aserciones de marcado cuando cambie estructura legítima sin debilitar cobertura funcional ni fijar decoración innecesaria.
