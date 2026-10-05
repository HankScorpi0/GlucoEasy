# Quickstart: Validación del rediseño

Guía para después de implementar. El plan no modifica la página ni acredita resultados de validación.

## Preparación

Desde raíz con Node/npm disponibles:

```powershell
npm ci
npm run test
npx tsc --noEmit
npm run dev
```

Usar URL local indicada por Wrangler y `/health` y `/es/health`. Datos sintéticos y almacenamiento local aislado; nunca credenciales de producción. Seguir guías existentes para configurar secreto local y confirmar revelación. Pruebas privadas con READ_PUBLIC=false; no mostrar secreto en capturas.

## Datos sintéticos

Tras confirmar configuración, ajustar puerto y enviar datos por contratos actuales:

```powershell
$localBase = 'http://localhost:8787'
$localSecret = Read-Host 'Secreto de instalación local'
$localHeaders = @{ 'api-secret' = $localSecret }
$readingBody = @{ sgv = 123; date = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); direction = 'Flat'; type = 'sgv' } | ConvertTo-Json
Invoke-RestMethod -Uri "$localBase/api/v1/entries" -Method Post -Headers $localHeaders -ContentType 'application/json' -Body $readingBody | Out-Null
$treatmentBody = @{ eventType = 'Correction Bolus'; created_at = [DateTimeOffset]::UtcNow.ToString('o'); insulin = 1.0; notes = 'Dato sintético para revisión.' } | ConvertTo-Json
Invoke-RestMethod -Uri "$localBase/api/v1/treatments" -Method Post -Headers $localHeaders -ContentType 'application/json' -Body $treatmentBody | Out-Null
```

Usar autenticación existente para páginas privadas; no capturar URL con secreto. Escenarios vacíos/futuros mediante fixtures de tests o instancia local aislada; no borrar instalaciones ajenas.

## Escenarios

1. Orden según [contrato](contracts/health-page.md), visual y semántico; excepción de configuración.
2. Medir a 360 × 800 que borde inferior del resumen del tratamiento cabe junto a lectura y actualidad. Repetir ES/EN, estados vacíos y tipos largos. Guardar capturas sintéticas en docs/images/.
3. Revisar 768/1440 px, notas extensas y nombres largos sin desbordamiento; zoom 200 % sin pérdida. Notas completas accesibles antes de recepción.
4. Details inicialmente cerrado. Resumen/avisos visibles. Abrir/cerrar con ratón, Enter y espacio. Revisar antiguo, futuro, rechazos/saturación y diagnóstico ausente mediante fixtures.
5. Abrir details, desplazar, enfocar summary; esperar más de un intervalo configurado. Verificar actualización, apertura, foco y posición. Repetir con enlaces secundarios, cerrado, distinta altura, registro corrupto y control desaparecido. Registro se consume; visita nueva cerrada.
6. Bloquear sessionStorage: fallback de historial conserva continuidad. Bloquear también historial: no excepción ni pérdida de acceso; documentar limitación. Inspeccionar que no se guardan datos médicos, HTML, notas, secretos o URL completas.
7. Configuración: sesión autorizada revela hasta confirmar; otra sesión y visita posterior no revelan; no temporizador durante configuración. Acceso privado sin credencial rechazado. Integración con SELF.fetch y reset de estado existente.
8. Tab, foco visible, nombres y orden asistido. Medir contraste de cada texto/fondo (4,5:1 normal, 3:1 grande), incluidos estados/enlaces. Aviso informativo visible sin details.
9. Escape de tipo, notas y dirección con texto sintético `<script>marker</script>` sin ejecución en ambos idiomas.
10. Evaluación con al menos cinco personas sin conocimientos de infraestructura: ≥80 % identifica lectura/actualidad en ≤10 segundos y ≥80 % puntúa claridad/facilidad 4–5 sobre 5. Registrar resultados reales; si faltan participantes, SC-001/005 pendientes.

## Cierre

Tras implementar ejecutar npm run test y npx tsc --noEmit. Añadir npm run cf:deploy:dry si cambian bindings, migraciones o configuración; no publicar con esta guía. Actualizar README.md y README.es.md sobre jerarquía y desplegable, manteniendo exposición READ_PUBLIC=true. Registrar capturas, resultados, limitaciones, impacto de datos nulo y compatibilidad. La revisión técnica no sustituye evaluación de usabilidad.
