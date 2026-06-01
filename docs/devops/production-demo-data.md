# Datos de Prueba de Producción

Este documento describe los datos demo creados por `DemoDataSeeder`. Sirve como referencia para validar SendIO en Dokploy sin insertar datos manualmente ni enviar correos reales.

## Carga Rápida

1. Desplegar la rama `dev` en Dokploy.
2. Abrir una terminal en el servicio backend `app`.
3. Ejecutar migraciones si todavía no se han ejecutado.
4. Ejecutar el seeder demo.
5. Entrar con un usuario demo y revisar workspaces, contactos, plantillas, campañas y reportes.

```bash
php artisan migrate --force
php artisan db:seed --class=DemoDataSeeder --force
```

## Contrato de Seguridad

| Regla | Detalle |
|---|---|
| Idempotencia | El seeder usa `firstOrCreate` y `updateOrCreate`; se puede ejecutar varias veces sin duplicar datos principales. |
| Correos reales | No envía correos. Solo crea registros de campañas, destinatarios e intentos de entrega simulados. |
| Dominios de contactos | Los contactos usan `example.test`, por lo que no son direcciones reales. |
| Ejecución automática | No se ejecuta al arrancar contenedores. Se ejecuta manualmente con Artisan. |
| Entorno recomendado | Producción demo o staging. No sustituye datos reales de cliente. |

## Resumen de Registros

| Entidad | Cantidad Esperada |
|---|---:|
| Accounts | 2 |
| Workspaces | 2 |
| Users | 5 |
| Contacts | 18 |
| Component library items | 3 |
| Templates | 4 |
| Template versions | 4 |
| Campaigns | 6 |
| Campaign recipients | 23 |
| Delivery attempts | 23 |

## Usuarios Demo

Todos los usuarios usan la contraseña `password`.

| Nombre | Email | Rol | Workspace |
|---|---|---|---|
| Demo Owner | `owner@sendio.test` | Owner | SendIO Demo Workspace |
| Demo Editor | `editor@sendio.test` | Editor | SendIO Demo Workspace |
| Demo Viewer | `viewer@sendio.test` | Viewer | SendIO Demo Workspace |
| Isolation Owner | `isolation-owner@sendio.test` | Owner | SendIO Isolation Workspace |
| Empty Workspace User | `empty@sendio.test` | Sin workspace | Ninguno |

## Cuentas y Workspaces

| Account | Workspace | Timezone | Locale |
|---|---|---|---|
| SendIO Demo Account | SendIO Demo Workspace | UTC | en |
| SendIO Isolation Account | SendIO Isolation Workspace | Europe/Madrid | es |

## Contactos del Workspace Principal

Estos contactos pertenecen a `SendIO Demo Workspace`.

| Email | Nombre | Teléfono | Segmento | Fuente | Idioma |
|---|---|---|---|---|---|
| `ana.ruiz@example.test` | Ana Ruiz | +34 600 100 001 | Newsletter | csv-import | es |
| `leo.gomez@example.test` | Leo Gomez | +34 600 100 002 | Leads | csv-import | es |
| `maria.lopez@example.test` | Maria Lopez | +34 600 100 003 | Customers | manual | es |
| `john.smith@example.test` | John Smith | +1 415 555 0104 | Trial | api | en |
| `sarah.connor@example.test` | Sarah Connor | +1 415 555 0105 | Customers | csv-import | en |
| `diego.martin@example.test` | Diego Martin | +34 600 100 006 | Newsletter | manual | es |
| `lucia.fernandez@example.test` | Lucia Fernandez | +34 600 100 007 | Leads | api | es |
| `noah.williams@example.test` | Noah Williams | +1 212 555 0108 | Trial | csv-import | en |
| `emma.brown@example.test` | Emma Brown | +44 20 7946 0109 | Customers | manual | en |
| `carlos.navarro@example.test` | Carlos Navarro | +34 600 100 010 | Newsletter | csv-import | es |
| `sofia.ortega@example.test` | Sofia Ortega | +34 600 100 011 | Trial | api | es |
| `olivia.johnson@example.test` | Olivia Johnson | +1 646 555 0112 | Leads | manual | en |
| `pablo.santos@example.test` | Pablo Santos | +34 600 100 013 | Customers | csv-import | es |
| `mia.davis@example.test` | Mia Davis | +1 312 555 0114 | Newsletter | api | en |
| `valentina.castro@example.test` | Valentina Castro | +34 600 100 015 | Leads | manual | es |
| `liam.miller@example.test` | Liam Miller | +1 617 555 0116 | Trial | csv-import | en |

