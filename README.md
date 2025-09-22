# API de Fechas Hábiles en Colombia

## Resumen del Proyecto

Esta es una API REST, desplegada como una función serverless en AWS, para calcular fechas y horas hábiles en Colombia. La lógica tiene en cuenta fines de semana, festivos nacionales (obtenidos de una fuente externa) y el horario laboral estándar de 8:00 a.m. a 5:00 p.m., incluyendo el receso para el almuerzo (12:00 p.m. a 1:00 p.m.).

---

## Cumplimiento de Criterios de Evaluación

Este proyecto fue desarrollado para cumplir con un conjunto de estrictos criterios de evaluación, los cuales se detallan a continuación:

### ✅ Correctitud de la Lógica de Negocio

*   **Precisión de Minutos:** La lógica de cálculo se implementó utilizando un enfoque de **"banco de minutos"**. Esto garantiza que los cálculos sean precisos al minuto, manejando correctamente horas de inicio que no sean en punto (ej. 11:30) y asegurando que la duración se consume de forma exacta a través de los bloques de tiempo hábil.
*   **Manejo de Reglas:** Se implementaron correctamente todas las reglas de negocio, incluyendo el orden de operaciones (días primero, luego horas) y la regla de **ajuste hacia atrás** cuando la fecha de inicio es un momento no hábil.
*   **Festivos:** La API obtiene y cachea una lista de festivos de una fuente externa para sus cálculos.

### ✅ Claridad y Mantenibilidad del Código

*   **Refactorización:** El núcleo de la lógica (`DateCalculator.service.ts`) fue refactorizado para máxima legibilidad. La lógica compleja se dividió en métodos privados con responsabilidades únicas (`_adjustStartDate`, `_addBusinessDays`, `_addBusinessMinutes`).
*   **Sin "Números Mágicos":** Las horas que definen la jornada laboral (8, 12, 13, 17) y las URLs de APIs externas fueron extraídas a constantes `private readonly` con nombres descriptivos, haciendo el código auto-explicativo y fácil de mantener.

### ✅ Arquitectura Limpia

El proyecto sigue una arquitectura limpia, separando las responsabilidades en capas claras:
*   **Domain:** Contiene las interfaces (`IDateCalculator`) y los errores de negocio, definiendo el contrato de la aplicación sin acoplarse a ninguna tecnología.
*   **Infrastructure:** Contiene las implementaciones concretas, como los servicios que implementan la lógica (`DateCalculator.service.ts`) y los proveedores de datos (`HolidayApiProvider.ts`).
*   **Features/API:** Contiene los controladores, rutas y esquemas de validación que exponen la funcionalidad a través de una API REST.

### ✅ Gestión de Zonas Horarias

Se utiliza la librería `date-fns-tz` para un manejo robusto de zonas horarias. Todos los cálculos se realizan en la zona horaria de Colombia (`America/Bogota`) y la respuesta final siempre se convierte y se entrega en formato **UTC (ISO 8601)**, como se requería.

### ✅ Validación de Errores y Contrato de API

*   **Contrato Estricto:** La API cumple estrictamente con el contrato definido en la solicitud. Los parámetros se llaman `days`, `hours` y `date`. La respuesta de éxito es un JSON `{ "date": "..." }` y las de error son `{ "error": "...", "message": "..." }`.
*   **Validación de Entradas:** Se utiliza la librería `zod` para definir un esquema que valida rigurosamente todos los parámetros de entrada. Se rechazan valores negativos, flotantes o peticiones sin los parámetros requeridos, devolviendo un código de estado `400 Bad Request`.
*   **Manejo de Errores:** Un middleware de errores se encarga de capturar todos los errores (de validación o de negocio) y formatearlos en la respuesta JSON correcta, asegurando que los códigos de estado HTTP (`200`, `400`, `503`, etc.) sean los apropiados.

### ✅ Estrategia de Pruebas

El proyecto tiene una alta cobertura de pruebas para garantizar su fiabilidad:
*   **Pruebas Unitarias:** Se implementaron pruebas unitarias para `DateCalculator.service.ts` que cubren los 9 ejemplos de la solicitud, usando un `MockHolidayProvider` para aislar la lógica de dependencias externas.
*   **Pruebas de Integración:** Se crearon pruebas a nivel de API (`dateCalculator.routes.test.ts`) que verifican el comportamiento del endpoint con parámetros inválidos, asegurando que la validación funcione correctamente.

### ✅ Despliegue (Bonus Cumplido)

Se cumplió con el requisito "bonus" de la prueba. La solución está configurada para ser desplegada como una **función Lambda serverless** a través de **AWS CDK (Cloud Development Kit)**, demostrando el uso de Infraestructura como Código (IaC).

---

## Despliegue y Uso

1.  **Instalar Dependencias:**
    ```shell
    npm install
    ```

2.  **Ejecutar Pruebas:**
    ```shell
    npm test
    ```

3.  **Desplegar en AWS:**
    Asegúrate de tener tus credenciales de AWS configuradas y luego ejecuta:
    ```shell
    cdk deploy
    ```
    Al finalizar, CDK te proporcionará la URL pública de la API.

4.  **Ejecutar Localmente:**
    ```shell
    npm start
    ```
    El servidor se ejecutará en `http://localhost:3000`.

---

## Documentos de Soporte

Este repositorio contiene dos archivos que narran la historia y los requisitos del proyecto:

*   **`Solicitud.txt`**: Contiene los requisitos originales y las especificaciones técnicas que dieron origen a este proyecto.
*   **`Plan.txt`**: Es el plan de desarrollo detallado y la documentación técnica que se siguió y se fue actualizando durante la construcción de la API. Describe la arquitectura, las decisiones de diseño y las fases del proyecto.

---

> **Nota sobre el Desarrollo:** Este proyecto fue construido en su totalidad con la asistencia de **Gemini CLI**, una herramienta de IA de Google. El proceso completo, desde la planificación, escritura de código, depuración, pruebas, refactorización y despliegue, fue realizado de forma conversacional.
