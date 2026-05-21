# Requisitos funcionales y no funcionales de SendIO

Este documento consolida, en español, los requisitos principales del proyecto SendIO para servir como memoria de referencia. Resume lo definido en los artefactos de análisis, diseño, backend, frontend, DevOps, validación y planificación MVP.

## Alcance del documento

| Aspecto | Descripción |
|---|---|
| Producto | Plataforma para construir emails con editor visual, gestionar contactos, ejecutar campañas masivas y consultar resultados. |
| Modelo de trabajo | Modelo cuenta-workspace similar a Notion: los usuarios pertenecen a cuentas y operan recursos dentro de workspaces. |
| Roles base | Owner, Editor y Viewer, con permisos diferenciados por dominio funcional. |
| Idiomas prioritarios | Inglés (`en`) y español (`es`). |
| Stack definido | Laravel/PHP para backend, Angular/TypeScript para frontend, Docker para operaciones y Markdown para documentación. |

## Requisitos funcionales

| ID | Área | Requisito | Explicación | Prioridad | Fuentes |
|---|---|---|---|---|---|
| RF-AUTH-001 | Autenticación | El sistema debe permitir iniciar sesión con email y contraseña. | El login debe validar credenciales y emitir un token JWT para consumir endpoints protegidos. | Alta / MVP | `docs/analysis/use-case-specifications.md`, `docs/backend/api-auth-workspace-bootstrap.md` |
| RF-AUTH-002 | Sesión | El token de acceso debe tener duración limitada y existir un flujo de refresh. | El análisis define access token de 1 hora y refresh token con rotación; el contrato API expone `expires_in` y `refresh_ttl`. | Alta | `docs/analysis/use-case-specifications.md`, `docs/backend/api-auth-workspace-bootstrap.md` |
| RF-AUTH-003 | Seguridad de sesión | La reutilización de un refresh token debe revocar la sesión o dispositivo activo. | Este control reduce el impacto de tokens robados y obliga a reautenticación cuando se detecta abuso. | Alta | `docs/analysis/use-case-specifications.md` |
| RF-WS-001 | Workspace | Todo usuario debe operar dentro de un workspace activo para acceder a recursos scoped. | Contactos, campañas, templates, remitente y reportes deben resolverse dentro del workspace seleccionado. | Alta / MVP | `docs/analysis/use-case-specifications.md`, `docs/frontend/auth-workspace-onboarding-requirements.md` |
| RF-WS-002 | Workspace | Los endpoints con alcance de workspace deben exigir `X-Workspace-Id`. | Si falta el header o el usuario no pertenece al workspace, el backend debe rechazar la operación. | Alta | `docs/backend/api-auth-workspace-bootstrap.md` |
| RF-WS-003 | Onboarding | El frontend debe guiar la creación de cuenta y primer workspace en un flujo único. | El wizard debe capturar identidad del propietario, credenciales, datos del workspace, timezone, locale y confirmación final. | Alta / MVP | `docs/frontend/auth-workspace-onboarding-requirements.md` |
| RF-WS-004 | Registro | Debe existir capacidad backend para registrar al primer usuario propietario. | La documentación actual identifica esta capacidad como brecha: el frontend la necesita para completar el wizard end-to-end. | Alta / Gap | `docs/frontend/auth-workspace-onboarding-requirements.md` |
| RF-I18N-001 | Internacionalización | La interfaz visible del MVP debe soportar inglés y español. | Labels, validaciones, errores de sesión, onboarding y reporting deben existir al menos en `en` y `es`. | Alta | `docs/frontend/auth-workspace-onboarding-requirements.md`, `docs/analysis/use-case-specifications.md` |
| RF-CONTACT-001 | Contactos | Owner y Editor deben poder importar contactos. | Viewer queda fuera de las operaciones de importación para preservar permisos por rol. | Alta / MVP | `docs/analysis/use-case-specifications.md` |
| RF-CONTACT-002 | Contactos | La importación debe normalizar emails antes de validar duplicados. | La normalización incluye trim, lowercase y comparación canónica/case-insensitive. | Alta | `docs/analysis/use-case-specifications.md`, `docs/backend/api-contacts-import-pipeline.md` |
| RF-CONTACT-003 | Contactos | La deduplicación de contactos debe aplicarse dentro del workspace. | Un mismo email puede existir en workspaces diferentes, pero no duplicarse dentro del mismo scope. | Alta | `docs/backend/api-contacts-import-pipeline.md`, `docs/design/entity-relationship-diagram.md` |
| RF-CONTACT-004 | Contactos | Registros inválidos o duplicados no deben bloquear registros válidos del mismo lote. | El sistema debe aceptar lo válido y devolver diagnóstico de procesados, omitidos y fallidos. | Alta | `docs/analysis/use-case-specifications.md`, `docs/backend/api-contacts-import-pipeline.md` |
| RF-CONTACT-005 | Contactos | El contrato backend MVP debe aceptar importación CSV con campos definidos. | El alcance MVP documentado prioriza CSV con `email`, `first_name`, `last_name` y `phone`; otros formatos quedan como alcance de análisis/futuro si no están implementados. | Alta / MVP | `docs/backend/api-contacts-import-pipeline.md`, `docs/analysis/use-case-specifications.md` |
| RF-SENDER-001 | Perfil remitente | Solo Owner debe configurar el perfil remitente del workspace. | Debe existir un único perfil remitente efectivo por workspace para campañas salientes. | Alta | `docs/analysis/use-case-specifications.md` |
| RF-SENDER-002 | Perfil remitente | En MVP, el email remitente requiere validación de formato. | La verificación de propiedad del dominio/remitente se difiere fuera del MVP. | Media / MVP | `docs/analysis/use-case-specifications.md` |
| RF-TPL-001 | Templates | Owner y Editor deben poder crear y editar templates con componentes reutilizables. | El producto requiere un editor visual drag-and-drop con piezas reutilizables para construir emails. | Alta / MVP | `docs/analysis/use-case-specifications.md`, `docs/tasks/mvp-implementation-plan.md` |
| RF-TPL-002 | Versionado de templates | Publicar un template debe crear una versión inmutable. | Una versión publicada no se muta en sitio; editarla debe generar una nueva versión. | Alta | `docs/analysis/use-case-specifications.md`, `docs/design/entity-relationship-diagram.md` |
| RF-TPL-003 | Validación de templates | El sistema debe validar el schema del template al guardar y publicar. | Errores estructurales deben impedir persistencia/publicación y devolver detalles accionables. | Alta | `docs/analysis/use-case-specifications.md`, `docs/design/component-diagram.md` |
| RF-TPL-004 | Compliance | Todo template publicado debe incluir `unsubscribe_url`. | La publicación y la ejecución pre-send deben bloquearse si falta este requisito de cumplimiento. | Alta / Compliance | `docs/analysis/use-case-specifications.md`, `docs/validation/mail-delivery-sandbox-validation.md` |
| RF-VAR-001 | Variables | Los placeholders deben usar la sintaxis `{{variable_name}}`. | Solo se permiten variables de las categorías Contact, Workspace y System. | Alta | `docs/analysis/use-case-specifications.md` |
| RF-VAR-002 | Variables | Las variables permitidas sin valor deben renderizar como cadena vacía. | La ausencia de un valor no debe bloquear el envío si la variable es válida. | Alta | `docs/analysis/use-case-specifications.md`, `docs/validation/mail-delivery-sandbox-validation.md` |
| RF-CAMP-001 | Campañas | Owner y Editor deben poder programar campañas. | La programación debe usar la zona horaria del workspace y persistir el instante de ejecución en UTC. | Alta | `docs/analysis/use-case-specifications.md`, `docs/design/activity-diagram-campaign-delivery.md` |
| RF-CAMP-002 | Campañas | Horarios locales inválidos por DST deben ajustarse al siguiente instante válido. | El sistema debe mostrar aviso explícito cuando ajusta una fecha/hora por transición de horario de verano. | Alta | `docs/analysis/use-case-specifications.md` |
| RF-CAMP-003 | Entrega | Las campañas MVP deben entregar emails mediante Mailtrap. | Mailtrap se usa como proveedor sandbox para reducir riesgo durante demo, validación y desarrollo. | Alta / MVP | `docs/implementation/technology-justification.md`, `docs/validation/mail-delivery-sandbox-validation.md` |
| RF-CAMP-004 | Entrega | Cada destinatario debe tener estado `pending`, `sent` o `failed`. | Estos estados permiten trazabilidad mínima del ciclo de entrega por destinatario. | Alta | `docs/analysis/use-case-specifications.md`, `docs/design/states/state-delivery-recipient-lifecycle.md` |
| RF-CAMP-005 | Entrega | El sistema debe reintentar como máximo 2 veces por destinatario. | El total máximo es de 3 intentos: envío inicial más 2 reintentos. | Alta | `docs/analysis/use-case-specifications.md`, `docs/validation/mail-delivery-sandbox-validation.md` |
| RF-CAMP-006 | Control de campañas | Owner y Editor deben poder pausar, reanudar y cancelar campañas. | Pausar detiene nuevos dequeues, reanudar los reactiva y cancelar evita nuevos envíos sin interrumpir el batch en vuelo. | Alta | `docs/analysis/use-case-specifications.md`, `docs/design/activity-diagram-campaign-delivery.md` |
| RF-REPORT-001 | Reporting | Todos los roles deben poder ver métricas operativas. | Owner, Editor y Viewer pueden consultar dashboard de métricas dentro del workspace. | Alta | `docs/analysis/use-case-specifications.md` |
| RF-REPORT-002 | Reporting | Las métricas deben refrescarse cada 60 segundos. | El dashboard debe mantener visibilidad operativa con una cadencia documentada. | Alta | `docs/analysis/use-case-specifications.md` |
| RF-REPORT-003 | Reporting | Owner y Editor deben poder exportar CSV; Viewer no. | La exportación debe estar scopeada al workspace y respetar permisos por rol. | Alta | `docs/analysis/use-case-specifications.md` |
| RF-AUDIT-001 | Auditoría funcional | El backend debe registrar eventos clave para reporting y auditoría. | Acciones relevantes deben ser trazables con actor, entidad, workspace, timestamp y contexto técnico. | Alta / MVP | `docs/tasks/mvp/back/feat-reporting-audit-trail.md`, `docs/devops/observability-audit-baseline.md` |

