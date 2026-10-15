# Quickstart: Validación del rediseño técnico

Guía para la fase de implementación. El plan no modifica la aplicación ni demuestra resultados visuales, técnicos o humanos.

## Preparación

Desde la raíz del repositorio, con Node/npm compatibles con los motores del lockfile. En la sesión de planificación no estaban en PATH; resolverlo antes de ejecutar:

```powershell
node --version
npm --version
npm ci
npm run test
npx tsc --noEmit
npm run dev -- --local --persist-to .wrangler/state/004-ui-validation
```

Usar el puerto local indicado por Wrangler y abrir `/health` y `/es/health`. La persistencia indicada queda bajo `.wrangler/`, ignorado por Git y separado del estado de desarrollo ordinario. No conectar datos ni credenciales reales. Configurar desde la página, guardar el secreto local para los envíos y confirmar la revelación antes de tomar capturas. No abrir la configuración por primera vez en ambos idiomas simultáneamente: usar la misma sesión autorizada para comprobarla.

## Misma fixture para referencia y propuesta

Antes de cambiar la interfaz, registrar captura, viewport, idioma, tamaño HTML y peticiones usando la fixture siguiente. Repetir después con los mismos valores y antigüedades equivalentes; fechas relativas evitan que la comparación cambie accidentalmente de estado reciente a antiguo.

```powershell
$validationBase = 'http://localhost:8787'
$validationSecret = Read-Host 'Secreto de la instalación local sintética'
$validationHeaders = @{ 'api-secret' = $validationSecret }
$validationNow = [DateTimeOffset]::UtcNow
$validationEntries = @(
  @{ sgv = 123; date = $validationNow.AddMinutes(-1).ToUnixTimeMilliseconds(); direction = 'Flat'; type = 'sgv' },
  @{ sgv = 120; date = $validationNow.AddMinutes(-6).ToUnixTimeMilliseconds(); direction = 'Flat'; type = 'sgv' }
) | ConvertTo-Json
Invoke-RestMethod -Uri "$validationBase/api/v1/entries" -Method Post -Headers $validationHeaders -ContentType 'application/json' -Body $validationEntries | Out-Null
$validationTreatment = @{
  eventType = 'Correction Bolus'
  created_at = $validationNow.AddMinutes(-10).ToString('o')
  insulin = 1.2
  notes = 'Dato sintético para revisión visual.'
} | ConvertTo-Json
Invoke-RestMethod -Uri "$validationBase/api/v1/treatments" -Method Post -Headers $validationHeaders -ContentType 'application/json' -Body $validationTreatment | Out-Null
```

No imprimir cabeceras ni secretos en resultados compartidos. Al actualizar fechas se crean lecturas nuevas según el contrato; no usar una instalación con datos mezclados para acreditar escenarios vacíos o exclusivamente futuros.

## Primera propuesta: SC-001

1. Mostrar referencia y propuesta con lectura, tratamiento y recepción en 360 × 800 y escritorio de 1440 px; no mezclar datos distintos.
2. Verificar cambios de composición, tipografía, superficies, espaciado y controles, además de paleta. Revisar [contrato visual](contracts/visual-design.md).
3. Pedir al responsable puntuaciones reales de carácter técnico y atractivo de 1 a 5, y confirmación de percepción de rediseño integral. Registrar fecha, imágenes revisadas, puntuaciones y cambios solicitados.
4. Resolver ajustes; SC-001 exige ambas puntuaciones ≥4. Si no hay respuesta, registrar pendiente y no dar por aceptada la ejecución ni extenderla a todos los estados. El tema oscuro ya está decidido.

## Escenarios y evidencia técnica

Revisar los [contratos de página](contracts/health-page.md) y [modelos](data-model.md). Preparar estas variantes con instancias locales aisladas o fixtures del renderizador durante implementación; las fixtures nunca se exponen como rutas de producción.

| Escenario | Preparación y resultado esperado |
|---|---|
| Vacío | Persistencia local nueva, completar configuración sin envíos; mensajes explícitos y compactos |
| Reciente | Fixture anterior; lectura 123, variación +3, tratamiento 1.2 y actualidad explícita |
| Antiguo | Instancia separada con fechas de lectura de hace una hora; servidor disponible y lectura antigua diferenciados |
| Solo futuro | Instancia separada con lecturas de dentro de una hora; sin lectura no futura y advertencia, sin inventar valores |
| Futuro y reciente | Añadir fecha futura a fixture reciente; mantener referencia válida y aviso |
| Tratamiento sin campos / cero | Enviar tratamiento sin insulina/notas y luego otro con insulina 0 y fecha posterior; ausencia distinta de cero |
| Texto extenso/escape | Tipo y notas largos con marcador sintético `<script>marker</script>`, dirección desconocida mediante fixture; texto íntegro accesible y sin ejecución |
| Rechazo | Intento local de envío sin credencial, conservando rechazo; resumen visible y categorías completas en detalles |
| Diagnóstico ausente / saturación | Fixtures del renderizador y suite existente; limitación explícita / prefijo de saturación conservado |
| Configuración | Instancia nueva, sesión autorizada, otra sesión y visita posterior; solo la autorizada revela hasta confirmar |

Para vacío/futuro/configuración, parar el servidor y usar otro directorio bajo `.wrangler/state/` en `--persist-to`, sin borrar datos ni instalaciones ajenas.

