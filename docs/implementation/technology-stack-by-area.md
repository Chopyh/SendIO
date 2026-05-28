# Tecnologías Usadas por Zona

Este documento resume las tecnologías directas usadas por SendIO, su versión conocida y la justificación general de uso. Las versiones se han tomado de los manifiestos del proyecto, lockfiles, Laravel Boost y Docker Compose.

## Criterio de Lectura

| Tipo de versión | Significado |
|-----------------|-------------|
| Bloqueada | Versión resuelta en `composer.lock`, `pnpm-lock.yaml` o Laravel Boost. |
| Declarada | Rango o versión declarada en `package.json` o `composer.json`. |
| Imagen Docker | Tag usado en `Dockerfile` o `docker-compose*.yml`. |
| No fijada | Tecnología usada, pero sin versión exacta bloqueada en el repositorio. |

El documento enumera dependencias directas y servicios de infraestructura. No lista todas las dependencias transitivas porque eso haría el documento menos útil para revisión y mantenimiento.

## Resumen Ejecutivo

| Zona | Tecnología principal | Versión actual | Justificación general |
|------|----------------------|----------------|------------------------|
| Backend API | PHP + Laravel | PHP 8.4, Laravel 13.9.0 | API modular, validación, ORM, colas, seguridad y productividad. |
| Frontend SPA | Angular + TypeScript | Angular 21.2.x, TypeScript 5.9.3 | SPA estructurada, tipado estricto, formularios, rutas y componentes escalables. |
| UI | TailwindCSS + PrimeNG | TailwindCSS 4.3.0, PrimeNG 21.1.8 | Diseño rápido, consistente, accesible y compatible con componentes complejos. |
| Editor de plantillas | Angular CDK + Quill | CDK 21.2.0, Quill 2.0.3 | Drag-and-drop, edición enriquecida y composición visual de emails. |
| Persistencia | PostgreSQL, MongoDB | PostgreSQL 18, MongoDB 8.2 | Relacional para negocio transaccional; documental para estructuras flexibles si aplica. |
| Colas y cache | Redis | 8.6 | Procesamiento asíncrono de campañas y soporte de jobs. |
| Contenedores | Docker Compose | Compose file v2 implícito | Entorno reproducible y alineado con la regla Docker-only del proyecto. |
| Servidor web | Nginx | `nginx:alpine` | Proxy HTTP ligero para servir la aplicación backend. |
| Email sandbox | Mailtrap | Configurado por entorno | Validación segura de envíos sin contactar destinatarios reales. |
| Testing | PHPUnit + Vitest | PHPUnit 12.5.25, Vitest 4.1.6 | Cobertura backend y frontend con herramientas nativas del stack. |

## Backend API

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| PHP | 8.4 | `backend/Dockerfile`, Laravel Boost | Runtime moderno con tipado fuerte, rendimiento actualizado y compatibilidad con Laravel 13. |
| Laravel Framework | 13.9.0 | Laravel Boost, `composer.lock` | Framework principal de API, rutas, validación, Eloquent ORM, jobs, configuración y testing. |
| Laravel Sanctum | 4.3.2 | Laravel Boost, `composer.lock` | Soporte de autenticación API y seguridad de sesión cuando el flujo lo requiere. |
| PHP Open Source Saver JWT Auth | 2.9.2 | `composer.lock` | Gestión JWT para access tokens y flujos de autenticación stateless. |
| Laravel Tinker | 3.0.2 | `composer.lock` | Herramienta de inspección puntual del backend en contexto Laravel. |
| Laravel Prompts | 0.3.17 | Laravel Boost, `composer.lock` | Utilidades CLI usadas por el ecosistema Laravel. |
| Composer | 2 | `backend/Dockerfile` | Gestión de dependencias PHP reproducible dentro del contenedor. |
| PDO PostgreSQL | Incluida en PHP 8.4 image | `backend/Dockerfile` | Driver de acceso a PostgreSQL desde Laravel. |
| PECL Redis | No fijada | `backend/Dockerfile` | Extensión PHP para integración eficiente con Redis. |
| PECL MongoDB | No fijada | `backend/Dockerfile` | Extensión PHP para integración con MongoDB. |

## Backend: Calidad, Desarrollo y Pruebas

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| Laravel Boost | 2.4.6 | Laravel Boost, `composer.lock` | Herramientas MCP y guías específicas para trabajar con Laravel en este proyecto. |
| Laravel MCP | 0.7.0 | Laravel Boost, `composer.lock` | Integración de tooling MCP para inspección y ayuda contextual. |
| Laravel Pail | 1.2.6 | Laravel Boost, `composer.lock` | Lectura de logs durante desarrollo. |
| Laravel Pint | 1.29.1 | Laravel Boost, `composer.lock` | Formato automático del código PHP con estándar Laravel. |
| PHPUnit | 12.5.25 | Laravel Boost | Suite principal de testing backend. |
| FakerPHP | 1.24.1 | `composer.lock` | Generación de datos de prueba. |
| Mockery | 1.6.12 | `composer.lock` | Dobles de prueba y mocks en tests PHP. |
| Nuno Maduro Collision | 8.9.4 | `composer.lock` | Reporting legible de errores en consola y tests. |
| Laravel Pao | 1.0.6 | `composer.lock` | Tooling de soporte del ecosistema Laravel usado en desarrollo. |

