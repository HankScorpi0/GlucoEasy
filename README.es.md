# GlucoEasy

Este proyecto nace de algo muy personal.

Mi hijo debutó con diabetes tipo 1 con solo 2 años. Desde entonces, la tecnología forma parte de nuestro día a día: usa Dexcom G7 junto con Tandem, y aunque el servicio oficial suele funcionar bien, la sensación de quedarte sin acceso justo en el momento en que más lo necesitas pesa mucho cuando detrás de la pantalla está la salud de tu hijo.

GlucoEasy nace precisamente de esa necesidad de tener un respaldo. De saber que, si el servicio oficial falla, sigo teniendo una segunda vía disponible. No sustituye nada: simplemente me da algo que para mí vale muchísimo, tranquilidad.

Además, me permite conectar con aplicaciones más completas dentro del ecosistema de la diabetes, como `Zukkah`, `xDrip+` y también apps de smartwatch, siempre que sean compatibles con Nightscout.

GlucoEasy es un servicio secundario de monitorización de glucosa que puedes desplegar gratis en Cloudflare.

Nace para un caso muy concreto: cuando tu servicio principal o el proveedor oficial falla, tener una segunda opción funcionando te da tranquilidad sin obligarte a mantener una instalación compleja.

GlucoEasy se centra en lo esencial:

- actuar como respaldo cuando tu servicio principal no responde
- seguir funcionando con apps que ya usan Nightscout
- permitirte usar apps como `xDrip+`, `Zukkah` y otras parecidas
- desplegarse de forma muy fácil y gratis en la nube

Versión en inglés: ver [README.md](README.md).  
Guía técnica: ver [README.technical.es.md](README.technical.es.md).

![Pantalla health en español con datos sintéticos](docs/images/003-redesign-homepage/health-es.png)

## Advertencia Importante

- No es un dispositivo médico.
- No debe usarse para dosificación ni decisiones de tratamiento.
- Úsalo solo como respaldo, recuperación o forma sencilla de mantener tus conexiones funcionando.

## Para Quién Es

### Diagnóstico de recepción

Las fechas usan la zona horaria local de tu navegador y muestran su indicación de zona. Con JavaScript desactivado se conserva la fecha ISO en UTC.

Las páginas de estado distinguen disponibilidad del servidor ahora, último envío aceptado (lecturas, tratamientos o perfil) y actualidad de lecturas. Un envío recién aceptado puede contener lecturas antiguas. Una lectura es reciente hasta el mayor entre cinco minutos y dos intervalos de refresco de la página, incluido el límite.

La página muestra primero la última lectura y su antigüedad, después el último tratamiento, la recepción y los enlaces del servicio. En una pantalla móvil de 360 × 800 y con texto predeterminado, la lectura y el resumen del tratamiento (tipo, fecha e insulina cuando exista) se ven sin desplazarse una vez completada la configuración. Las notas completas quedan debajo del resumen del tratamiento. La configuración pendiente tiene prioridad hasta completarse.

El estado y los avisos de recepción permanecen visibles. Abre **Detalles de recepción** para consultar fechas, retrasos y categorías de rechazo; esta sección empieza cerrada. El refresco automático conserva su apertura, tu posición y el foco mediante metadatos temporales de presentación, sin guardar lecturas, tratamientos ni credenciales en el navegador. Si el navegador bloquea tanto el almacenamiento por pestaña como el estado del historial, el refresco sigue funcionando pero no puede conservar ese contexto. El desplegable nativo y los datos mostrados siguen siendo utilizables sin JavaScript; el refresco automático requiere JavaScript.

Fecha y antigüedad de lectura se separan de primera recepción conocida y retraso de recepción. Reenviar datos actualiza el último envío aceptado sin cambiar la primera recepción de esa lectura. La recepción es desconocida para datos anteriores a esta función. Las lecturas futuras siguen almacenadas y disponibles para clientes, pero se excluyen de actualidad y generan aviso de reloj; solo datos futuros se distingue de una instalación vacía.

