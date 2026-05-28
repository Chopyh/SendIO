# Wireframe de SendIO

Este documento define el wireframe de baja fidelidad de SendIO a partir del frontend Angular existente. Su objetivo es representar maquetación, jerarquía, navegación, regiones funcionales y estados, sin entrar en el diseño visual final.

## Fuente de Verdad

| Fuente | Uso en wireframe |
|--------|------------------|
| `frontend/src/app/app.routes.ts` | Rutas reales que debe cubrir el wireframe. |
| `frontend/src/app/features/app/app-layout.component.html` | Shell autenticado: sidebar, workspace selector, topbar, búsqueda, idioma, tema y logout. |
| `frontend/src/app/features/app/workspace-home-page.component.html` | Dashboard, métricas, gráfica, actividad y campañas próximas. |
| `frontend/src/app/features/templates/template-editor/template-editor-page.component.html` | Editor drag-and-drop: toolbar, panel lateral, canvas y vista HTML. |
| `frontend/src/app/features/templates/templates-list/templates-list-page.component.ts` | Listado de plantillas, tabla, estados y acciones. |
| `frontend/src/app/features/contacts/*` | Contactos e importación CSV. |
| `frontend/src/app/features/campaigns/*` | Listado, creación y detalle de campañas. |
| `frontend/src/app/features/workspaces/workspace-members-page.component.html` | Miembros, invitaciones y acciones por rol. |

## Criterio de Baja Fidelidad

- Usar escala de grises, cajas, líneas y labels funcionales.
- Representar estructura antes que apariencia.
- Evitar colores de marca, gradientes, sombras, iconografía detallada y estilos finales.
- Mostrar regiones principales: navegación, headers, formularios, tablas, cards, canvas y estados.
- Mantener suficiente texto para entender la intención de cada bloque.
- Separar wireframe de design system: este documento explica la estructura de pantallas; el sistema visual vive en `design-system.md`.

## Pantallas Cubiertas

| Pantalla | Ruta | Estructura obligatoria |
|----------|------|------------------------|
| Login | `/auth/login` | Header con marca, idioma y tema; card central con email, password, errores, submit y enlace de registro; footer legal. |
| Registro | `/auth/register` | Flujo por pasos: cuenta owner, workspace y confirmación. |
| App Shell | `/app/*` | Sidebar, selector de workspace, navegación, usuario, topbar, búsqueda, idioma, tema y logout. |
| Dashboard | `/app` | Header, selector de rango, cuatro métricas, gráfica, actividad reciente y campañas próximas. |
| Plantillas | `/app/templates` | Header con acción, estados loading/empty/table y tabla de plantillas. |
| Editor de Plantillas | `/app/templates/:id/edit` | Toolbar, selector `Design / HTML Code`, acciones, banner read-only, panel lateral y canvas. |
| Importar Contactos | `/app/contacts/import` | Instrucciones CSV, formato requerido, dropzone, archivo seleccionado, errores, progreso, resumen y tablas de incidencias. |
| Contactos | `/app/contacts` | Header, estados loading/error/empty y tabla de contactos. |
| Campañas | `/app/campaigns` | Header con `New campaign`, estados loading/empty y tabla de campañas. |
| Nueva Campaña | `/app/campaigns/new` | Formulario de nombre, plantilla, versión, destinatarios, avisos y acción `Send now`. |
| Detalle de Campaña | `/app/campaigns/:id` | Acción de volver, loading/not found, título, estado y métricas pending/sent/failed. |
| Miembros | `/app/members` | Card principal, invitación owner-only, tabla de miembros, acciones e invitaciones pendientes. |

## Patrones de Maquetación

| Patrón | Uso |
|--------|-----|
| Auth centered card | Login y registro. |
| Sidebar + topbar shell | Todas las páginas autenticadas. |
| Page header | Título, subtítulo y acción primaria opcional. |
| Metric grid | Dashboard y detalle de campaña. |
| Table surface | Contactos, plantillas, campañas, miembros e invitaciones. |
| Form card | Nueva campaña, invitación de miembros y formularios de creación. |
| Split editor | Editor de plantillas con toolbar, panel lateral y canvas. |

## Estados que Deben Aparecer

- `loading`: región de carga o placeholder.
- `empty`: mensaje de ausencia de datos y acción si aplica.
- `error`: banner o bloque de error.
- `success`: resumen o confirmación posterior a una acción.
- `permission`: acciones ocultas o deshabilitadas según rol.

## Criterios de Aceptación

- El `.pen` muestra wireframes en escala de grises.
- Las pantallas coinciden con las rutas reales del frontend Angular.
- Las páginas autenticadas reutilizan el mismo shell estructural.
- El editor muestra claramente toolbar, panel lateral y canvas.
- Las pantallas de datos contemplan estados alternativos.
- El design system no se mezcla en este documento; está documentado por separado.
