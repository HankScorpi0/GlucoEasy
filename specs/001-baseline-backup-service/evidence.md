# Evidencias y brechas de la base

Revisión estática del commit `728af291c77c9cabd8396d8335b92181cea00564`, 2026-10-04. No se ejecutó la suite para esta entrega documental. «Prueba existente» indica un escenario presente en el repositorio, no un resultado ejecutado ni cobertura exhaustiva.

| Requisitos | Evidencia de código | Pruebas existentes |
| --- | --- | --- |
| FR-001, FR-002 | `src/index.ts`, `src/durable-object.ts` | `test/api.test.ts`: inicialización y revelación, página española |
| FR-003, FR-004 | `src/auth.ts`, `src/index.ts` | `test/auth.test.ts`: secreto directo, SHA-1, Basic Auth, lectura privada/pública; `test/api.test.ts`: rechazo de POST y SHA-1 |
| FR-005–FR-007 | `src/entries.ts`, `src/durable-object.ts` | `test/entries.test.ts`: normalización, atributos, deduplicación, retención y filtros; `test/api.test.ts`: envío individual/lote, última y filtros |
| FR-008–FR-011 | `src/treatments.ts`, `src/durable-object.ts` | `test/treatments.test.ts`: normalización, identidad, filtros y ventana; `test/api.test.ts`: almacenamiento, ventana y borrado idempotente |
| FR-012 | `src/index.ts`, `src/durable-object.ts` | `test/api.test.ts`: perfil actual y escrituras |
| FR-013, FR-014 | `src/health.ts`, `src/durable-object.ts` | `test/api.test.ts`: página, delta, insulina y español; umbral de antigüedad inspeccionado en código |
| FR-015, FR-016 | `src/index.ts`, `src/auth.ts`, `src/entries.ts`, `wrangler.jsonc` | `test/api.test.ts`: estado y compatibilidad; `test/auth.test.ts`: OPTIONS; `test/entries.test.ts`: retención por defecto |

## Brechas detectadas que requieren trabajo futuro

Estas observaciones no se incorporan como correcciones ya implementadas. Antes de corregirlas deben especificarse el comportamiento deseado y los criterios de aceptación en una feature nueva. La constitución no queda modificada ni se aprueba una excepción con este documento.

| ID | Observación estática | Impacto y seguimiento propuesto |
| --- | --- | --- |
| GAP-001 | `src/health.ts` interpola dirección desconocida, tipo y notas de tratamiento sin escape HTML. | Divergencia con principio IV. Especificar escape de contenido externo y pruebas de regresión en ambos idiomas. |
| GAP-002 | `Number(rawSgv)` acepta `null`, cadena vacía y booleanos como valores de glucosa. | Divergencia con principio III para datos ausentes/inválidos. Especificar tipos admitidos y rechazo sin alterar contratos válidos. |
| GAP-003 | La página de estado no contiene un aviso explícito de uso no médico/no dosificación. | Divergencia con principio I. Añadir aviso bilingüe mediante feature con aceptación visual. |
| GAP-004 | Los errores de parseo se devuelven y registran mediante `error.message`; algunos motores pueden incluir fragmentos del JSON recibido. | Riesgo frente al principio IV, pendiente de reproducción. Definir errores públicos estables y evitar fragmentos de datos en logs. |
| GAP-005 | Las pruebas de autenticación privada son de helpers; no hay escenarios completos de todas las rutas privadas, secreto manual y visitantes ajenos a la sesión inicial. | Cobertura no demostrada. Planificar contratos de integración para acceso, precedencia y revelación. |
| GAP-006 | CORS no anuncia DELETE pese al borrado implementado. | Clientes de navegador pueden fallar en preflight. Definir compatibilidad esperada y prueba de OPTIONS. |
| GAP-007 | El perfil se almacena sin validación estructural; se accede después a `defaultProfile` y `store` para log. | Payloads inesperados pueden almacenarse antes de responder con error o romper presentación/consumidores. Especificar validación y atomicidad del rechazo. |
| GAP-008 | No se comprueban exhaustivamente en pruebas límites de cuerpo, lotes inválidos, umbral de antigüedad, alias de borrado y configuración fraccionaria. | No se afirma cumplimiento verificado de todos los límites. Priorizar pruebas al tocar esos contratos. |

## Impacto de esta entrega

Solo se incorporan artefactos documentales. No cambia la identidad de almacenamiento, las claves, la configuración de despliegue ni los datos existentes; no requiere migración. No se marcan tareas de implementación retrospectivas como completadas.
