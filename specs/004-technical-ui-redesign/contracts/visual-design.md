# Contract: Dirección visual y revisión

## Composición

Consola operativa compacta, sin comandos, logs o métricas inventados ni navegación nueva. Renovar relación entre cabecera, títulos, cifras, metadatos, superficies y controles, conservando módulos/datos.

- Cabecera breve con marca reconocible y disponibilidad expresada como estado del servidor, separada de recepción reciente. Evitar rótulos redundantes.
- Cuerpo centrado, ancho máximo inicial aproximado de 960 px; secciones verticales con divisores y retícula interna. No poner recepción antes del tratamiento mediante columnas.
- Lectura dominante: cifra monoespaciada, unidad/dirección próximas, variación identificable y antigüedad explícita; aviso informativo en esta zona.
- Tratamiento segundo con resumen compacto, después notas completas. Recepción con resumen/avisos visibles y detalle desplegable.
- Servicio y enlaces cierran con menor énfasis y legibilidad conservada.

## Tipografía, espacios y controles

- Base inicial 16 px, pila local de sistema para prosa. Valores/metadatos: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace y cifras tabulares. Sin fuentes remotas.
- Espacios iniciales 4/8/12/16/24/32 px, separación mediante alineación y divisores; sin superficies anidadas decorativas.
- Radios contenidos de 0–8 px, bordes definidos y sombras mínimas. Cambiar composición además de fondo de tarjetas.
- Valores adaptables; unidades/etiquetas legibles. Evitar párrafos largos en mayúsculas o monoespaciado por estética.
- Enlaces, `summary` y botón reconocibles, nombres localizados, hover/foco distinguibles. No quitar indicador de apertura sin sustitución accesible.
- Contorno de foco visible en todas las superficies; sin animaciones continuas, parpadeo ni simulación de conexión en vivo.

## Paleta inicial por función

Candidatos para primera propuesta, pendientes de medir sobre combinaciones reales; pueden ajustarse conservando el tema confirmado.

| Función | Candidato | Uso |
|---|---|---|
| Fondo | `#0d1117` | Documento |
| Superficie | `#161b22` | Secciones |
| Elevación | `#1f2937` | Detalles/configuración/controles según composición |
| Texto | `#e6edf3` | Valores/títulos |
| Secundario | `#9da7b3` | Etiquetas/ayuda |
| Acento frío | `#79c0ff` | Enlaces/marca |
| Positivo existente | `#7ee787` | Tonos actuales sin nuevo significado clínico |
| Aviso | `#e3b341` | Advertencias con texto |
| Límite de control | `#64748b` | Bordes necesarios para identificar controles |

Variables por función, sin fondos claros residuales en código, botones, configuración, avisos o pie. `color-scheme: dark`, sin rama clara por preferencia del sistema. Medir FR-008 también en hover/foco; no acreditar contraste solo por la existencia de tokens.

## Matriz de revisión

| Vista/estado | Criterio |
|---|---|
| 360 × 800, texto predeterminado | Lectura/actualidad/resumen de tratamiento o vacíos visibles inicialmente; sin scroll horizontal |
| 768/1440 | Alineación, ancho aprovechable y misma jerarquía |
| Texto 200 % | Sin pérdida ni superposición; admite más altura |
| Dispositivo claro/oscuro | Mismo tema oscuro, sin selector |
| ES/EN | Mismos datos y acciones sin recorte por traducción |
| Reciente/antiguo/vacío/futuro | Estado textual y disponibilidad separada |
| Diagnóstico ausente/rechazos/saturación | Avisos fuera del detalle |
| Textos y conexión extensos | Reflujo o resumen con acceso íntegro |
| Configuración autorizada/otra sesión/confirmada | Tema uniforme con acceso y revelación existentes |

Presupuesto móvil inicial: cabecera ≤56 px, lectura con aviso ≤240 px, resumen de tratamiento ≤180 px. Son objetivos de ajuste, no alturas fijas ni permiso para recortar contenido. Medir borde inferior del resumen en viewport real. No se exige mostrar notas completas inicialmente; ampliación y acceso completo prevalecen sobre compactación.

## Evaluación y entrega

Primera propuesta desde renderizador real, misma fixture que referencia, móvil/escritorio, antes de extender a todos los estados. Registrar SC-001 con valoración real del responsable: carácter técnico y atractivo ≥4/5 y percepción de cambio integral. Confirmar tema no equivale a aceptar ejecución visual.

Capturas finales: `health-es-mobile.png`, `health-en-mobile.png`, `health-es-desktop.png`, `health-en-desktop.png` en `docs/images/004-technical-ui-redesign/`. Mantener histórico 003; actualizar referencias afectadas en guías, incluidas imágenes de recepción obsoletas. Datos sintéticos y ninguna credencial o URL con secreto en capturas. Revisar configuración con fixtures y ocultar credenciales antes de guardar evidencia.