Los rechazos se cuentan una vez por petición: autenticación/configuración, cuerpo excesivo, formato/validación o fallo interno. Los recuentos se acumulan desde el inicio de observación visible y sobreviven a reinicios ordinarios. Excluyen fallos previos al servicio y fallos que impidan guardar el resumen. Los recuentos extraordinariamente grandes indican «al menos» al alcanzar el límite de precisión numérica. El diagnóstico no conserva cuerpos ni credenciales.

El diagnóstico aparece solo en `/health` y `/es/health`; el estado para clientes no cambia. Con `READ_PUBLIC=true` (predeterminado del despliegue), cualquiera con la URL puede consultar datos de salud y resúmenes. Usa `false` para exigir autenticación después de configurar. La instrumentación añade escrituras y una llamada interna por rechazo; no garantiza gratuidad ni disponibilidad continua. Los errores del parser/almacenamiento usan mensajes genéricos seguros con los códigos y formatos existentes.

![Diagnóstico de recepción con datos sintéticos](docs/images/reception-diagnostics-es-desktop.png)

Este proyecto es para ti si:

- quieres una segunda opción cuando falle el servicio principal
- ya usas `xDrip+`, `Zukkah` o cualquier app que funcione con Nightscout
- buscas algo muy fácil de instalar y mantener
- quieres un despliegue gratis en la nube
- te importan sobre todo las lecturas de glucosa, los bolos y la compatibilidad amplia

## Qué Hace

- Recibe lecturas de glucosa desde `xDrip+`
- Guarda lecturas recientes y tratamientos
- Se entiende con apps que ya estaban pensadas para Nightscout
- Funciona como servicio secundario para apps y herramientas compatibles
- Muestra una página simple de estado en el navegador

## Qué No Hace

- No es Nightscout completo
- No es tu sistema médico principal
- No incluye gráficas, informes ni análisis avanzados

Si necesitas la experiencia completa de Nightscout, Nightscout completo sigue siendo la mejor opción.

## Crear Tu Copia Gratis

La forma más fácil de empezar es pulsar aquí para instalar GlucoEasy gratis.

No hace falta entender qué es Cloudflare ni saber "desplegar" nada: solo sigue las pantallas y al final tendrás tu enlace listo para usar.

<a href="https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2FHankScorpi0%2FGlucoEasy" target="_blank" rel="noopener noreferrer">Instalar GlucoEasy gratis</a>

## Instalación En 3 Pasos

1. Haz clic en `Instalar GlucoEasy gratis` o en el botón de abajo.
2. Sigue las pantallas hasta que termine la instalación.
3. Abre el enlace que se crea para ti, por ejemplo `https://tu-worker.workers.dev/health`.

En la primera visita, GlucoEasy crea automáticamente un código secreto de 6 caracteres y lo muestra una sola vez. Guárdalo en ese momento, porque lo necesitarás en `xDrip+` o en cualquier otra app compatible.

## Guía Detallada De Despliegue

Si es tu primera vez usando Cloudflare Workers, estas son las pantallas y los pasos exactos que deberías seguir:

1. Abre el enlace `Instalar GlucoEasy gratis`.
2. En la pantalla de inicio de sesión de Cloudflare, entra con `Google` si esa es la cuenta que quieres usar.

![Pantalla de inicio de sesión de Cloudflare](docs/images/deploy-step-01-cloudflare-signin.jpeg)

3. En la pantalla `Set up your application`, abre el selector `Git account`.
4. Elige `New GitHub connection`.

![Selector de cuenta Git en Cloudflare](docs/images/deploy-step-02-git-account.jpeg)

![Crear una nueva conexión con GitHub](docs/images/deploy-step-03-new-github-connection.jpeg)

5. Se abrirá GitHub. Inicia sesión allí y, si tu acceso a GitHub usa Google, pulsa `Continue with Google`.
6. Si todavía no tienes cuenta de GitHub, completa el formulario de registro y crea una.
7. Cuando GitHub pida autorizar `Cloudflare Workers and Pages`, acepta con `Install & Authorize`.