## Requisitos no funcionales

| ID | Área | Requisito | Explicación | Prioridad | Fuentes |
|---|---|---|---|---|---|
| RNF-ARCH-001 | Arquitectura | La implementación debe mantenerse dentro del stack definido. | No se deben introducir nuevos runtimes, frameworks, lenguajes ni árboles top-level sin tarea o especificación explícita. | Alta | `docs/workflow/standards.md` |
| RNF-API-001 | API | Las rutas HTTP deben usar `/api/...` sin versionado en URL. | No se permite `/api/v1/...`; la evolución de compatibilidad se gestionará por política, no por segmento URI. | Alta | `docs/workflow/standards.md`, `docs/frontend/auth-workspace-onboarding-requirements.md` |
| RNF-API-002 | API | Los errores del backend deben seguir un contrato estandarizado. | Los errores deben exponer códigos consistentes como `auth.unauthenticated`, `validation.failed` o `workspace.required`. | Alta | `docs/backend/api-auth-workspace-bootstrap.md`, `docs/backend/api-contacts-import-pipeline.md` |
| RNF-SEC-001 | Seguridad | No debe existir fuga de datos entre workspaces. | Cada acceso debe validar membresía, rol y contexto activo antes de retornar datos. | Alta | `docs/analysis/use-case-specifications.md`, `docs/backend/api-auth-workspace-bootstrap.md` |
| RNF-SEC-002 | Roles y autorización | Los permisos deben respetar Owner, Editor y Viewer. | Las restricciones deben aplicarse tanto en frontend como en backend; la UI no sustituye validación server-side. | Alta | `docs/analysis/use-case-specifications.md`, `docs/design/entity-relationship-diagram.md` |
| RNF-OBS-001 | Observabilidad | Toda request debe resolver y devolver `X-Request-ID`. | Laravel debe aceptar IDs seguros o generar UUID cuando el header falte o sea inseguro. | Alta | `docs/devops/observability-audit-baseline.md` |
| RNF-OBS-002 | Logs | Los logs deben incluir `request_id` y contexto de auditoría. | Campos esperados: `audit_event`, `actor_user_id`, `workspace_id`, `entity_type`, `entity_id` y `request_id`. | Alta | `docs/devops/observability-audit-baseline.md` |
| RNF-PRIV-001 | Privacidad | Los logs no deben incluir PII cruda, cuerpos de email, tokens, passwords ni secretos. | Se permiten IDs internos, conteos, estados, categorías de validación y request IDs. | Alta | `docs/devops/observability-audit-baseline.md` |
| RNF-RET-001 | Retención | Los logs MVP deben retenerse al menos 30 días donde el storage lo permita. | La configuración sugerida usa canal diario con `LOG_DAILY_DAYS=30`. | Media / Alta | `docs/devops/observability-audit-baseline.md` |
| RNF-DEVOPS-001 | Operaciones | Los comandos PHP/Laravel deben ejecutarse mediante Docker wrappers. | En Windows se usa `./sendio.ps1`; en Linux/WSL se usa `./sendio.sh`. | Alta | `docs/workflow/standards.md`, `docs/tasks/mvp-implementation-plan.md` |
| RNF-MAIL-001 | Email sandbox | Los ambientes no productivos deben usar Mailtrap sandbox SMTP. | Esto evita envíos accidentales a clientes reales durante desarrollo, validación y demo. | Alta | `docs/implementation/technology-justification.md`, `docs/devops/docker-mailtrap-env.md` |
| RNF-MAIL-002 | Email producción | Producción no debe depender de Mailtrap sandbox. | Debe configurarse un proveedor real y políticas de dominio/remitente antes de uso productivo. | Alta futura | `docs/devops/docker-mailtrap-env.md` |
| RNF-UI-001 | Frontend | El frontend MVP debe usar PrimeNG y TailwindCSS. | Se prefieren selectores PrimeNG directos `p-*`; Tailwind se usa para layout, spacing y utilidades visuales. | Alta | `docs/tasks/mvp-implementation-plan.md`, `docs/workflow/standards.md` |
| RNF-UX-001 | Experiencia de usuario | Los errores visibles deben ser localizados, claros y accionables. | Casos como credenciales inválidas, validación fallida, workspace prohibido y fallos de red deben tener mensajes comprensibles. | Alta | `docs/frontend/auth-workspace-onboarding-requirements.md` |
| RNF-TEST-001 | Calidad | Cada cambio debe contar con validación y pruebas automatizadas cuando aplique. | La documentación exige TDD y aceptación verificable para guards, imports, lifecycle de campañas, reporting y flujos UI. | Alta | `docs/tasks/README.md`, `docs/workflow/standards.md` |
| RNF-DOC-001 | Gobernanza | Todo trabajo debe partir de un documento de tarea bajo `docs/tasks/`. | El trabajo fuera del scope de una tarea no está permitido por los estándares del proyecto. | Alta | `docs/workflow/standards.md`, `docs/README.md` |
| RNF-DOC-002 | Gobernanza | Todo documento nuevo bajo `docs/` debe estar indexado. | El índice puede ser `docs/README.md` o un índice de sección correspondiente. | Alta | `docs/README.md`, `docs/workflow/standards.md` |
| RNF-QUEUE-001 | Confiabilidad | La entrega de campañas debe ser queue-centric. | El uso de cola permite pausas, reanudaciones, cancelaciones y reintentos consistentes. | Alta | `docs/design/component-diagram.md`, `docs/design/activity-diagram-campaign-delivery.md` |

