# Capítulo 10: Implementación del Proyecto

Este capítulo resume cómo se construyó SendIO desde un punto de vista práctico. No sustituye al diseño del sistema ni al plan de validación; funciona como el bloque intermedio que explica cómo las decisiones de arquitectura se llevaron a código, servicios y entorno de desarrollo.

La implementación se organizó alrededor de tres frentes principales: backend, frontend e infraestructura. Esta división permitió avanzar de forma incremental, validar cada bloque por separado y después integrarlos en un flujo completo de producto: autenticación, gestión de workspace, contactos, plantillas, campañas, envío y reporting.

## 10.1 Organización del desarrollo por bloques

El desarrollo no se planteó como una única entrega monolítica. Se dividió en bloques funcionales para reducir riesgo técnico y mantener una trazabilidad clara entre requisitos, diseño, tareas y pruebas.

| Bloque | Objetivo | Resultado principal |
|--------|----------|---------------------|
| Backend | Construir la API, el modelo de datos y la lógica de negocio. | Endpoints Laravel para autenticación, workspaces, contactos, plantillas, campañas, auditoría e invitaciones. |
| Frontend | Crear la SPA de usuario y el editor visual. | Aplicación Angular con páginas por funcionalidad, servicios HTTP, estado de sesión y componentes de editor. |
| Infraestructura | Asegurar un entorno reproducible y servicios auxiliares. | Docker Compose con backend, Nginx, PostgreSQL, Redis, MongoDB disponible, worker de colas y Mailtrap. |

La implementación siguió un enfoque MVP. Primero se construyeron los cimientos necesarios para que el sistema pudiera operar de extremo a extremo: cuenta, workspace, sesión y contexto activo. A partir de ahí se incorporaron las áreas de producto: importación de contactos, gestión de plantillas, construcción visual de emails y envío de campañas.

Esta organización también ayudó a separar responsabilidades. El backend quedó centrado en reglas de negocio, validación y persistencia. El frontend quedó centrado en experiencia de usuario, composición visual y consumo de API. La infraestructura quedó centrada en reproducibilidad, colas y simulación segura de envíos.

## 10.2 Implementación del backend

El backend se implementó con Laravel sobre PHP 8.4, siguiendo una estructura modular basada en controladores API, modelos Eloquent, servicios de dominio, middleware y jobs en segundo plano.

La primera parte fue construir el núcleo de autenticación y workspace. El sistema no trabaja solo con usuarios aislados, sino con una jerarquía de cuenta, workspace y miembros. Por ese motivo, cada recurso relevante queda asociado a un `workspace_id`, y el middleware de contexto se encarga de validar que las operaciones se ejecuten dentro del workspace activo del usuario.

Los controladores HTTP exponen las operaciones principales, pero la lógica que tiene reglas propias se desplazó a servicios específicos. Por ejemplo, la importación de contactos no se limita a guardar filas: normaliza correos, detecta duplicados, rechaza datos inválidos y devuelve contadores útiles para el usuario. De forma similar, el envío de campañas se separó del ciclo HTTP mediante jobs de cola para evitar que una petición web dependa del tiempo necesario para procesar múltiples destinatarios.

Las entidades principales del dominio se representaron mediante modelos Eloquent: cuentas, workspaces, miembros, contactos, plantillas, versiones de plantilla, campañas, destinatarios, intentos de entrega y eventos de auditoría. Este modelo permite mantener relaciones explícitas y aplicar validaciones coherentes entre las distintas partes del sistema.

Una decisión práctica importante fue tratar las plantillas como contenido versionado. La campaña no depende simplemente de una plantilla editable, sino de una versión concreta. Esto evita que un cambio posterior en el editor altere históricamente una campaña ya preparada o enviada. En sistemas de email marketing esta decisión es clave: la trazabilidad importa tanto como la edición.

Para los envíos, Laravel Queue y Redis permiten encolar el trabajo y procesarlo mediante un worker dedicado. La API puede aceptar la acción del usuario, registrar el cambio de estado y delegar el procesamiento real al worker. Ese worker ejecuta los intentos de entrega, actualiza destinatarios y registra resultados en tablas de seguimiento. Mailtrap se usa como sandbox SMTP para validar el flujo sin riesgo de enviar correos reales durante desarrollo o defensa.

## 10.3 Implementación del frontend

