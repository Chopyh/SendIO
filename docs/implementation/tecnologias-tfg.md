# Capítulo: Tecnologías Utilizadas y Justificación Técnica

Este documento presenta las herramientas, frameworks y tecnologías de infraestructura seleccionados para el desarrollo de SendIO, justificando formalmente su elección bajo criterios de ingeniería de software e idoneidad académica para un Trabajo Fin de Grado (TFG).

---

## 1. Stack Tecnológico de SendIO

La plataforma SendIO adopta una arquitectura desacoplada estructurada en capas, facilitando la mantenibilidad, escalabilidad e independencia del frontend y backend:

| Capa | Tecnología | Función Principal |
|---|---|---|
| **Servicio API (Backend)** | PHP 8.2 + Laravel 10 | Reglas de negocio, persistencia, encolamiento y seguridad de sesiones. |
| **Cliente Web (Frontend)** | Angular 16 + TypeScript | SPA interactiva, editor de plantillas drag-and-drop y monitoreo reactivo. |
| **Estilos UI** | TailwindCSS | Sistema de diseño coherente, responsivo y ágil mediante clases utilitarias. |
| **Contenerización** | Docker & Docker Compose | Virtualización del entorno de desarrollo y portabilidad para la demostración del TFG. |
| **Simulación SMTP (Sandbox)** | Mailtrap | Validación e inspección segura de envíos de correo en entorno local. |

---

## 2. Justificación Técnica de las Herramientas

### 2.1 Backend: PHP 8.2 & Laravel 10
Frente a otras alternativas populares como Node.js (Express/NestJS) o Python (Django), se seleccionó **Laravel** basándose en los siguientes argumentos de ingeniería:
* **Ecosistema Out-of-the-Box**: Laravel integra de forma nativa componentes esenciales para una plataforma de email marketing:
  * **Eloquent ORM**: Abstracción y protección automática contra inyecciones SQL (gracias a consultas parametrizadas).
  * **Sistema de Colas (Queueing System)**: Mecanismo integrado para procesar envíos de correo masivo de forma asíncrona sin bloquear la API HTTP.
  * **Validación de Datos**: Reglas estrictas integradas para validar payloads de plantillas e importación de CSV.
* **Seguridad y Control de Sesión**: Soporta la gestión e invalidación de sesiones basada en JWT y Refresh Tokens criptográficos con rotación automática integrada.

#### Comparativa Técnica de Backend:
| Criterio | Laravel (Elegido) | Node.js / Express | Django |
|---|---|---|---|
| **Velocidad de Desarrollo** | **Muy Alta** (Estructura guiada) | Alta (Requiere armar arquitectura) | Alta (Enfoque admin-first) |
| **Motor de Colas Nativo** | **Sí** (Laravel Queue) | No (Requiere librerías como BullMQ) | No (Requiere Celery) |
| **Estructura Arquitectónica** | **Estricta/Consistente** | Flexible (Riesgo de código espagueti) | Estricta (MVT) |

---

### 2.2 Frontend: Angular 16 & TypeScript
Para la interfaz de usuario se optó por **Angular** en lugar de React o Vue por los siguientes motivos de diseño arquitectónico:
* **Arquitectura de Grado Empresarial**: Angular impone una estructura modular clara basada en componentes, módulos y servicios. Esto previene la fragmentación del código y facilita el cumplimiento del principio de responsabilidad única.
* **Tipado Estático Riguroso**: Al basarse nativamente en **TypeScript**, Angular minimiza los errores en tiempo de ejecución al interactuar con las complejas estructuras de datos del maquetador de emails (JSON del payload de plantillas).
* **Reactividad Nativa con RxJS**: Permite un monitoreo en tiempo real del estado de entrega de campañas mediante flujos reactivos de datos estructurados, actualizándose cada 60 segundos sin necesidad de recargar la página.

#### Comparativa Técnica de Frontend:
| Criterio | Angular (Elegido) | React | Vue.js |
|---|---|---|---|
| **Estructura** | **Estricta y Completa** | Librería visual (Requiere agregar routing/estado) | Híbrida |
| **Tipado Nativo** | **Obligatorio (TypeScript)** | Opcional | Opcional |
| **Curva de Aprendizaje** | Alta (Excelente valor académico) | Media | Baja |

---

### 2.3 Estilos: TailwindCSS
Se utiliza **TailwindCSS** como motor de maquetación por encima de CSS puro o librerías de componentes rígidas (como Bootstrap o Angular Material) porque:
* **Diseño Altamente Personalizable**: Permite construir el editor drag-and-drop con un diseño fluido y moderno sin heredar estilos preestablecidos difíciles de anular.
* **Rendimiento**: Mediante la compilación JIT (Just-In-Time), el compilador de Tailwind analiza el código y genera un archivo CSS optimizado únicamente con las clases utilizadas, reduciendo el peso de la página al mínimo.
* **Mantenibilidad**: Evita escribir hojas de estilo interminables y previene la colisión de selectores CSS (gracias a que los estilos se definen a nivel de componente).

---

### 2.4 Virtualización: Docker & Docker Compose
Para asegurar que el proyecto funcione idénticamente en cualquier entorno, incluyendo el ordenador del tribunal del TFG, se configuró un entorno virtualizado completo:
* **Consistencia del Entorno**: Docker garantiza que las versiones de PHP (8.2), Composer, bases de datos y extensiones sean exactamente las mismas, previniendo el clásico problema de "en mi máquina sí funciona".
* **Despliegue Rápido**: Mediante los scripts de automatización `./sendio.sh` o `.\sendio.ps1`, el tribunal puede arrancar toda la aplicación con un único comando: `.\sendio.ps1 up`.

---

### 2.5 Simulación de Envíos: Mailtrap
Dado que SendIO es una plataforma masiva de envíos, realizar pruebas reales con proveedores como AWS SES o SendGrid durante el desarrollo y la defensa del TFG presenta riesgos éticos y económicos:
* **Seguridad de Datos**: Mailtrap actúa como un servidor SMTP sandbox, capturando todos los correos salientes en una bandeja de entrada virtual controlada. **Es imposible enviar un correo real a un cliente real por error.**
* **Herramientas de Análisis**: Permite inspeccionar el código HTML generado por el editor visual, comprobar el soporte del correo en dispositivos móviles y verificar que las variables dinámicas se hayan inyectado correctamente en el cuerpo del mensaje.

---

## 3. Análisis de Trade-offs (Compromisos de Diseño)

Toda decisión de arquitectura informática conlleva compromisos. A continuación, se detallan los asumidos en este TFG:

1. **Curva de aprendizaje de Angular**:
   * *Compromiso*: Requiere más tiempo inicial para configurar la arquitectura en comparación con React.
   * *Mitigación*: Se implementó el patrón *Container-Presentational* desde las fases iniciales, lo que ayudó a mantener los componentes del editor de emails legibles y aislados.
2. **Uso de Mailtrap Sandbox para el MVP**:
   * *Compromiso*: Limita el envío real de correos fuera del entorno de demostración.
   * *Mitigación*: Se diseñó el backend con una abstracción de transportes de correo. Migrar de Mailtrap a un servidor de producción (como AWS SES o Mailgun) en el futuro requiere únicamente cambiar variables en el archivo de configuración `.env` sin tocar el código fuente del sistema.