## Brechas y decisiones pendientes

| ID | Tema | Descripción | Impacto | Fuente |
|---|---|---|---|---|
| GAP-001 | Registro backend | El wizard frontend requiere registro de usuario propietario, pero el contrato backend documentado solo cubre login y bootstrap autenticado. | Sin esta capacidad, el onboarding completo no puede integrarse end-to-end. | `docs/frontend/auth-workspace-onboarding-requirements.md` |
| GAP-002 | Formatos de importación | El análisis general menciona CSV, JSON y lista separada por punto y coma, pero el contrato backend MVP acota la importación a CSV. | Debe decidirse si JSON/lista quedan fuera del MVP o se agregan en una tarea explícita. | `docs/analysis/use-case-specifications.md`, `docs/backend/api-contacts-import-pipeline.md` |
| GAP-003 | Proveedor email productivo | Mailtrap está justificado para MVP/demo, pero no para producción. | Antes de producción se requiere abstracción de proveedor y configuración real. | `docs/implementation/technology-justification.md`, `docs/devops/docker-mailtrap-env.md` |

## Resumen ejecutivo

SendIO debe priorizar un MVP seguro y trazable: autenticación con contexto de workspace, importación robusta de contactos, editor de templates versionado, cumplimiento de `unsubscribe_url`, entrega sandbox con Mailtrap, control de campañas, métricas y exportación por rol. Los requisitos no funcionales más importantes son aislamiento por workspace, i18n `en`/`es`, ejecución vía Docker, observabilidad con `X-Request-ID`, protección de PII en logs, pruebas automatizadas y documentación indexada.
