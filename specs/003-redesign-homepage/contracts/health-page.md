# Contract: Página principal

Alcance: presentación de `/health` y `/es/health`; `/` conserva redirección a `/health`. API Nightscout, acceso y persistencia sin cambios.

## Orden

| Posición | Bloque | Contenido |
|---|---|---|
| Excepción | Configuración pendiente | Antes de datos, sesión y revelación existentes |
| 1 | Lectura | Valor/unidad, dirección y variación disponibles, actualidad/estado vacío |
| 2 | Tratamiento | Tipo, fecha e insulina si existe; notas completas después del resumen |
| 3 | Recepción | Resumen y avisos; detalles técnicos cerrados inicialmente |
| 4 | Servicio | Finalidad, estado y enlaces existentes, menor énfasis |

Orden visual y semántico coinciden en todos los anchos. IDs constantes propuestos: `latest-reading`, `latest-treatment`, `reception`, `reception-details`, `reception-summary`, `service-info`, `status-link`, `repository-link`. Aviso informativo junto a consulta principal, fuera del desplegable.

## Visibilidad y accesibilidad

A 360 × 800 y texto predeterminado, tras configuración, lectura/estado vacío, actualidad y resumen del tratamiento/estado vacío visibles sin desplazarse. No exige notas completas inicialmente. Tipos extensos admiten resumen visual acotado solo si el valor completo sigue accesible dentro del bloque. Zoom 200 % sin pérdida; sin desbordamiento a 360/768/1440. Contraste 4,5:1 normal y 3:1 grande; foco visible y controles con nombre.

`details`/`summary` nativos, etiquetados por idioma, cerrados en visita inicial. Disponibilidad, actualidad y avisos de rechazo/futuro/diagnóstico ausente siempre fuera. Cifras y límites existentes dentro. Teclado y consulta disponibles sin JavaScript. Recarga conserva apertura, foco y scroll según [data-model.md](../data-model.md).

## Idiomas y seguridad

Textos, acciones y significados equivalentes ES/EN, incluidos rótulos hoy literales Glucose, Treatment, Setup y System. Fechas ISO en `time[datetime]`, localizadas en navegador con fallback legible. No modificar valor, unidad ni selección de datos.

Autorización antes de renderizado, READ_PUBLIC, cookie de revelación y POST de confirmación existentes. Escape de todo texto externo, incluidos tipo, notas, dirección y URL. No guardar datos médicos ni secretos en continuidad UI. Pausa de recarga durante configuración.

## Evidencia requerida

- FR-001/004/005: orden en tests y navegador, incluidos vacío/configuración.
- FR-002/003: reciente, antiguo, futuro, diagnóstico ausente y avisos fuera de details.
- FR-006/007: medición del primer viewport y capturas ES/EN con textos largos.
- FR-008/009: teclado, foco, zoom, contraste y equivalencia.
- FR-010/011: aviso visible, escape, acceso/configuración y recarga real conservando consulta.
- FR-012: revisión de diff sin API, esquema, retención ni interpretación clínica nuevos.
