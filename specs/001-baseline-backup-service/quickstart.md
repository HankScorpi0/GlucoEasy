# Phase 1: Guía de validación

Guía para instalación local con datos sintéticos, no registro de ejecución.

## Preparación

Node 22.x y npm en PATH satisfacen engines observados del lockfile. Desde raíz del repositorio:

```powershell
node --version
npm --version
npm ci
npm run test
npx tsc --noEmit
npm run cf:deploy:dry
```

Esperado: instalación reproducible, suite satisfactoria, tipos sin errores y bundle sin publicar. Esta entrega documental solo exige coherencia y enlaces; cambios funcionales requieren tests y tipos, y cambios de bindings/migraciones/despliegue requieren dry-run. No registrar éxito sin ejecución.

Pruebas existentes usan `SELF.fetch` y `reset()`; [evidence.md](evidence.md) distingue cobertura pendiente. Tests usan lectura privada, Wrangler distribuye lectura pública.

## Validación local de extremo a extremo

Crear `.dev.vars` local con `API_SECRET=local-synthetic-secret`, sin credenciales reales ni añadirlo a Git, y arrancar:

```powershell
npm run dev
```

Abrir URL indicada por Wrangler en `/health` y `/es/health`. En otra terminal ajustar puerto y ejecutar:

```powershell
$baseUrl = "http://localhost:8787"
$headers = @{ "api-secret" = "local-synthetic-secret" }
$nowMillis = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$entryBody = @{ _id = "baseline-reading"; sgv = 123; date = $nowMillis; direction = "Flat" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/entries.json" -Headers $headers -ContentType "application/json" -Body $entryBody
Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/entries.json" -Headers $headers -ContentType "application/json" -Body $entryBody
Invoke-RestMethod -Uri "$baseUrl/api/v1/entries/current.json" -Headers $headers
$treatmentBody = @{ _id = "baseline-treatment"; created_at = [DateTimeOffset]::UtcNow.ToString("o"); eventType = "Note"; notes = "Synthetic baseline check"; insulin = 1 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/treatments.json" -Headers $headers -ContentType "application/json" -Body $treatmentBody
Invoke-RestMethod -Uri "$baseUrl/api/v1/treatments.json" -Headers $headers
$profileBody = @{ defaultProfile = "Synthetic"; store = @{ Synthetic = @{ units = "mg/dl" } } } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/profile.json" -Headers $headers -ContentType "application/json" -Body $profileBody
Invoke-RestMethod -Uri "$baseUrl/api/v1/profile/current.json" -Headers $headers
Invoke-RestMethod -Method Delete -Uri "$baseUrl/api/v1/treatments/baseline-treatment" -Headers $headers
Invoke-RestMethod -Method Delete -Uri "$baseUrl/api/v1/treatments/baseline-treatment" -Headers $headers
```

Esperado sobre almacenamiento local vacío: ambos POST de lectura indican `stored=1`, segundo conserva `total=1`; consulta actual contiene valor 123. Tratamiento reciente aparece y perfil coincide. Borrados indican `status=ok`, primero `deleted=true`, después `deleted=false`.

Antes del borrado, verificar mismos datos en ambos idiomas. Añadir segunda lectura distinta para delta. La prueba de ventana de 24 horas utiliza fechas controladas; no se afirma cobertura del umbral de antigüedad.

## Escenarios adicionales

- POST sin credencial o incorrecta: 401 con secreto configurado; 503 antes de configurar cualquier secreto.
- Añadir `READ_PUBLIC=false` en `.dev.vars` y reiniciar: lecturas, tratamientos, perfil, status y páginas requieren credencial. Basic Auth puede comprobarse desde un cliente local; no registrar secretos reales en URLs.
- Configurar `MAX_ENTRIES=2` en entorno aislado y enviar tres registros diferentes por colección: conservar los dos más recientes. Cambiar límite no trunca hasta escribir.
- Enviar segundo perfil por POST/PUT: recuperar solo el último.
- Bootstrap sin secreto manual: ejecutar escenario de `test/api.test.ts` que inicializa y confirma setup; después no aparece el secreto. Cookie `Secure` puede afectar comprobación manual sobre HTTP local. Secreto manual y sesiones ajenas requieren cobertura adicional según GAP-005.

Formatos y reglas: [contracts/README.md](contracts/README.md), [data-model.md](data-model.md). Estos ejemplos no sirven para decisiones de tratamiento.