## Contactos del Workspace de Aislamiento

Estos contactos pertenecen a `SendIO Isolation Workspace`. Sirven para comprobar que los recursos se filtran por workspace.

| Email | Nombre | Teléfono | Segmento | Fuente | Idioma |
|---|---|---|---|---|---|
| `shared@example.test` | Shared Isolation | +34 699 200 001 | Duplicate Email Test | isolation | en |
| `ana.ruiz@example.test` | Ana Other Workspace | +34 699 200 002 | Workspace Scope Test | isolation | es |

## Componentes Reutilizables

Los componentes se crean en `SendIO Demo Workspace`.

| Nombre | Tipo | Uso |
|---|---|---|
| Hero Headline | text | Cabecera con variable `{{contact.first_name}}`. |
| Primary CTA Button | button | Botón principal de llamada a la acción. |
| Compliance Footer | text | Pie con enlace `{{unsubscribe_url}}`. |

## Plantillas Publicadas

Todas las plantillas tienen `state = published` y `compliance_unsubscribe_url = true`.

| Plantilla | Versión | Variables |
|---|---:|---|
| Welcome Journey Template | 1 | `contact.first_name`, `contact.last_name`, `system.unsubscribe_url` |
| Monthly Newsletter Template | 1 | `contact.first_name`, `unsubscribe_url` |
| Product Launch Promo Template | 1 | `contact.first_name`, `unsubscribe_url` |
| Premium Feature Announcement | 1 | `contact.first_name`, `unsubscribe_url` |

## Campañas Demo

Las campañas simulan estados de envío para poder probar listados, detalle, métricas y reportes sin disparar jobs reales.

| Campaña | Plantilla | Estado | Destinatarios | Enviados | Fallidos |
|---|---|---|---:|---:|---:|
| June Newsletter Draft | Monthly Newsletter Template | draft | 3 | 0 | 0 |
| Trial Welcome Queue | Welcome Journey Template | queued | 4 | 0 | 0 |
| Customer Winback Running | Product Launch Promo Template | running | 5 | 2 | 1 |
| May Newsletter Completed | Monthly Newsletter Template | completed | 4 | 4 | 0 |
| Spring Promo Failed | Product Launch Promo Template | failed | 3 | 0 | 3 |
| Premium Features Launch | Premium Feature Announcement | completed | 4 | 4 | 0 |

## Estados de Destinatarios por Campaña

| Campaña | Estados Simulados |
|---|---|
| June Newsletter Draft | 3 pending |
| Trial Welcome Queue | 4 pending |
| Customer Winback Running | 2 sent, 1 failed, 1 sending, 1 pending |
| May Newsletter Completed | 4 sent |
| Spring Promo Failed | 3 failed |

## Validación Después de Cargar Datos

Ejecutar desde el contenedor backend `app`.

```bash
php artisan tinker --execute="echo json_encode([
    'accounts' => App\\Models\\Account::count(),
    'workspaces' => App\\Models\\Workspace::count(),
    'users' => App\\Models\\User::count(),
    'contacts' => App\\Models\\Contact::count(),
    'components' => App\\Models\\ComponentLibraryItem::count(),
    'templates' => App\\Models\\Template::count(),
    'template_versions' => App\\Models\\TemplateVersion::count(),
    'campaigns' => App\\Models\\Campaign::count(),
    'campaign_recipients' => App\\Models\\CampaignRecipient::count(),
    'delivery_attempts' => App\\Models\\DeliveryAttempt::count(),
], JSON_PRETTY_PRINT);"
```

Resultado esperado:

```json
{
    "accounts": 2,
    "workspaces": 2,
    "users": 5,
    "contacts": 18,
    "components": 3,
    "templates": 4,
    "template_versions": 4,
    "campaigns": 6,
    "campaign_recipients": 23,
    "delivery_attempts": 23
}
```

## Flujo de Demo Recomendado

1. Entrar con `owner@sendio.test` y contraseña `password`.
2. Revisar dashboard y workspace activo.
3. Abrir contactos y comprobar segmentos `Newsletter`, `Leads`, `Customers` y `Trial`.
4. Abrir plantillas y revisar las tres plantillas publicadas.
5. Abrir campañas y comprobar estados `draft`, `queued`, `running`, `completed` y `failed`.
6. Entrar con `viewer@sendio.test` para validar permisos de solo lectura.
7. Entrar con `empty@sendio.test` para validar experiencia sin workspace.