### Apariencia y accesibilidad

1. ES/EN, a 360 × 800, 768 y 1440 px: sin desplazamiento horizontal; jerarquía visual y asistida coincidente. A 360 × 800 medir que el borde inferior del resumen del tratamiento cabe inicialmente con lectura/actualidad, tanto con datos habituales como vacíos. No exigir notas completas antes del scroll.
2. Repetir textos extensos. El resumen puede abreviar con acceso íntegro dentro del bloque; no ocultar fechas, unidades, variación disponible o aviso informativo para ganar espacio.
3. Ampliar texto al 200 %: acceso completo, sin solapamiento ni recorte; se admite mayor altura. Si el navegador solo permite zoom de página, registrar el método y comprobar también aumento de fuente mediante sus ajustes.
4. Preferencia del dispositivo clara y oscura: misma apariencia oscura en todos los estados, incluidas configuración, código, botones y avisos; sin selector.
5. Recorrer Tab/Shift+Tab; activar controles con teclado y abrir/cerrar detalles. Comprobar nombres, foco visible, orden y que los avisos permanecen fuera de detalles cerrados.
6. Medir contraste con los colores calculados de cada combinación real: 4,5:1 normal, 3:1 grande y límites necesarios de controles. Incluir valores, textos secundarios, enlaces, botones, foco, avisos, código y configuración, también hover/foco. Registrar pares, ratios y resultados; las paletas propuestas no son evidencia.
7. Sin JavaScript: datos, fechas ISO y detalles siguen accesibles; no exigir refresco automático ni localización de fechas.

### Refresco y acceso

1. Abrir recepción, desplazar y enfocar su resumen; esperar más de un intervalo. Comprobar actualización, apertura, foco y posición acotada. Repetir con detalles cerrados y enlaces secundarios.
2. Repetir con `sessionStorage` bloqueado: fallback de historial conserva contexto. Bloquear también historial: refresco sin excepción, con pérdida de contexto documentada. Para registros corruptos, caducados, distinta ruta y control desaparecido usar además el arnés existente de `test/health.test.ts`.
3. Inspeccionar que el registro UI solo contiene metadatos permitidos, se consume y no guarda lecturas, notas, HTML, secretos ni URL completas. Una visita independiente empieza cerrada.
4. Durante configuración autorizada o pendiente no hay refresco automático. Tras confirmar no reaparece secreto; otra sesión no lo revela. Revisar confirmación no autorizada y mantener rechazo.
5. Para comprobación privada, reiniciar la instancia con configuración local de `READ_PUBLIC=false`, por ejemplo:

```powershell
npm run dev -- --local --persist-to .wrangler/state/004-ui-validation --var READ_PUBLIC:false
```

Después de configurar, sin credencial rechaza consulta y no filtra datos; con autenticación existente permite acceso. Complementar con `SELF.fetch` y reset de integración actual. No incluir credenciales en URLs capturadas.

## Evaluación de localización: SC-002

Cinco participantes sin conocimientos de infraestructura, sin ayuda. Pedir que identifiquen lectura/actualidad y localicen último tratamiento. Registrar tiempos individuales: al menos cuatro de cinco deben cumplir ≤10 segundos y ≤15 segundos respectivamente. Registrar dispositivo/idioma y resultado real, sin identidades ni datos personales innecesarios. Si faltan participantes, mantener el criterio pendiente; una inspección técnica no lo sustituye.

## Cierre de implementación

### Revisión de navegador reproducible

El runner opcional `test/browser/health-qa.cjs` sirve el renderizador real con fixtures sintéticas en un puerto local libre y cierra servidor/navegador al terminar. No añade dependencias a producción ni a Vitest. Requiere Playwright ya instalado en una ubicación separada y Chrome local; se puede indicar otra ruta con `HEALTH_QA_CHROME`.

En el entorno utilizado para esta feature:

```powershell
$env:HEALTH_QA_PLAYWRIGHT = (Resolve-Path '.wrangler/reception-qa-tools/node_modules/playwright').Path
node test/browser/health-qa.cjs
```

Genera `browser-results.json` y las capturas finales de consulta/diagnóstico. Comprueba 384 combinaciones de vista, contraste de texto/controles/hover/foco, teclado, doce recargas de 30 segundos y uso sin JavaScript en ambos idiomas. No publica datos ni usa instalaciones reales. Las credenciales de configuración son marcadores de fixture y nunca aparecen en las capturas finales.

```powershell
npm run test
npx tsc --noEmit
git diff --check
```

Ejecutar `npm run cf:deploy:dry` si cambian configuración, bindings o migraciones; no están previstos. No ejecutar despliegue para esta validación.

Guardar cuatro capturas finales conforme al contrato visual en `docs/images/004-technical-ui-redesign/`, sin secretos ni datos reales. Actualizar referencias visuales afectadas de `README.md` y `README.es.md`, incluidas imágenes de recepción obsoletas; revisar también guías técnicas si resultan afectadas. Conservar explicación de `READ_PUBLIC=true` y aviso informativo.

Registrar en la carpeta de la feature los resultados técnicos, matriz de vistas, contrastes, tamaño HTML/peticiones, capturas y resultados humanos. Separar aprobado, fallido y pendiente. Confirmar impacto nulo en datos y contratos Nightscout; no reutilizar evidencia de 003 como si midiera 004.
