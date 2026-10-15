# Implementation Plan: Rediseño integral con identidad técnica

**Branch**: `004-technical-ui-redesign` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)

**Input**: `specs/004-technical-ui-redesign/spec.md`, con tema siempre oscuro confirmado.

## Summary

Renovar integralmente la página de estado con identidad de consola operativa: base grafito, acentos fríos, cifras monoespaciadas, campos alineados, secciones compactas y controles definidos. Conservar módulos, campos, orden lectura → tratamiento → recepción → servicio y prioridad temporal de configuración.

La implementación se concentra en HTML, CSS y textos de `src/health.ts`, preservando firma, modelo y scripts existentes. Primero se producirá una propuesta representativa móvil/escritorio y se registrará SC-001; después se completarán estados, pruebas y documentación. Sin nuevas dependencias, peticiones ni cambios en almacenamiento. Esta fase entrega diseño técnico, no modifica la aplicación ni acredita evaluaciones futuras.

## Technical Context

**Language/Version**: TypeScript estricto, target ES2022; TypeScript 6.0.3 observado en lockfile. HTML semántico, CSS y JavaScript incorporados en el renderizador actual.

**Primary Dependencies**: Cloudflare Workers/Durable Objects, Wrangler 4.99.0, Vitest 4.1.8 según lockfile y `@cloudflare/vitest-pool-workers` existente. Sin incorporaciones ni actualizaciones.

**Storage**: Durable Object existente sin cambios de identidad, esquema, claves, colecciones ni retención. Registro temporal de presentación existente en navegador, sin datos de salud ni credenciales.

**Testing**: Vitest, pool Workers y `SELF.fetch`; arnés existente del script de refresco. Navegador real para geometría, contraste, teclado, texto ampliado, recarga y preferencias de apariencia. Evaluación humana para SC-001/SC-002.

**Target Platform**: Worker Cloudflare y navegadores de escritorio/móvil con CSS Grid y controles nativos de detalles. Datos y desplegables utilizables sin JavaScript; fechas localizadas y refresco mantienen su dependencia actual de JavaScript.

**Project Type**: Servicio web con página HTML renderizada en servidor; diseño único bilingüe.

**Performance Goals**: No añadir peticiones por visita/refresco, fuentes ni activos remotos. Conservar refresco configurado de 30 segundos por defecto, mínimo efectivo de 5 segundos y pausa durante configuración. Comparar tamaño HTML antes/después con la misma fixture e investigar crecimiento por decoración o duplicación, sin inventar un SLA.

**Constraints**: Oscuro fijo sin selector; contraste 4,5:1 normal y 3:1 grande/controles; texto 200 % sin pérdida; anchos 360/768/1440 y resumen esencial visible a 360 × 800. Sin animaciones continuas, datos nuevos, interpretación clínica, cambios de API/autenticación ni migraciones. Aviso informativo y documentación bilingüe de exposición pública conservados.

**Scale/Scope**: Una instalación por Durable Object, dos idiomas, estados existentes de consulta/configuración; retención 2000 por colección y límite de cuerpo 256 KiB conservados. Presentación, pruebas afectadas y documentación.

**Environment Readiness**: `node` y `npm` no se resuelven en el PATH de esta sesión. Antes de implementar, preparar un runtime compatible con motores del lockfile (Node 22.12 o posterior compatible) y comprobar `node --version` y `npm --version`. No bloquea estos documentos.

## Constitution Check

*GATE: PASS antes de Phase 0 y después de Phase 1. Valida el diseño, no acredita la futura implementación.*

| Principio | Medida de diseño y validación | Antes | Después |
|---|---|---|---|
| I. Respaldo informativo | Aviso junto a lectura; ninguna recomendación ni garantía clínica | PASS | PASS |
| II. Compatibilidad | Mismos métodos, rutas, payloads y autenticación; suite existente | PASS | PASS |
| III. Integridad | Selección y evaluación reutilizadas; ausencia/futuro/antigüedad explícitos; sin migración | PASS | PASS |
| IV. Credenciales | Acceso previo al render, revelación limitada, escape y registro UI mínimo | PASS | PASS |
| V. Simplicidad | Sin servicios ni dependencias nuevos; pruebas/tipos, revisión bilingüe y evidencia humana | PASS | PASS |

Sin excepciones requeridas. Si implementar exige cambiar datos, acceso o infraestructura, revisar alcance y control antes de hacerlo.

## Project Structure

### Documentation (this feature)

```text
specs/004-technical-ui-redesign/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── health-page.md
│   └── visual-design.md
└── checklists/requirements.md
```

`tasks.md` corresponde a `$speckit-tasks`. Capturas y resultados se crearán en implementación; no se generan resultados simulados.

### Source Code (repository root)

