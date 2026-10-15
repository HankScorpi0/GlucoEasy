# Resultado final de validación técnica

Fecha: 2026-10-15. **Feature cerrada por solicitud expresa del responsable**, con implementación técnica completada y excepción de la evaluación SC-002. Esta evaluación no se ha realizado ni se declara superada.

## Resultado principal

La interfaz usa el tema oscuro fijo aceptado por el responsable y conserva módulos, campos, orden, acceso y almacenamiento. Se retiraron siete campos de traducción sin uso de `HealthCopy` y sus diccionarios; no cambió el aspecto de la propuesta aceptada. Se añadieron cuatro casos de integración para confirmación no autorizada y precedencia del secreto manual en ambos idiomas. Las guías e imágenes muestran ahora la interfaz final.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| `npm run test` final | 6 archivos, 91 pruebas correctas |
| `npx tsc --noEmit` final | Correcto |
| `git diff --check` | Sin errores; aviso habitual de conversión LF/CRLF |
| QA de navegador | 384 combinaciones correctas, sin desbordamiento/recorte detectado |
| Contraste calculado | 2532 mediciones correctas: texto, hover, foco y límites de controles |
| Teclado | 6 recorridos completos ES/EN correctos, controles nombrados y foco visible |
| Recarga automática real | 12 casos; continuidad en condiciones soportadas y degradación prevista con ambos mecanismos bloqueados |
| Sin JavaScript | ES/EN: detalle utilizable y fecha ISO visible |
| Errores de script | 0 |
| Capturas | Cuatro vistas finales y dos de diagnóstico con detalles abiertos, revisadas visualmente |

La matriz usa 16 escenarios, ES/EN, 360/768/1440 px, apariencia del dispositivo clara/oscura y texto 100/200 %. Los datos son sintéticos; la fuente temporal de las fixtures está fijada en 2026-10-15 10:00 UTC. El runner crea un servidor efímero local y lo cierra, sin conectarse al despliegue real.

## Reproducción y evidencia

- [Guía de ejecución](quickstart.md) y runner `test/browser/health-qa.cjs` con Playwright instalado aparte, sin dependencias nuevas en `package.json`/lockfile.
- [Resultados de navegador](browser-results.json): vistas, pares/ratios, recorridos, estados antes/después de recarga y capturas.
- [Adaptación](responsive-review.md), [contraste](contrast-review.md), [continuidad](continuity-review.md), [configuración/recepción](setup-reception-review.md).
- [Aceptación visual](proposal-review.md): «Técnico 4, atractivo 4, sí», sin ajustes solicitados. SC-001 satisfecho.
- [Protocolo humano](usability.md): preparado, sin tiempos recibidos ni participantes simulados. SC-002 no verificado y dispensado para este cierre.

## Recursos y compatibilidad

- HTML con fixture reciente: 18718 bytes ES y 18570 bytes EN, independiente del ancho. Referencia anterior 14197/14055 bytes: incremento aproximado de 4,5 KiB por composición y estilos, sin duplicar datos.
- Sin fuentes, hojas, scripts o imágenes remotas; el símbolo de marca es vectorial incorporado. Se mantiene la petición del documento y cadencia configurada de refresco, sin nueva consulta de navegador.
- Selección de lecturas, umbrales, normalización, autenticación y contratos Nightscout conservados. Las pruebas de integración cubren las respuestas y las restricciones existentes.
- Sin cambios en `src/index.ts`, `src/types.ts`, `src/reception.ts`, `src/durable-object.ts`, `wrangler.jsonc` ni `package-lock.json`. No hay claves, colecciones, bindings, identidad ni migraciones nuevas. Impacto en datos almacenados: ninguno.
- `.gitignore` sigue cubriendo Node, compilación, estado Wrangler, credenciales locales y temporales; no se publica el paquete npm.
- El dry deploy ya fue correcto antes de la publicación autorizada, según [deployment.md](deployment.md). Los cambios finales no modifican configuración, bindings ni migraciones, por lo que no requieren otro dry deploy. No se ha publicado una versión adicional en esta continuación.

## Trazabilidad y cierre

| Criterio | Estado y evidencia |
|---|---|
| SC-001 | Satisfecho, valoración del responsable registrada |
| SC-002 | No verificado; evaluación no realizada y exceptuada para el cierre solicitado por el responsable |
| SC-003 | Satisfecho técnicamente: render, escape, campos, estados, integración de acceso/configuración |
| SC-004 | Satisfecho técnicamente: matriz de 384 vistas y capturas revisadas |
| SC-005 | Satisfecho técnicamente: teclado, estados textuales, mediciones de contraste |
| SC-006 | Satisfecho técnicamente: arnés y doce recargas reales; pausa y degradación documentadas |

Las comprobaciones de geometría y contraste son evidencia técnica de la matriz definida, no una certificación universal de accesibilidad ni resultados de usuarios. Toda variante no representada requiere su evaluación correspondiente si se introduce después. No se han detectado fallos técnicos pendientes en el alcance actual.

T001–T016, T018–T033 y T035–T036 ejecutadas: 34 tareas. T017 y T034 cerradas por dispensa del responsable tras su instrucción «cierra la feature», sin ejecución de la prueba humana. Las 36 tareas están resueltas administrativamente; no se afirma que las 36 se hayan ejecutado. La limitación conocida es la ausencia de evidencia de consulta con cinco participantes; no afecta a los resultados técnicos ya registrados ni altera la finalidad informativa del producto.