El frontend se implementó con Angular 21 y TypeScript, usando componentes standalone, servicios HTTP tipados y organización por funcionalidades. La estructura diferencia entre código de aplicación, servicios de acceso a datos y páginas concretas de cada módulo.

Las funcionalidades principales se agruparon en áreas como autenticación, workspaces, contactos, plantillas, campañas y layout de aplicación. Cada página se apoya en servicios dentro de `core` para comunicarse con la API. Este enfoque evita que los componentes visuales conozcan detalles de rutas, cabeceras o transformaciones de payload, y facilita probar la lógica de integración de forma separada.

La conexión entre frontend y backend se resolvió mediante servicios Angular dedicados por dominio. Por ejemplo, existen servicios para autenticación, contactos, importación, campañas y miembros de workspace. Los interceptores se encargan de adjuntar información de sesión y contexto de workspace a las peticiones cuando corresponde. Así, las páginas trabajan con operaciones de mayor nivel, como cargar contactos, crear campaña o aceptar invitación, sin duplicar configuración HTTP.

El editor de plantillas fue uno de los bloques más específicos del frontend. Se implementó como una experiencia drag-and-drop con componentes de texto, imagen y botón. La representación visual del email se mantiene separada del payload canónico que se envía al backend. Esta separación fue necesaria porque el editor necesita una experiencia interactiva, mientras que el backend necesita una estructura estable, validable y versionable.

Para la interfaz se combinaron TailwindCSS y PrimeNG. PrimeNG aporta componentes productivos para formularios, botones, tablas y elementos comunes. TailwindCSS se usa para layout, espaciado, responsividad y ajustes visuales específicos. Esta combinación acelera la construcción sin perder control sobre el aspecto final de la aplicación.

El frontend también incorpora soporte de internacionalización para inglés y español. Esta decisión condiciona la implementación porque los textos no deben quedar incrustados de forma dispersa en la interfaz. Centralizar traducciones reduce el coste de mantener dos idiomas y permite ampliar la aplicación sin rehacer cada componente.

## 10.4 Integración de servicios e infraestructura

La infraestructura se construyó con Docker como requisito operativo del proyecto. El objetivo fue que los comandos de backend, migraciones, colas y servicios auxiliares se ejecutaran en un entorno controlado, evitando diferencias entre máquinas locales.

El entorno incluye PostgreSQL como base de datos relacional principal, Redis para colas y soporte de procesamiento asíncrono, Nginx como servidor web delante de PHP-FPM y Mailtrap como servicio externo de validación SMTP. MongoDB queda disponible en la infraestructura para posibles necesidades documentales o extensiones futuras, aunque el núcleo transaccional del MVP se apoya en PostgreSQL.

Los scripts `sendio.ps1` y `sendio.sh` actúan como fachada operativa. En lugar de ejecutar comandos PHP o Artisan directamente en la máquina local, el equipo usa comandos del proyecto para levantar servicios, ejecutar migraciones, abrir shell o revisar logs. Esto reduce errores de entorno y hace que la demostración sea más predecible.

La integración entre API y frontend se hizo mediante contratos documentados en los archivos de backend y frontend. Cada funcionalidad relevante cuenta con documentación asociada: autenticación y workspace, contactos, plantillas, campañas, reporting, auditoría e invitaciones. Esta documentación evita que el frontend consuma endpoints por intuición y mantiene una referencia para pruebas y mantenimiento.

## 10.5 Flujo real de desarrollo

El orden de construcción siguió una progresión natural desde la base técnica hasta las funcionalidades de producto.

Primero se preparó el entorno Docker y la estructura documental del proyecto. Sin una base reproducible, cualquier avance en backend o frontend habría dependido demasiado de configuraciones locales. Después se implementó el núcleo de autenticación y workspace, porque casi todas las demás funcionalidades necesitan conocer el usuario autenticado y el workspace activo.

La siguiente fase fue construir datos operativos: contactos, importación y plantillas. Estos elementos son la materia prima de SendIO. Sin contactos no hay destinatarios, y sin plantillas no hay contenido de email. Una vez que esos bloques estuvieron disponibles, se pudo avanzar hacia campañas, envío asíncrono y seguimiento de resultados.

El MVP se completó integrando reporting, auditoría y gestión de miembros. Estas funciones no son solo complementos visuales: ayudan a explicar que el sistema no se limita a enviar correos, sino que controla estados, registra actividad y permite operar en un modelo colaborativo por workspace.