```text
src/
├── health.ts                 # HTML, CSS y textos: objetivo principal
├── types.ts                  # HealthViewModel conservado
├── reception.ts              # evaluación reutilizada
├── index.ts                  # rutas/acceso conservados
└── durable-object.ts         # persistencia conservada
test/
├── health.test.ts
└── api.test.ts
docs/images/
├── 003-redesign-homepage/     # referencia histórica
└── 004-technical-ui-redesign/ # futuras capturas sintéticas
README.md
README.es.md
README.technical.md
README.technical.es.md
```

**Structure Decision**: Mantener proyecto único; reemplazar estilos y reorganizar marcado de `health.ts`. Extraer funciones locales si reducen repetición, sin mezclar diseño con normalización, evaluación o almacenamiento. Actualizar guías técnicas solo si contienen referencias afectadas.

## Phase 0 — Research

Completada en [research.md](research.md), con decisiones, motivos y alternativas sobre arquitectura, composición, compactación, continuidad, recursos y validación. La revisión delegada confirma cobertura reutilizable y necesidad de evidencia nueva. Sin incógnitas técnicas bloqueantes.

## Phase 1 — Design and Contracts

- [data-model.md](data-model.md): modelos existentes y estado efímero; sin nuevas entidades persistentes.
- [contracts/health-page.md](contracts/health-page.md): rutas, DOM funcional, campos e interacciones.
- [contracts/visual-design.md](contracts/visual-design.md): composición, tipografía, paleta inicial y matriz de revisión.
- [quickstart.md](quickstart.md): preparación y validación reproducible con datos sintéticos.

## Implementation Sequence

1. Preparar entorno y referencia móvil/escritorio con la misma fixture sintética; registrar viewport, idioma, fecha, tamaño HTML y peticiones. Conservar capturas históricas.
2. Construir desde el renderizador real una propuesta con cabecera, lectura, tratamiento y recepción. Renovar composición y sistema completo de estilos; mantener aviso, datos, enlaces, orden e IDs funcionales. No introducir métricas de demostración en producción.
3. Medir móvil/escritorio y presentar la propuesta concreta al responsable. Registrar SC-001: carácter técnico y atractivo ≥4/5 y percepción de cambio integral. Incorporar ajustes antes de extender el diseño a todos los estados. Esta revisión corresponde al resultado concreto durante implementación y no exige aprobación adicional para redactar el plan.
4. Extender a vacío, antiguo, futuro, diagnóstico ausente, rechazos/saturación y configuración, en ambos idiomas. Completar todos los fondos, código, botones, avisos, enlaces y foco. Conservar reglas y datos.
5. Ajustar pruebas de marcado solo donde cambie legítimamente la estructura; preservar pruebas de comportamiento. Revisar teclado, 200 %, preferencias clara/oscura, sin JavaScript y recarga real. Evitar snapshots completos o pruebas que solo repitan valores CSS.
6. Ejecutar suite y tipos; producir capturas finales, actualizar documentación y evaluar cinco participantes. Registrar por separado resultados técnicos y SC-001/SC-002; sin participantes o valoración, esos criterios permanecen pendientes.

## Validation and Risks

| Requisitos | Evidencia |
|---|---|
| FR-001–FR-003/014; SC-001 | Comparativa misma fixture, capturas representativas y valoración real del responsable |
| FR-004–FR-006/010/012; SC-002/003 | Orden, campos y estados en pruebas/navegador; evaluación humana |
| FR-007/008; SC-004/005 | Geometría real, contraste calculado, teclado y 200 % |
| FR-009; SC-006 | Arnés existente y recarga real con mecanismos de continuidad bloqueados |
| FR-011/013; SC-003 | Integración de configuración/acceso, escape y diff sin cambios en contratos/datos |

- Al implementar: `npm run test` y `npx tsc --noEmit`. Dry deploy obligatorio si cambian configuración, bindings o migraciones; no previstos. No publicar como parte de esta guía.
- Una paleta parcial puede dejar superficies claras en configuración/código/avisos: auditar todo el bloque CSS, incluidos estados y foco.
- Monoespaciado y traducciones pueden desplazar el tratamiento: medir y ajustar retícula/espaciado sin recortar campos ni reducir legibilidad.
- Los IDs participan en restauración de foco: preservarlos; comprobar recarga tras localización de fechas y scroll acotado.
- No modificar umbrales ni significado de tonos existentes, ni confundir disponibilidad y actualidad.
- La respuesta A confirma el tema; no acredita SC-001/SC-002. No copiar resultados de 003.
- Cierre: registrar comandos/resultados, matriz de vistas, contrastes, capturas, revisión humana, limitaciones, compatibilidad e impacto nulo en datos. Mantener degradación documentada cuando se bloquean almacenamiento e historial.
- Planificación exclusivamente documental: revisar coherencia y enlaces; no requiere ejecutar pruebas de aplicación.

## Complexity Tracking

Sin violaciones constitucionales, excepciones ni capas adicionales.
