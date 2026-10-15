# Contraste y estados de controles

Fecha: 2026-10-15. Resultado: correcto. Runner: `test/browser/health-qa.cjs`; pares y ratios completos en [browser-results.json](browser-results.json), colección `contrast`.

La ejecución realiza 2532 mediciones sobre colores calculados de elementos visibles en 16 escenarios y ambos idiomas a 360 px, con detalles abiertos. Incluye texto principal/secundario, unidades, variación, etiquetas, ayuda, notas, código, enlaces, botón y resúmenes, así como tonos existentes de glucosa/dirección, configuración y avisos.

Para cada muestra se resuelve el primer fondo opaco real del elemento o sus ancestros, se calcula luminancia relativa y se aplica 4,5:1 al texto normal y 3:1 al grande. Los límites de botón/código y el contorno de foco se comparan con su superficie adyacente y requieren 3:1. El color se acompaña siempre de texto de estado; los indicadores de marca puramente decorativos no sustituyen etiquetas.

Se miden estados predeterminados, hover de cada control y foco tras navegación por teclado. Los seis recorridos completos de teclado adicionales verifican foco visible y operación nativa. Ninguna muestra quedó por debajo del umbral aplicable. Estas mediciones corresponden a las superficies utilizadas, no a una mera inspección de variables propuestas.

| Tipo | Mediciones | Ratio mínimo observado |
|---|---:|---:|
| Texto | 2322 | 6,96:1 |
| Foco | 142 | 9,94:1 |
| Límites de código/botón | 68 | 3,50:1 |

No se consideran necesarios para reconocer controles los divisores decorativos de secciones ni la línea de separación de metadatos. Botones, enlaces subrayados y resúmenes con indicador nativo conservan identificación propia. El borde de código se incluye además de forma conservadora.

Las 886 mediciones textuales anteriores se registraron en convergencia; la ejecución final amplía controles, hover/foco, límites y tonos. No se ha añadido una dependencia de navegador a producción ni al comando Vitest habitual.
