# Configuración, diagnóstico, acceso y contenido externo

Fecha: 2026-10-15. Resultado técnico: correcto. Datos exclusivamente sintéticos.

## Configuración y acceso

`test/api.test.ts` mantiene integración Worker–DO con reset entre casos y añade cuatro casos ES/EN para aspectos antes no explícitos:

- Confirmación con token no autorizado: 403, sin secreto y sin refresco; no consume la revelación de la sesión autorizada, que sigue pudiendo confirmar.
- Secreto manual configurado: precede al generado aunque exista estado/cookie previo; la credencial generada se rechaza y la manual permite acceso sin mostrar ningún secreto en la página.

Cobertura existente revalidada: inicialización, prioridad de configuración, revelación solo en sesión autorizada, otra sesión sin secreto, confirmación válida, redirección localizada, visita posterior sin revelación, lectura privada rechazada sin credencial y acceso público conforme a configuración. No se alteran métodos, códigos, cookies ni almacenamiento.

## Presentación y diagnóstico

La matriz de navegador cubre ambos idiomas, tres anchos, tema del dispositivo claro/oscuro y texto 200 %, con configuración autorizada/pendiente, diagnóstico ausente, rechazos, saturación y futuros. Todos usan el mismo sistema oscuro, sin recortes detectados. Código, botón, avisos y foco se incluyen en las mediciones de contraste.

Los avisos permanecen fuera del detalle cerrado inicialmente. El contenido completo conserva fechas, retrasos, categorías, saturación y alcance observado. Los controles nativos se abren y cierran con teclado. La disponibilidad del servidor no se presenta como garantía de recepción reciente.

`test/health.test.ts` comprueba texto de tipo/dirección/notas escapado, acceso íntegro a valores extensos, fechas y localización incluso durante configuración. Las fixtures contienen caracteres `<script>` como texto sintético; el navegador no registra errores y no se generan elementos activos a partir de esos campos.

La condición de exposición `READ_PUBLIC=true` del despliegue se mantiene documentada. Las capturas finales se limitan a consulta/diagnóstico sin credenciales; la configuración se acredita con fixtures y pruebas, sin publicar su secreto.
