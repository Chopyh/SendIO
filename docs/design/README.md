# Documentación de Diseño

Esta sección contiene artefactos de diseño arquitectónico y de comportamiento que transforman los requisitos de análisis en estructuras orientadas a la implementación.

## Justificación Académica

Estos documentos formalizan cómo se descompone SendIO en componentes, estructuras de datos, contextos de navegación y flujos de procesos. Están destinados a guiar las decisiones de ingeniería garantizando al mismo tiempo la trazabilidad con los requisitos.

## Contenidos

- [Diseño del Sistema (TFG)](diseno-sistema-tfg.md)
- [Diagrama de Componentes](component-diagram.md)
- [Diagrama de Navegación](navigation-diagram.md)
- [Diagrama Entidad-Relación](entity-relationship-diagram.md)
- [Diagrama de Actividad: Envío de Campaña](activity-diagram-campaign-delivery.md)
- [Índice de Diagramas de Estado](states/README.md)

## Alcance

La línea base del diseño actual cubre el aislamiento de workspaces, las operaciones restringidas por roles, la versión inmutable de plantillas, el envío de campañas basado en colas Redis procesadas por un worker Docker de Laravel, la seguridad del ciclo de vida de los tokens y el comportamiento del reporting multiidioma.
