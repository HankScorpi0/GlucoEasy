# Contratos observados de la base

Complemento técnico de [spec.md](spec.md), obtenido del código local. Estos detalles describen interoperabilidad observable, no un plan de implementación nuevo.

## Rutas

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/` | Redirección 302 a `/health` |
| GET | `/health`, `/es/health` | Estado y configuración en inglés o español |
| POST | `/setup/acknowledge`, `/es/setup/acknowledge` | Confirmación mediante cookie de revelación; 303 al estado o 403 sin sesión válida |
| GET | `/api/v1`, `/api/v1/` | Identificación y enlaces, sin autenticación |
| GET | `/api/v1/status.json` | Estado, nombre, versión, hora del servidor, indicador de API y resumen de lecturas |
| GET, POST | `/api/v1/entries[.json]` | Colección de lecturas o recepción |
| GET | `/api/v1/entries/sgv[.json]` | Lecturas de tipo `sgv` |
| GET | `/api/v1/entries/current[.json]` | Colección de cero o una lectura |
| GET, POST | `/api/v1/treatments[.json]` | Colección de tratamientos o recepción |
| DELETE | `/api/v1/treatments/:id[.json]` | `{status:"ok", deleted:boolean, _id:id}` |
| GET | `/api/v1/profile/current[.json]` | Perfil actual o `{}` |
| GET, POST, PUT | `/api/v1/profile[.json]` | Colección de cero o un perfil; escritura devuelve el documento recibido |
| GET | `/api/v1/devicestatus[.json]` | `[]`, sin almacenamiento de estado de dispositivos |
| OPTIONS | Cualquier ruta | 204 con cabeceras CORS |

`[.json]` significa dos rutas admitidas. No hay alias `/api/v1/status` implementado. La condición de `status.json` no restringe el método: salvo OPTIONS, también responde a otros métodos. La redirección de `/` tampoco restringe método. Rutas o métodos no atendidos devuelven 404.

Las respuestas de recepción de lecturas y tratamientos son `{stored, total}`: `stored` cuenta los objetos normalizados recibidos, incluidos duplicados; `total` cuenta los conservados después de combinar y truncar. Las operaciones satisfactorias de datos usan 200. JSON inválido, normalización fallida y exceso de cuerpo usan 400, no 413. Escribir/borrar sin configuración usa 503; credencial incorrecta usa 401.

## Autenticación y configuración

- Precedencia de credencial: cabecera `api-secret`, usuario de Basic Auth y usuario en URL. Una cabecera no vacía incorrecta no se reemplaza por otra fuente válida.
- Se acepta secreto literal o su representación SHA-1 hexadecimal, sin distinguir mayúsculas en el hash. Basic Auth utiliza el usuario, no la contraseña.
- `API_SECRET` manual prevalece sobre el generado persistente.
- El secreto generado tiene seis caracteres del alfabeto `abcdefghjkmnpqrstuvwxyz23456789`. Su token de revelación tiene 24 bytes aleatorios representados en hexadecimal.
- La cookie `glucoeasy_setup` usa `HttpOnly`, `Secure`, `SameSite=Strict`, ruta `/` y duración de una hora. La sesión autorizada puede revisitar el secreto mientras el token persista; confirmar invalida el token y borra la cookie.
- La sesión de revelación permite ver el estado incluso con lectura privada. No sustituye la credencial para escribir datos.
- Lectura pública se habilita solo con el texto `true`, sin distinguir mayúsculas. Antes de disponer de secreto las consultas no exigen autenticación.
- CORS permite origen `*`, cabeceras `Content-Type, api-secret, Authorization` y anuncia `GET, POST, PUT, OPTIONS`, con duración de 86400 segundos. DELETE funciona en el servidor, pero no está anunciado para preflight.

## Lecturas

- Se admite un objeto o array, incluido vacío. Se exige objeto no nulo por elemento.
- `sgv` se convierte con la conversión numérica existente y se exige resultado finito. Esto acepta también `null`, booleanos y cadenas vacías; véase [evidence.md](evidence.md).
- Se toma `date` numérico, texto numérico o fecha interpretable; si no se interpreta se intenta `dateString`. `dateString` se convierte a ISO si es interpretable o se deriva de `date`. Si ambos son interpretables pero distintos, pueden conservar instantes diferentes.
- `_id` no vacío se conserva; en su ausencia se usa el instante como texto. `type` y `device` predeterminados son `sgv` y `xDrip`. Se conservan atributos adicionales.
- Combinación: entrantes antes que existentes; se descarta si ya apareció `_id` o `date`. Se ordena por `date` descendente y se trunca. Dentro de un lote prevalece el primer duplicado.
- `count` predeterminado 10; números positivos finitos se redondean hacia abajo; inválidos o no positivos vuelven a 10. Un positivo menor que uno produce límite cero. No hay máximo explícito de consulta adicional al almacenamiento.
- `find[date][$gte]` y `find[date][$lte]` son inclusivos, admiten instantes o fechas y se ignoran si no se interpretan. `/sgv` restringe `type === "sgv"`; `/current` limita a uno después de filtrar.

## Tratamientos

- Fecha fuente en orden: `created_at`, `mills`, `timestamp`, `date`, `dateString`. Se exige al menos una interpretable y se generan `created_at` ISO y `mills` coherentes.
- Identidad en orden: `_id`, `identifier`, `uuid`, `syncIdentifier`; si ninguna existe se genera `mills:eventType:enteredBy:notes`.
- `eventType` predeterminado vacío; autor y notas vacíos se omiten. `srvCreated` y `srvModified` se normalizan si son fechas textuales válidas o se generan con la hora actual. Los demás campos se preservan sin validación clínica.
- Deduplicación por cualquiera de las identidades anteriores o `created_at:eventType`. Entrantes primero, primer duplicado prevalece; orden por `mills` descendente y truncado.
- Borrado por coincidencia exacta con cualquiera de las cuatro identidades, con decodificación de ruta y retirada del sufijo `.json`; puede eliminar varios registros si comparten un alias.
- Filtros `find[campo]` o `find[campo][operador]`, con `$eq`, `$gte`, `$lte`, `$gt`, `$lt`, combinados por conjunción. Otros operadores se ignoran. Se comparan valores interpretables como números/fechas primero; en otro caso textos. Campos ausentes o nulos no coinciden.
- Cualquier filtro reconocido sobre `mills`, `created_at`, `timestamp`, `date` o `dateString` desactiva la ventana automática, incluso si su valor no es una fecha válida. Sin esos filtros se añade `mills >= ahora - 24 horas`.
- Sin `count` se usa 1000, haya o no filtro temporal. Con `count` explícito se aplica el mismo redondeo que en lecturas, con fallback 10.

## Perfil, retención y presentación

- POST y PUT reemplazan el perfil completo. Solo se comprueba tamaño y sintaxis JSON; no existe validación de estructura. Los documentos mal formados respecto al contrato esperado pueden romper consumidores o el propio manejo de respuesta.
- `MAX_ENTRIES` numérico finito positivo se redondea hacia abajo; en otro caso se usa 2000. Un positivo inferior a uno produce retención cero. Lecturas y tratamientos se limitan independientemente al escribir; cambiar la opción no recorta inmediatamente lo ya persistido.
- `HEALTH_REFRESH_SECONDS` se interpreta como entero; ausente, inválido o inferior a 5 vuelve a 30. El estado reciente usa antigüedad <= máximo de dos refrescos y cinco minutos; fechas futuras también resultan recientes.
- El resumen conserva última y penúltima lectura de cualquier tipo; la página muestra diferencia de valores cuando existen ambas. No muestra una serie histórica ni realiza cálculo de dosis.
- La página selecciona el último tratamiento con `insulin` numérico o texto no vacío; muestra unidades solo para el numérico, y texto de ausencia de insulina para el otro caso.
- Persistencia compartida por instalación. No hay eliminación de lecturas, historial de perfiles, escritura de `devicestatus`, paginación ni otros contratos Nightscout implícitos.
