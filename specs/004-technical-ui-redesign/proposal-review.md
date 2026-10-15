# Evaluación de la propuesta representativa

Fecha: 2026-10-15. Estado: propuesta aceptada por el responsable. SC-001 satisfecho con su respuesta «Técnico 4, atractivo 4, sí», recibida durante converge. La implementación continúa con las tareas técnicas y evidencia final.

## Propuesta para revisar

- [Escritorio ES](../../docs/images/004-technical-ui-redesign/proposal/health-es-desktop.png)
- [Móvil ES](../../docs/images/004-technical-ui-redesign/proposal/health-es-mobile.png)
- [Escritorio EN](../../docs/images/004-technical-ui-redesign/proposal/health-en-desktop.png)
- [Móvil EN](../../docs/images/004-technical-ui-redesign/proposal/health-en-mobile.png)
- [Referencia anterior](baseline.md)

Vista local sintética: `http://127.0.0.1:8797/es/health` y `/health`. El Worker local de desarrollo está en puerto 8796; la vista sintética usa directamente el renderizador real con tiempo fijo y no implica cambios en rutas públicas.

## Cambios implementados

- Tema grafito constante y sistema de superficies oscuro, con acentos fríos, estados textuales y colores semánticos conservados.
- Cabecera con marca, símbolo vectorial local y disponibilidad del servidor expresada como texto.
- Superficie continua dividida en secciones numeradas; retícula interna y separadores en lugar del conjunto anterior de tarjetas redondeadas.
- Glucosa monoespaciada dominante; variación etiquetada y separada; antigüedad y tratamiento con campos alineados.
- Tratamiento con insulina, tipo, fecha, antigüedad y notas completos; información del servicio y enlaces en un cierre compacto.
- Firma del renderizador, IDs funcionales, selección de datos, fechas y scripts de continuidad conservados. Sin dependencias, recursos remotos ni cambios de acceso, datos o persistencia.

## Medidas de la vista representativa

Chrome headless instalado, zona Europe/Madrid, fixture `recent` fija; datos iguales a referencia. Capturas móviles completas: la altura del archivo puede superar 800, pero el viewport medido es 360 × 800.

| Idioma/vista | Tamaño | HTML UTF-8 | Fin lectura | Fin resumen tratamiento | Desbordamiento horizontal |
|---|---|---:|---:|---:|---|
| ES móvil | 360 × 800 | 18718 bytes | 362,09 px | 522,09 px | No |
| EN móvil | 360 × 800 | 18570 bytes | 362,09 px | 514,59 px | No |
| ES escritorio | 1440 × 1000 | 18718 bytes | 390 px | 562 px | No |
| EN escritorio | 1440 × 1000 | 18570 bytes | 390 px | 562 px | No |

El HTML crece unos 4,5 KiB respecto a referencia por el sistema de composición adaptable, estilos oscuros y marcado de presentación. No incorpora bibliotecas, fuentes ni recursos remotos; sigue habiendo una petición de documento por vista y la misma cadencia de refresco. El incremento se ha revisado y corresponde a estilos/marcado, no a datos duplicados ni peticiones nuevas. La limpieza final está prevista en T025.

## Verificación de T009

- `npm run test`: 6 archivos, 87 pruebas correctas (85 originales y dos casos bilingües de conservación de campos).
- `npx tsc --noEmit`: correcto.
- `git diff --check`: sin errores de formato; Git avisa de su conversión habitual LF/CRLF para `src/health.ts`.
- Ocho vistas de navegador: ES/EN × 360/1440 × preferencia clara/oscura. Todas conservan `color-scheme: dark`, mismos colores calculados por preferencia, orden de bloques, detalles inicialmente cerrados y sin desbordamiento. Cero errores de script.
- A 360 × 800, lectura y resumen del tratamiento visibles inicialmente en ambos idiomas.
- Esta revisión no acredita todavía todos los estados, contraste completo, 768 px, ampliación al 200 %, recarga real ni evaluación de participantes. Son tareas posteriores.

Herramientas locales de captura/verificación: `.wrangler/004-preview/capture.cjs proposal` y `.wrangler/004-preview/verify-proposal.cjs`, usando el runtime de `environment.md` y Playwright ya existente, sin modificar dependencias del proyecto.

## Valoración SC-001 recibida

El responsable respondió el 2026-10-15: «Técnico 4, atractivo 4, sí». Carácter técnico 4/5, atractivo visual 4/5 y confirmación de rediseño integral. No solicitó ajustes. Esta respuesta satisface SC-001 y T010, sin necesitar otra aprobación estética.

La respuesta previa A solo confirmó el tema; la valoración anterior es la aceptación de su ejecución concreta. SC-002 requiere cinco participantes y se registra por separado en usability.md, sin atribuirle resultados de esta valoración.
