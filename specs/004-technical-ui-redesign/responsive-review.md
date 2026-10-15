# Adaptación y accesibilidad de la composición

Fecha: 2026-10-15. Resultado técnico: correcto. Fuente reproducible: `test/browser/health-qa.cjs`; datos completos en [browser-results.json](browser-results.json).

## Matriz final

384 combinaciones: ES/EN × 360/768/1440 px × 16 escenarios × preferencia clara/oscura × tamaño de fuente 100/200 %. Altura de viewport 800 px. Escenarios: reciente, antiguo, vacío, exclusivamente futuro, mezcla futuro/reciente, diagnóstico ausente, insulina cero/ausente, texto extenso, rechazos, saturación, configuración autorizada/pendiente, tonos de glucosa bajo/alto y variación cero.

- Sin desplazamiento horizontal del documento ni recortes detectados por `scrollWidth > clientWidth` en párrafos, títulos, código y controles de detalle visibles.
- A 360 × 800 y texto predeterminado, lectura/actualidad y resumen de tratamiento o vacíos quedan dentro del primer viewport tras configurar. Las notas completas siguen dentro del bloque, antes de recepción, sin exigirlas inicialmente visibles.
- El orden DOM y visual es lectura → tratamiento → recepción → servicio. Configuración mantiene su precedencia cuando requiere atención.
- Tema oscuro constante y mismos colores calculados bajo preferencias clara/oscura. Ningún selector ni recursos externos añadidos.
- La ampliación se realizó cambiando el tamaño raíz de 16 a 32 px, para comprobar aumento real del texto y reflujo. No se impone la condición de primer viewport al 200 %. El código usa flujo normal, ajuste de palabras y flex/grid adaptables, sin posicionamiento absoluto ni alturas fijas de bloques de texto.

## Interacción

Seis recorridos completos de Tab en ES/EN con vistas reciente, texto extenso y configuración autorizada. Todos los controles alcanzados tienen contenido que les da nombre, rectángulo visible y contorno de foco; cada resumen abre con Enter y cierra con espacio. Incluye dirección/tipo extensos, recepción, enlaces y botón de confirmación. No se activó el envío de confirmación en el servidor de fixtures; su protección se verifica con integración Worker–DO.

Se conserva el aviso informativo junto a lectura. La cabecera describe disponibilidad del servidor y el área de lectura explica actualidad; no se añade interpretación clínica.

## Evidencia visual

Capturas finales revisadas en `docs/images/004-technical-ui-redesign/`: health-es/en-mobile, health-es/en-desktop y reception-es/en-desktop. Móvil 360 × 800 y escritorio 1440 × 1000, datos sintéticos y zona Europe/Madrid. La captura de página completa puede ser más alta que el viewport; las condiciones de primer viewport se acreditan con las medidas del JSON.

Las 132 vistas iniciales de convergencia se conservan como antecedente en tasks.md. Esta ejecución amplía estados, apariencia y tamaño de texto; no sustituye la evaluación humana SC-002.