## Frontend SPA

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| Angular Core | 21.2.13 | `frontend/pnpm-lock.yaml` | Base de la SPA, componentes standalone, signals, routing y formularios. |
| Angular Router | 21.2.13 | `frontend/pnpm-lock.yaml` | Navegación de auth, app shell, contactos, plantillas, campañas y miembros. |
| Angular Forms | 21.2.13 | `frontend/pnpm-lock.yaml` | Formularios reactivos para auth, campañas, invitaciones y editor. |
| Angular Platform Browser | 21.2.13 | `frontend/pnpm-lock.yaml` | Runtime browser de Angular. |
| Angular Compiler | 21.2.13 | `frontend/pnpm-lock.yaml` | Compilación de templates Angular. |
| Angular CDK | 21.2.0 | `frontend/pnpm-lock.yaml` | Drag-and-drop y utilidades base para el editor de plantillas. |
| RxJS | 7.8.2 | `frontend/pnpm-lock.yaml` | Programación reactiva, flujos asíncronos y servicios HTTP. |
| TypeScript | 5.9.3 | `frontend/pnpm-lock.yaml` | Tipado estático del frontend. |
| tslib | 2.8.1 | `frontend/pnpm-lock.yaml` | Helpers runtime emitidos por TypeScript. |
| pnpm | 11.1.3 | `frontend/package.json` | Gestor de paquetes rápido y reproducible para el frontend. |
| Node.js | No fijada; Angular requiere `^20.19.0`, `^22.12.0` o `>=24.0.0` | `frontend/pnpm-lock.yaml` | Runtime de build y tooling frontend. |

## UI, Estilos y Experiencia Visual

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| TailwindCSS | 4.3.0 | `frontend/pnpm-lock.yaml` | Sistema utility-first para construir UI rápida, responsiva y consistente. |
| `@tailwindcss/postcss` | 4.3.0 | `frontend/pnpm-lock.yaml` | Integración de Tailwind con el pipeline PostCSS. |
| PostCSS | 8.5.14 | `frontend/pnpm-lock.yaml` | Procesamiento CSS. |
| PrimeNG | 21.1.8 | `frontend/pnpm-lock.yaml` | Componentes UI productivos: botones, tablas, selects, tags, cards y toggles. |
| PrimeIcons | 7.0.0 | `frontend/pnpm-lock.yaml` | Iconografía usada por PrimeNG y la interfaz. |
| `@primeuix/themes` | 2.0.3 | `frontend/pnpm-lock.yaml` | Temas visuales de PrimeNG. |
| Inter | No fijada por paquete local | `frontend/src/styles.css` | Tipografía principal definida por CSS. |

## Editor de Plantillas y Email Builder

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| Angular CDK Drag Drop | 21.2.0 | `frontend/pnpm-lock.yaml` | Movimiento de componentes dentro del editor visual. |
| Quill | 2.0.3 | `frontend/pnpm-lock.yaml` | Edición de texto enriquecido dentro de componentes de email. |
| Highlight.js | 11.11.1 | `frontend/pnpm-lock.yaml` | Resaltado de código en la vista HTML del editor. |
| ngx-highlightjs | 14.0.1 | `frontend/pnpm-lock.yaml` | Integración Angular para Highlight.js. |
| js-beautify | 1.15.4 | `frontend/pnpm-lock.yaml` | Formateo de HTML generado o mostrado por el editor. |
| `@types/js-beautify` | 1.14.3 | `frontend/pnpm-lock.yaml` | Tipos TypeScript para `js-beautify`. |

## Frontend: Build, Calidad y Pruebas

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| Angular CLI | 21.2.11 | `frontend/pnpm-lock.yaml` | Comandos de build, test y scaffolding Angular. |
| Angular Build | 21.2.11 | `frontend/pnpm-lock.yaml` | Pipeline de build moderno de Angular. |
| Angular Compiler CLI | 21.2.13 | `frontend/pnpm-lock.yaml` | Compilación AOT y verificación de templates. |
| Vitest | 4.1.6 | `frontend/pnpm-lock.yaml` | Runner de tests frontend rápido. |
| jsdom | 28.1.0 | `frontend/pnpm-lock.yaml` | Entorno DOM para tests de componentes. |
| Prettier | 3.8.3 | `frontend/pnpm-lock.yaml` | Formato consistente de archivos frontend. |

## Backend Asset Tooling

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| Vite | Declarada `^8.0.0` | `backend/package.json` | Build de assets del esqueleto Laravel si se usan recursos frontend del backend. |
| Laravel Vite Plugin | Declarada `^3.1` | `backend/package.json` | Integración Laravel con Vite. |
| TailwindCSS | Declarada `^4.0.0` | `backend/package.json` | Soporte de estilos en recursos del backend. |
| `@tailwindcss/vite` | Declarada `^4.0.0` | `backend/package.json` | Integración Tailwind con Vite. |
| concurrently | Declarada `^9.0.1` | `backend/package.json` | Ejecución paralela de procesos de desarrollo Laravel. |

