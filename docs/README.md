# Documentación de SendIO

Este directorio es la fuente de verdad para la gobernanza del proyecto, las decisiones de arquitectura y el seguimiento de la implementación.

## Índice por Alcance

- [Documentación de Análisis](analysis/README.md)
- [Documentación de Diseño](design/README.md)
- [Índice de Especificaciones de Superpoderes](superpowers/README.md)
- [Índice de Tareas](tasks/README.md)
- [Estándares de Flujo de Trabajo](workflow/standards.md)
- [Contrato de Entorno Docker Mailtrap](devops/docker-mailtrap-env.md)
- [Línea Base de Worker Redis de Cola en Docker](tasks/mvp/infra/chore-docker-redis-queue-worker.md)
- [Línea Base de Observabilidad y Auditoría](devops/observability-audit-baseline.md)

## Secciones Académicas para el TFG (Trabajo Fin de Grado)

- [Diseño del Sistema (TFG)](design/diseno-sistema-tfg.md)
- [Justificación de Tecnologías Utilizadas (TFG)](implementation/tecnologias-tfg.md)
- [Implementación del Proyecto (TFG)](implementation/implementacion-proyecto-tfg.md)
- [Plan de Validación y Pruebas (TFG)](validation/validacion-pruebas-tfg.md)

## Diagramas Detallados de Interacción y Estado

- [Índice de Diagramas de Interacción](analysis/interactions/README.md)
- [Índice de Diagramas de Estado](design/states/README.md)

## Artefactos Clave de Análisis

- [Diagrama de Casos de Uso](analysis/use-case-diagram.md)
- [Diagramas de Uso por Rol — Owner, Editor y Viewer](analysis/role-use-case-diagrams.md)
- [Modelo de Análisis del Sistema](analysis/modelo-analisis-sistema.md)
- [Diagrama de Clases de Dominio](analysis/domain-class-diagram.md)
- [Especificaciones de Casos de Uso](analysis/use-case-specifications.md)
- [Requisitos del Proyecto](analysis/project-requirements.md)

## Artefactos Clave de Diseño

- [Diagrama de Componentes](design/component-diagram.md)
- [Diagrama de Navegación](design/navigation-diagram.md)
- [Diagrama Entidad-Relación](design/entity-relationship-diagram.md)
- [Diagrama de Actividad: Envío de Campaña](design/activity-diagram-campaign-delivery.md)
- [Wireframe de SendIO](design/wireframe.md)
- [Sistema de Diseño de SendIO](design/design-system.md)

## Artefactos Clave de Implementación

- [Implementación del Proyecto](implementation/implementacion-proyecto-tfg.md)
- [Justificación Tecnológica](implementation/technology-justification.md)
- [Tecnologías Usadas por Zona](implementation/technology-stack-by-area.md)
- [Plan de Implementación del MVP](tasks/mvp-implementation-plan.md)
- [Requisitos de Onboarding de Autenticación y Workspace](frontend/auth-workspace-onboarding-requirements.md)
- [Experiencia de Importación de Contactos](frontend/contacts-import-experience.md)
- [Migración de Payload Canónico del Editor de Plantillas](frontend/template-editor-canonical-payload.md)
- [API de Inicialización de Autenticación y Workspace (MVP)](backend/api-auth-workspace-bootstrap.md)
- [API del Pipeline de Importación de Contactos (MVP)](backend/api-contacts-import-pipeline.md)
- [API del Catálogo de Variables](backend/api-variable-catalog.md)
- [API de la Biblioteca de Componentes](backend/api-component-library.md)
- [API de Plantillas](backend/api-templates.md)
- [API de Envío de Campaña (MVP)](backend/api-campaign-delivery-mvp.md)
- [API de Reportes y Auditoría (MVP)](backend/api-reporting-audit-mvp.md)
- [API de Invitaciones a Workspaces y Roles (MVP)](backend/api-workspace-invitations-roles.md)
- [Tarea MVP: Invitaciones a Workspaces y Gestión de Roles](tasks/mvp/core/feat-workspace-invitations-roles.md)
- [Convención de UUIDs en la Base de Datos](backend/database-uuid-convention.md)
- [Diseño Horizontal Drag-and-Drop del Editor de Plantillas](superpowers/specs/2026-05-21-template-editor-dnd-horizontal-design.md)
- [Diseño de Reemplazo de Referencias en el Editor de Plantillas](superpowers/specs/2026-05-21-template-editor-reference-replacement-design.md)

## Artefactos Clave de Validación

- [Validación de Envío de Correo en Sandbox](validation/mail-delivery-sandbox-validation.md)

## Cambio de Línea Base de Gobernanza

El estado inicial de gobernanza para el flujo de trabajo SDD se registra con:

- [Línea Base de Gobernanza de la Fundación](tasks/foundation-governance-baseline.md)
- [Contrato de Cobertura Frontend](tasks/frontend-coverage-contract.md)
- [Contrato de Automatización de PR en Git Root del Workspace](tasks/workspace-gitroot-pr-automation-contract.md)

## Reglas

- Todo el trabajo de implementación debe estar representado por un archivo de tareas bajo `docs/tasks/`.
- Cada nuevo documento bajo `docs/` debe ser indexado desde este archivo o un índice a nivel de sección.
- Los cambios en la gobernanza/procesos no deben incluir cambios en el código de la aplicación a menos que estén planificados explícitamente.
