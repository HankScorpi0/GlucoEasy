# Continuidad de actualización y degradación

Fecha: 2026-10-15. Resultado técnico: correcto.

## Browser real

`test/browser/health-qa.cjs` ejecuta doce recargas automáticas reales, con intervalo existente de 30 segundos: ES/EN × recepción abierta/cerrada × almacenamiento normal/sessionStorage bloqueado/ambos mecanismos bloqueados. Resultados antes/después en [browser-results.json](browser-results.json), colección `continuity`.

- En las ocho combinaciones soportadas se conservan exactamente apertura, foco y scroll. Con recepción abierta se enfoca su resumen; cerrada, el enlace al repositorio. El foco permanece en el mismo control y se restaura la posición observada.
- Bloquear sessionStorage activa el fallback de `history.state` y conserva contexto.
- Con ambos mecanismos bloqueados se recarga sin excepción; no se garantiza restauración de contexto. Esta degradación existente está permitida y documentada en ambas guías. No se registra como fallo de preservación soportada.
- Sin JavaScript en ES y EN se puede abrir el detalle nativo y se mantiene visible la fecha ISO del tratamiento; refresco y localización requieren JavaScript como antes.

## Casos adicionales del arnés

`test/health.test.ts` conserva pruebas de registro inválido/caducado, distinta ruta, coordenadas negativas, control no permitido, visita independiente, consumo del registro, foco desaparecido con fallback y scroll acotado a nueva geometría. Verifica también limpieza y ausencia de temporizador durante configuración pendiente. La integración confirma pausa durante revelación autorizada y otra sesión.

No se modificó el script de continuidad ni su versión, ventana temporal, lista permitida de foco o fallback. No guarda datos médicos, notas, HTML, secretos ni URL completas: solo versión, ruta, fecha de guardado, apertura, coordenadas y control permitido. Las pruebas de forma del registro siguen activas.

La revisión mantiene mínimo efectivo de 5 segundos y valor configurado de 30 segundos, sin segundo temporizador ni nuevas peticiones de navegador.
