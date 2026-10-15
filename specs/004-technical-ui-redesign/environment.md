# Entorno de implementación

Fecha: 2026-10-15.

- Runtime existente localizado en `%LOCALAPPDATA%/GlucoEasy/runtime/node-v24.16.0-win-x64/`: Node v24.16.0, npm 11.13.0, coincide con `.nvmrc`.
- Se añade esa carpeta al PATH del proceso de comandos, sin cambios globales ni instalación nueva.
- `npm ci`: correcto, 80 paquetes; lockfile sin cambios. El audit de instalación informa 12 vulnerabilidades de dependencias existentes (1 baja, 2 moderadas, 9 altas); no se han aplicado actualizaciones fuera del alcance visual.
- Referencia `npm run test`: 6 archivos, 85 pruebas correctas.
- Referencia `npx tsc --noEmit`: exit 0.
- Worker local: `npm run dev -- --local --port 8796 --persist-to .wrangler/state/004-ui-validation`, listo en `http://127.0.0.1:8796`. Sin despliegue ni cambios de bindings.
- Vista reproducible del renderizador real con fixtures: servidor local en `http://127.0.0.1:8797/es/health`, sin persistencia, con fecha fija de evaluación. La referencia anterior queda copiada en `.wrangler/004-preview/baseline-health.cjs`, fuera del control de versiones.
- Captura: Chrome instalado y Playwright ya disponible en `.wrangler/reception-qa-tools/`; no se añade dependencia al proyecto. Zona del navegador Europe/Madrid.
- `.gitignore` verificado: Node, compilación, logs, `.wrangler`, variables y temporales cubiertos. Sin herramientas adicionales que exijan nuevos ignores; paquete privado sin publicación npm.

Estas comprobaciones acreditan la referencia, no la versión rediseñada. Las pruebas posteriores se registran separadamente.
