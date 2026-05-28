# Sistema de Diseño de SendIO

Este documento define el sistema de diseño visual y de componentes de SendIO a partir del frontend Angular existente. A diferencia del wireframe, aquí sí se documentan tokens, componentes, estados visuales y reglas de implementación.

## Fuente de Verdad

| Fuente | Uso en sistema de diseño |
|--------|--------------------------|
| `frontend/src/styles.css` | Paleta PrimeNG Aura Emerald, superficies, modo oscuro, sombras y animaciones. |
| `frontend/src/app/features/app/app-layout.component.html` | Layout base, sidebar, navegación, topbar y controles globales. |
| `frontend/src/app/features/auth/login/login-page.component.html` | Patrón auth, card central, gradiente principal y controles globales. |
| `frontend/src/app/features/app/workspace-home-page.component.html` | Cards métricas, gráficas, sparkline y composición de dashboard. |
| `frontend/src/app/features/templates/*` | Tabla de plantillas, estados, editor drag-and-drop y affordances de edición. |
| `frontend/src/app/features/contacts/*` | Dropzone, banners, tablas de incidencias y resumen de importación. |
| `frontend/src/app/features/campaigns/*` | Formularios, tablas, tags de estado y métricas de campaña. |
| `frontend/src/app/features/workspaces/*` | Gestión de roles, invitaciones y acciones condicionadas por permiso. |

## Tokens Base

| Token | Valor | Uso |
|-------|-------|-----|
| `--p-primary-50` | `#ecfdf5` | Fondos suaves de éxito o marca. |
| `--p-primary-500` | `#10b981` | Marca, éxito, logo y gradiente principal. |
| `--p-primary-600` | `#059669` | Acción primaria y navegación activa. |
| `--p-primary-700` | `#047857` | Hover de acción primaria. |
| `--p-surface-0` | `#ffffff` | Cards, formularios y superficies elevadas. |
| `--p-surface-50` | `#f8fafc` | Fondo principal claro. |
| `--p-surface-100` | `#f1f5f9` | Fondos secundarios y controles suaves. |
| `--p-surface-200` | `#e2e8f0` | Bordes sutiles. |
| `--p-surface-400` | `#94a3b8` | Texto secundario y líneas de gráficas. |
| `--p-surface-500` | `#64748b` | Texto muted. |
| `--p-surface-800` | `#1e293b` | Superficies oscuras internas. |
| `--p-surface-900` | `#0f172a` | Sidebar y topbar dark. |
| `--p-surface-950` | `#020617` | Fondo base dark mode. |

## Tipografía

| Uso | Regla |
|-----|-------|
| Fuente base | `Inter`, con fallback `Segoe UI`, `sans-serif`. |
| Títulos de página | `text-3xl`, peso ligero, color slate alto contraste. |
| Títulos de sección | Peso semibold o bold, tamaño medio. |
| Labels | Texto pequeño, semibold, uppercase cuando marca categoría. |
| Datos métricos | Tamaño grande, peso bold, tracking compacto. |
| Texto auxiliar | Slate muted, tamaño `text-sm` o `text-xs`. |

## Componentes Base

| Componente | Implementación actual | Regla de diseño |
|------------|----------------------|-----------------|
| Button primario | PrimeNG `p-button` o botón Tailwind en editor | Una acción primaria por pantalla o sección. |
| Button secundario | `severity="secondary"`, `text` o borde sutil | Acciones de apoyo, reset, view, back. |
| Button destructivo | `severity="danger"` o texto rose | Eliminar, revocar o remover. |
| Input | PrimeNG `pInputText` | Label visible y validación cercana. |
| Select | PrimeNG `p-select` | Workspace, plantilla, versión y rol. |
| SelectButton | PrimeNG `p-selectbutton` | Segmentos cortos: idioma, rango, modo o vista. |
| ToggleSwitch | PrimeNG `p-toggleswitch` | Dark mode. |
| Card | PrimeNG `p-card` o contenedor Tailwind | Agrupa un propósito único. |
| Table | PrimeNG `p-table` | Datos de entidades con columna de acción al final. |
| Tag | PrimeNG `p-tag` | Estados y roles. |
| Dialog | `generic-dialog` | Confirmaciones, creación y errores. |
| Dropzone | Contenedor Tailwind con borde dashed | Importación CSV. |
| Editor cell | Grid editable con CDK drag-drop | Una celda contiene como máximo un componente principal. |

## Estados Visuales

| Estado | Color / patrón | Uso |
|--------|----------------|-----|
| Success | Emerald | Importación limpia, publicado, enviado. |
| Warning | Amber | Draft, incidencias, read-only, envío pendiente. |
| Error | Rose | Validación, fallo de carga, eliminación o envío fallido. |
| Info | Slate/Indigo | Ayuda, editor, selección y acciones no destructivas. |
| Disabled | Opacidad reducida | Plantilla publicada, carga activa o permisos insuficientes. |

## Layout Global

### Auth

La experiencia de autenticación usa una card central sobre fondo `slate-50` o `slate-950` en dark mode. El header mantiene marca, selector de idioma y toggle de tema.

### App Shell

El layout autenticado se compone de:

- Sidebar fija con fondo `slate-900`.
- Logo `S` y nombre SendIO.
- Selector de workspace.
- Navegación vertical.
- Resumen de usuario.
- Topbar con toggle sidebar, búsqueda, idioma, tema y logout.
- Main area con fondo `slate-50` y footer.

### Editor de Plantillas

El editor usa una composición distinta por necesidad funcional:

- Toolbar superior con volver, título, versión, vista y acciones.
- Banner de read-only cuando la versión está publicada.
- Panel lateral izquierdo con secciones, variables y creación de componentes.
- Canvas central para maquetación del email.
- Vista alternativa de código HTML.

## Reglas de Uso

- Usar TailwindCSS utilities por defecto.
- Usar PrimeNG mediante selectores de componente cuando estén disponibles.
- Mantener soporte `en` y `es` para todo texto visible.
- No introducir colores fuera de los tokens salvo que se documenten.
- Mantener contraste WCAG AA en texto e interacciones.
- No mezclar estados semánticos: error es rose, warning es amber, success es emerald.
- Las tablas deben mantener acciones alineadas a la derecha.
- Las acciones destructivas deben ser visualmente distinguibles.
- En páginas con workspace, el contexto activo debe permanecer visible o derivado del shell.

## Relación con el Wireframe

El wireframe se documenta en `wireframe.md` y debe validarse antes de aplicar el sistema visual. Primero se acuerda la estructura; después se aplica este sistema de diseño.

## Criterios de Aceptación

- Los tokens principales están trazados a `frontend/src/styles.css`.
- Los componentes documentados existen o tienen equivalente en el frontend actual.
- Los estados visuales son consistentes con importación, campañas, plantillas y miembros.
- La guía separa estructura de pantalla y diseño visual.
- La documentación queda enlazada desde `docs/design/README.md`.