![Inicio de sesión en GitHub con Google](docs/images/deploy-step-04-github-google.jpeg)

![Autorización de Google para GitHub](docs/images/deploy-step-05-google-authorize.jpeg)

![Pantalla de registro de GitHub si aún no tienes cuenta](docs/images/deploy-step-06-github-signup.jpeg)

![Instalar y autorizar Cloudflare Workers and Pages](docs/images/deploy-step-07-install-authorize.jpeg)

8. Volverás a Cloudflare. Comprueba que tu cuenta de GitHub ya aparece en `Git account`.
9. Deja los valores del proyecto tal como vienen, salvo que necesites cambiarlos, y después pulsa `Deploy`.

![Cuenta de GitHub conectada y lista para desplegar](docs/images/deploy-step-08-deploy.jpeg)

10. Espera a que termine el registro de despliegue. Al finalizar, Cloudflare mostrará la URL de tu worker, por ejemplo `https://tu-worker.workers.dev`.
11. Abre `https://tu-worker.workers.dev/health`.
12. Guarda el secreto de 6 caracteres que aparece en esa página y también la URL completa para xDrip+, por ejemplo `https://API_SECRET@tu-worker.workers.dev/api/v1/`.

![Despliegue terminado con la URL del worker visible](docs/images/deploy-step-09-worker-url.jpeg)

![Página health mostrando el secreto y la URL para xDrip+](docs/images/deploy-step-10-secret-and-xdrip-url.jpeg)

Si Cloudflare te pide permiso para crear o conectar un repositorio durante la instalación, acéptalo. Esa conexión es la que permite completar correctamente el flujo de instalación con un clic.

## Configurar xDrip+

En `xDrip+`, usa la opción `Nightscout Sync REST API` e introduce:

```text
https://API_SECRET@tu-worker.workers.dev/api/v1/
```

Sustituye:

- `API_SECRET` por tu código secreto de 6 caracteres
- `tu-worker.workers.dev` por el enlace que se creó para ti

Importante:

- mantén `/api/v1/` exactamente como aparece
- no borres la `/` final

## Apps Compatibles

Como GlucoEasy funciona con el formato que usan muchas apps de Nightscout, puedes conectarlo a:

- `xDrip+`
- `Zukkah`
- otras apps o integraciones que ya funcionen con Nightscout

Ese es uno de sus puntos fuertes: no tienes que cambiar toda tu forma de uso, solo añadir un respaldo.

## Cómo Comprobar Que Funciona

Abre esta página en tu navegador:

```text
https://tu-worker.workers.dev/health
```

Página en español:

```text
https://tu-worker.workers.dev/es/health
```

Ejemplo de la pantalla de estado en español:

![Pantalla health en español con datos sintéticos](docs/images/003-redesign-homepage/health-es.png)

Deberías ver:

- la última lectura de glucosa, su dirección cuando exista y su antigüedad
- el resumen del último tratamiento y después sus notas completas, o un estado vacío explícito
- el estado y los avisos de recepción, con detalles técnicos disponibles al abrirlos
- información y enlaces del servicio debajo de los datos principales

También puedes revisar:

```text
https://tu-worker.workers.dev/api/v1/status.json
```

## Si Algo No Funciona

### No Aparecen Datos

- Comprueba que `xDrip+` use la URL completa con `/api/v1/`
- Comprueba que el código secreto sea correcto
- Abre `/health` y revisa si aparecen lecturas recientes

### Error 401

- Lo más probable es que el secreto sea incorrecto
- Usa el mismo secreto de 6 caracteres que viste en la primera configuración

### Has Olvidado El Secreto

- La solución más sencilla suele ser desplegar de nuevo y guardar bien el nuevo secreto
- Los usuarios avanzados pueden cambiarlo manualmente; ver [README.technical.es.md](README.technical.es.md)

### La Página Abre Pero Los Datos Son Antiguos

- Revisa la hora y la zona horaria del teléfono
- GlucoEasy solo conserva las lecturas más recientes

## Licencia

Este proyecto está licenciado bajo MIT. Consulta [LICENSE](LICENSE).
