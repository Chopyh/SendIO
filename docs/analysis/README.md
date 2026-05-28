# Documentación de Análisis

Esta sección consolida los artefactos formales de análisis para SendIO, enfocados en los límites funcionales, los actores y la semántica del dominio. El propósito es proporcionar una línea base verificable antes del diseño de la solución y la planificación de la implementación.

## Justificación Académica

La documentación de análisis con calidad académica reduce la ambigüedad al separar la intención del negocio de la construcción técnica. Estos documentos definen lo que la plataforma debe hacer, para quién y bajo qué restricciones operativas.

## Contenidos

- [Diagrama de Casos de Uso](use-case-diagram.md)
- [Modelo de Análisis del Sistema](modelo-analisis-sistema.md)
- [Diagrama de Clases de Dominio](domain-class-diagram.md)
- [Especificaciones de Casos de Uso](use-case-specifications.md)
- [Requisitos del Proyecto](project-requirements.md)
- [Índice de Diagramas de Interacción](interactions/README.md)

## Alcance

Los artefactos en esta sección cubren:

- Modelo de colaboración multi-workspace con límites de roles (Owner, Editor, Viewer).
- Reglas de ingesta y normalización de contactos (CSV, JSON, lista separada por punto y coma).
- Comportamiento del ciclo de vida de las campañas (programar, encolar, enviar, reintentar, cancelar, pausar, reanudar).
- Comportamiento del ciclo de vida de las plantillas (versiones inmutables, instantáneas de componentes, marcadores de posición de variables).
- Controles de autenticación y sesión (acceso JWT y rotación de refresh tokens).
- Informes operativos, localización y restricciones de exportación.