El paso de MVP a una versión más completa consistió en endurecer los contratos, documentar APIs, añadir pruebas y mejorar la experiencia de usuario. En lugar de rehacer la arquitectura, se extendieron los bloques existentes. Esa es la ventaja de haber separado API, servicios, componentes, jobs e infraestructura desde el inicio.

## 10.6 Problemas de implementación relevantes

Durante la construcción aparecieron obstáculos técnicos que condicionaron decisiones concretas de implementación.

El primer obstáculo fue el aislamiento por workspace. No bastaba con autenticar usuarios; cada consulta y acción debía ejecutarse dentro del workspace correcto. Esto obligó a tratar el contexto de workspace como parte central de la arquitectura y no como un filtro opcional de interfaz.

El segundo obstáculo fue el envío masivo. Procesar una campaña completa dentro de una petición HTTP habría generado tiempos de espera, bloqueos y mala experiencia de usuario. La solución fue introducir colas y un worker dedicado, separando la acción del usuario del procesamiento real de destinatarios.

El tercer obstáculo fue el editor visual. Una interfaz drag-and-drop trabaja con estado mutable, previsualización y componentes editables, pero el backend necesita guardar una estructura estable y validable. Por eso se definió un payload canónico para plantillas, separando la experiencia de edición de la persistencia.

El cuarto obstáculo fue la validación segura de correos. En una plataforma de email marketing no es aceptable probar con destinatarios reales durante desarrollo. Mailtrap resolvió este problema al permitir inspeccionar HTML, variables y configuración SMTP sin riesgo operativo.

Por último, la documentación tuvo que acompañar la implementación. Al existir backend, frontend, infraestructura, diagramas, tareas y validación, el riesgo era que cada parte evolucionara por separado. Mantener los documentos indexados y conectados redujo esa fragmentación y dejó una memoria técnica defendible para el TFG.

## 10.7 Resultados obtenidos

La implementación permitió obtener una versión funcional de SendIO con los bloques principales del producto integrados. La siguiente tabla resume los resultados más relevantes desde el punto de vista técnico y funcional.

| Área | Resultado obtenido | Evidencia en el proyecto |
|------|--------------------|--------------------------|
| Autenticación y workspace | Registro, inicio de sesión y trabajo bajo un workspace activo. | API de autenticación, contexto de workspace y pantallas de login/registro. |
| Gestión de miembros | Invitaciones y administración de roles dentro del workspace. | Endpoints de miembros e invitaciones, correo de invitación y vistas de workspace. |
| Contactos | Importación y consulta de contactos con normalización y control de duplicados. | Servicio de importación, API de contactos y páginas de listado/importación. |
| Plantillas | Creación y edición de plantillas mediante un editor visual. | Editor drag-and-drop, componentes de texto, imagen y botón, y payload canónico. |
| Campañas | Preparación, envío y seguimiento de campañas asociadas a contactos y plantillas. | API de campañas, modelos de destinatarios e intentos de entrega. |
| Envío asíncrono | Procesamiento de envíos fuera del ciclo HTTP mediante colas. | Redis, Laravel Queue y worker dedicado para destinatarios de campaña. |
| Validación de correo | Comprobación segura de emails sin envíos reales accidentales. | Integración con Mailtrap como sandbox SMTP. |
| Reporting y auditoría | Registro de actividad y consulta de resultados operativos. | API de reporting, eventos de auditoría y trazabilidad de entregas. |
| Frontend SPA | Interfaz navegable por módulos principales del producto. | Angular, rutas de aplicación, servicios HTTP, guards e interceptores. |
| Infraestructura reproducible | Entorno de desarrollo levantable mediante scripts y contenedores. | Docker Compose, `sendio.ps1`, `sendio.sh`, PostgreSQL, Redis, Nginx y Mailtrap. |

En conjunto, el resultado obtenido es un MVP operativo que demuestra el flujo esencial de una plataforma de email marketing: gestionar usuarios y workspaces, importar contactos, construir plantillas, preparar campañas, procesar envíos y consultar actividad posterior.

## Documentos relacionados

- [Diseño del Sistema](../design/diseno-sistema-tfg.md)
- [Justificación de Tecnologías Utilizadas](tecnologias-tfg.md)
- [Tecnologías Usadas por Zona](technology-stack-by-area.md)
- [Plan de Implementación del MVP](../tasks/mvp-implementation-plan.md)
- [Plan de Validación y Pruebas](../validation/validacion-pruebas-tfg.md)