## Persistencia y Datos

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| PostgreSQL | 18 | `docker-compose.yml`, `docker-compose.dev.yml` | Base de datos relacional principal para cuentas, workspaces, usuarios, contactos, campañas y auditoría. |
| MongoDB | 8.2 | `docker-compose.yml`, `docker-compose.dev.yml` | Persistencia documental disponible para estructuras flexibles o extensiones del editor. |
| Redis | 8.6 | `docker-compose.yml`, `docker-compose.dev.yml` | Cola y soporte de procesamiento asíncrono. |
| Eloquent ORM | Laravel 13.9.0 | Laravel Framework | Modelo de persistencia del backend con relaciones, scopes y migraciones. |
| UUID | Convención de proyecto | `docs/backend/database-uuid-convention.md` | Identificadores no enumerables y compatibles con aislamiento multiworkspace. |

## Colas, Workers y Envío

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| Laravel Queue | Laravel 13.9.0 | Laravel Framework | Encolado de campañas fuera del ciclo HTTP. |
| Redis Queue | Redis 8.6 | Docker Compose | Backend de cola para jobs de campaña. |
| Queue Worker | `php artisan queue:work redis --sleep=1 --tries=3 --timeout=120` | `docker-compose*.yml` | Proceso dedicado para ejecutar envíos y reintentos. |
| Mailtrap | Configuración por entorno | Docs DevOps y variables `.env` | Sandbox SMTP para validar emails sin envíos reales accidentales. |

## Infraestructura y Contenedores

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| Docker | No fijada | Procedimiento del proyecto | Ejecuta backend, servicios y comandos PHP de forma consistente. |
| Docker Compose | Especificación Compose actual | `docker-compose*.yml` | Orquesta servicios de aplicación, worker, web, PostgreSQL, Redis y MongoDB. |
| PHP-FPM image | `php:8.4-fpm` | `backend/Dockerfile` | Runtime PHP de producción/desarrollo para Laravel. |
| Nginx | `nginx:alpine` | `docker-compose*.yml` | Servidor web ligero delante del backend PHP-FPM. |
| Composer image | `composer:2` | `backend/Dockerfile` | Instala Composer en la imagen backend. |
| Scripts SendIO | Sin versión | `sendio.ps1`, `sendio.sh` | Abstracción operativa para levantar servicios y ejecutar comandos por Docker. |

### Observación Operativa

`docker-compose.yml` declara un servicio `frontend` con `dockerfile: Dockerfile` dentro de `./frontend`, pero no hay `frontend/Dockerfile` en el repositorio actual. Antes de depender de ese servicio para despliegue o demo, debe añadirse el Dockerfile o ajustarse Compose.

## Documentación, Diagramas y Diseño

| Tecnología | Versión | Fuente | Justificación |
|------------|---------|--------|---------------|
| Markdown | No aplica | `docs/**/*.md` | Fuente de verdad documental del proyecto. |
| Mermaid | No fijada | Diagramas en `docs/analysis` y `docs/design` | Diagramas versionables en texto para casos de uso, navegación, componentes y estados. |
| Pencil `.pen` | Schema 2.11 | `docs/design/design.pen` | Wireframes y artefactos visuales de diseño. |
| TailwindCSS | 4.3.0 frontend | `frontend/pnpm-lock.yaml` | Base de decisiones visuales documentadas en el design system. |

## Trade-offs Generales

| Decisión | Ventaja | Coste |
|----------|---------|-------|
| Laravel + Angular | Stack fuerte, estructurado y defendible académicamente. | Mayor curva de aprendizaje y más disciplina arquitectónica. |
| Docker-only | Entorno reproducible y consistente. | Requiere mantener Compose, imágenes y scripts al día. |
| PostgreSQL + Redis | Transaccionalidad y colas robustas. | Más servicios que operar en local. |
| Mailtrap para MVP | Demo segura sin envíos reales. | No valida todas las condiciones de un proveedor productivo. |
| PrimeNG + TailwindCSS | Componentes productivos con personalización rápida. | Hay que evitar mezclar patrones visuales sin criterio. |
| Angular CDK + editor propio | Control sobre el email builder. | Mayor complejidad de UX, testing y mantenimiento. |

## Documentos Relacionados

- [Justificación Tecnológica](technology-justification.md)
- [Capítulo: Tecnologías Utilizadas y Justificación Técnica](tecnologias-tfg.md)
- [Sistema de Diseño de SendIO](../design/design-system.md)
- [Contrato de Entorno Docker Mailtrap](../devops/docker-mailtrap-env.md)
- [API de Envío de Campaña](../backend/api-campaign-delivery-mvp.md)
- [API de Plantillas](../backend/api-templates.md)
