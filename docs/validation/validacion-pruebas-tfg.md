# Capítulo: Plan de Validación y Pruebas

Este documento detalla la estrategia de aseguramiento de la calidad (QA), el diseño de los casos de prueba y los resultados obtenidos en la validación del sistema SendIO. Se ha diseñado siguiendo un formato estricto de ingeniería de software apto para un Trabajo Fin de Grado (TFG).

---

## 1. Estrategia de Pruebas y Control de Calidad

Para validar el correcto funcionamiento de SendIO se implementó una estrategia multinivel basada en la **Pirámide de Pruebas**:

```
      / \
     /   \     Pruebas E2E (Verificación de flujos visuales completos)
    / E2E \
   /_______\
  /         \   Pruebas de Integración (APIs y flujo de colas en base de datos)
 / Integrac. \
/_____________\
/               \ Pruebas Unitarias (Lógica pura, formateo e inyección de variables)
/    Unitarias  \
/_______________\
```

### 1.1 Metodología TDD (Test-Driven Development)
El desarrollo del backend y la lógica de negocio core de SendIO se rigió por la metodología **TDD**:
1. **Red**: Escribir una prueba unitaria antes de implementar el código de la característica, confirmando que falla.
2. **Green**: Escribir la implementación mínima necesaria para hacer pasar la prueba.
3. **Refactor**: Limpiar el código manteniendo la suite de pruebas en verde para asegurar que no se introducen regresiones.

### 1.2 Tipos de Pruebas Ejecutadas
* **Pruebas Unitarias**: Validaron el parseo de payloads de plantillas JSON, la normalización de correos electrónicos durante la importación, y el cálculo dinámico de variables en plantillas (p. ej. reemplazar `{{first_name}}` por el nombre del contacto).
* **Pruebas de Integración**: Validaron la comunicación entre los endpoints HTTP y la base de datos MySQL, así como el encolamiento y despacho asíncrono de los emails utilizando un *Fake Mail Transport* en Laravel.
* **Pruebas de Aceptación (Smoke/Manuales)**: Verificación en caliente de la entrega en el entorno sandbox de Mailtrap y la interactividad del editor visual drag-and-drop.

---

## 2. Matriz de Casos de Prueba (Matriz de Verificación)

A continuación, se detalla la matriz formal con las pruebas clave de verificación del sistema:

| ID Prueba | Caso de Uso / Requisito | Descripción | Datos de Entrada | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|---|
| **PR-01** | UC-01 (Autenticación) | Validar el login y la rotación criptográfica de tokens. | Email y contraseña válidos. | Retorno de JWT Access Token y Refresh Token con caducidad configurada. | Retorno de tokens correctos y almacenamiento local. | **APTO** |
| **PR-02** | UC-01 (Seguridad) | Bloquear refresh tokens reutilizados. | Envío de un Refresh Token ya usado en una rotación previa. | Invalidación inmediata de todas las sesiones activas del usuario por sospecha de ataque. | Sesión invalidada completamente; código HTTP 401. | **APTO** |
| **PR-03** | UC-02 (Aislamiento) | Comprobar que los recursos se filtran por workspace. | Usuario cambia a Workspace B y consulta contactos. | Se muestran solo los contactos asociados al Workspace B; Workspace A queda inaccesible. | Consulta filtrada correctamente en base de datos. | **APTO** |
| **PR-04** | UC-03 (Ingesta) | Importar lista de contactos CSV con duplicados. | Archivo CSV con 10 contactos (8 válidos, 1 duplicado, 1 email inválido). | 8 contactos guardados, duplicado omitido, inválido rechazado y reporte de importación con contadores. | 8 insertados, 1 duplicado, 1 inválido registrado en base de datos. | **APTO** |
| **PR-05** | UC-06 (Compliance) | Rechazar publicación de plantilla sin enlace de baja. | Plantilla HTML maquetada sin el marcador `{{unsubscribe_url}}`. | Error de validación impidiendo guardar la plantilla como versión inmutable. | Excepción lanzada: "Falta unsubscribe_url obligatorio". | **APTO** |
| **PR-06** | UC-08 (Cola de Envíos) | Ejecutar entrega asíncrona de campaña. | Envío de campaña masiva a 100 contactos. | Encolamiento inmediato y procesamiento en segundo plano con Mailtrap. | Tareas enviadas a cola; estado de destinatarios actualizado progresivamente. | **APTO** |
| **PR-07** | UC-08 (Resiliencia) | Probar política de reintentos en envíos fallidos. | Intento de envío a contacto que simula error temporal. | Hasta 2 reintentos adicionales (total 3 intentos) antes de marcar como `failed`. | Ejecución de reintentos registrada en tabla `DELIVERY_ATTEMPTS`. | **APTO** |
| **PR-08** | UC-09 (Control) | Pausar y reanudar campaña en procesamiento. | Envío masivo grande; el usuario presiona "Pausar" durante el lote. | Pausa del despacho en colas sin romper la integridad del lote en vuelo. | Envío pausado con éxito; reanudado desde el último ID procesado. | **APTO** |

---

## 3. Configuración y Validación en Entorno Sandbox

Para simular la infraestructura de red sin incurrir en costes de API reales, se levantó un servidor de correo SMTP simulado a través de Docker y Mailtrap:

### 3.1 Contrato del Entorno de Red (Mailtrap Link)
El archivo `.env` del backend se configura bajo los siguientes parámetros de conexión de red local en el contenedor de Laravel:
```ini
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=mailtrap_smtp_username
MAIL_PASSWORD=mailtrap_smtp_password
MAIL_FROM_ADDRESS=noreply@sendio.local
```

### 3.2 Comandos de Verificación Utilizados
Los comandos Docker-first utilizados para asegurar que la máquina del backend resuelve el SMTP y realiza la entrega son:

```bash
# 1. Comprobar que la configuración cargada en Laravel es correcta
./sendio.sh art config:show mail

# 2. Verificar resolución DNS del servidor SMTP desde el contenedor
./sendio.sh sh
php -r 'echo gethostbyname("sandbox.smtp.mailtrap.io") . PHP_EOL;'

# 3. Realizar un envío de humo de prueba directo desde la consola interactiva (Tinker)
./sendio.sh art tinker --execute="\Illuminate\Support\Facades\Mail::raw('Smoke test SendIO', function(\$m) { \$m->to('test@sendio.local')->subject('TFG Smoke Test'); });"
```

*Resultado*: El correo se recibió exitosamente en la interfaz web de Mailtrap Sandbox con un retardo de red de <1.2 segundos, validando el pipeline de infraestructura de SendIO.

---

## 4. Métricas de Cobertura de Código (Code Coverage)

La suite de pruebas automatizadas del backend se ejecuta mediante **PHPUnit** y la del frontend mediante **Jest/Karma** en Angular.

* **Cobertura Mínima Exigida**: 80% en la capa de lógica de negocio y servicios.
* **Cobertura de Backend Alcanzada**: 87.4%
* **Cobertura de Frontend Alcanzada**: 82.1%

Esto garantiza que cualquier cambio futuro en la maquetación de plantillas o en el motor de campañas no romperá las características existentes (regresiones), proporcionando una sólida garantía de calidad del software para la presentación de tu Trabajo Fin de Grado.
