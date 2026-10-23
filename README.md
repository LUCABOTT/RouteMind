# RouteMind 🚚

### Plataforma inteligente para la gestión de pedidos, vehículos y operaciones logísticas

RouteMind es un proyecto de desarrollo Full Stack cuyo objetivo es diseñar e implementar una plataforma para centralizar la gestión de pedidos y vehículos, mejorar la trazabilidad de las operaciones logísticas y facilitar el seguimiento del ciclo de vida de cada pedido.

El proyecto busca evolucionar desde una aplicación web tradicional hacia una arquitectura orientada a eventos, incorporando tecnologías como **Apache Kafka** para procesar y distribuir eventos operativos de forma asíncrona, reducir el acoplamiento entre componentes y sentar las bases para una plataforma escalable.

La solución permitirá administrar información operativa desde una interfaz web, exponer los datos mediante una API REST y mantener la persistencia de la información en una base de datos relacional.

## 🎯 Objetivos del proyecto

- **Centralizar las operaciones:** reunir la información de pedidos y vehículos en una plataforma única.
- **Mejorar la trazabilidad:** registrar los cambios relevantes en el estado de los pedidos y facilitar su seguimiento.
- **Optimizar la asignación de recursos:** relacionar los pedidos con los vehículos correspondientes y preparar la plataforma para futuras mejoras en la planificación logística.
- **Procesar eventos de manera asíncrona:** incorporar Apache Kafka para desacoplar procesos y permitir que diferentes componentes reaccionen a los cambios operativos.
- **Diseñar una arquitectura escalable:** separar responsabilidades entre la interfaz, la API, la base de datos y los futuros consumidores de eventos.
- **Aplicar buenas prácticas de ingeniería:** utilizar migraciones, validaciones, modularidad, contenedores y control de versiones.

## 🧩 Funcionalidades

### Gestión de pedidos

La plataforma contempla la administración de pedidos y su información asociada. Se busca facilitar el seguimiento de cada pedido desde su registro hasta los distintos estados de su proceso operativo.

Entre las funcionalidades previstas se encuentran:

- Crear y consultar pedidos.
- Actualizar la información de los pedidos.
- Gestionar sus estados operativos.
- Asociar vehículos a los pedidos.
- Registrar eventos importantes para facilitar la trazabilidad.

### Gestión de vehículos

El módulo de vehículos permitirá centralizar la información de los recursos utilizados en las operaciones logísticas.

Sus capacidades incluirán:

- Registrar vehículos.
- Consultar y actualizar sus datos.
- Relacionar vehículos con pedidos.
- Preparar la estructura de información para futuras funcionalidades de disponibilidad, asignación y seguimiento operativo.

### API REST

El backend proporcionará una API REST para comunicar el frontend con la lógica de negocio y la base de datos.

Esta capa se encargará de recibir solicitudes, validar los datos, ejecutar las operaciones correspondientes y devolver respuestas estructuradas. También constituirá el punto de entrada para generar eventos de dominio cuando ocurran cambios relevantes.

## ⚙️ Arquitectura tecnológica

RouteMind se desarrollará utilizando tecnologías modernas para aplicaciones web y servicios backend.

| Tecnología | Responsabilidad |
|---|---|
| React | Construcción de la interfaz de usuario. |
| Vite | Herramientas de desarrollo y compilación del frontend. |
| NestJS | Arquitectura modular y lógica del backend. |
| TypeScript | Tipado estático y mayor mantenibilidad del código. |
| PostgreSQL | Persistencia de pedidos, vehículos y relaciones entre entidades. |
| Sequelize | Mapeo objeto-relacional y acceso a la base de datos. |
| Apache Kafka | Distribución y procesamiento asíncrono de eventos, previsto para una etapa de evolución de la arquitectura. |
| Docker y Docker Compose | Contenerización y ejecución coordinada de los servicios. |
| Git y GitHub | Control de versiones y documentación del proyecto. |

## 📨 Integración de Apache Kafka

Una de las principales metas de evolución de RouteMind es incorporar **Apache Kafka** para implementar una arquitectura orientada a eventos (*Event-Driven Architecture*).

Kafka permitirá que el backend publique eventos cuando sucedan operaciones relevantes, mientras que otros componentes podrán consumirlos y ejecutar tareas específicas sin que el proceso principal tenga que esperar a que todas esas tareas finalicen.

### ¿Cómo funcionará la integración?

El flujo general previsto será el siguiente:

1. **Ocurre una operación:** un usuario registra un pedido, modifica su estado o asigna un vehículo desde la aplicación.
2. **NestJS procesa la solicitud:** el backend valida la información y aplica las reglas de negocio.
3. **Se persisten los cambios:** PostgreSQL almacena la información de la operación.
4. **Se publica un evento:** el sistema envía un mensaje a un tópico de Kafka, por ejemplo, `pedido.creado`, `pedido.actualizado` o `vehiculo.asignado`.
5. **Los consumidores procesan el evento:** uno o varios servicios reciben el mensaje y realizan las tareas que les corresponden.
6. **Se generan resultados adicionales:** los consumidores podrán actualizar proyecciones de datos, registrar auditorías, generar notificaciones o alimentar futuras herramientas de análisis.

Este flujo es el diseño objetivo. La integración deberá implementarse y probarse antes de considerar que el procesamiento con Kafka está operativo.

### Arquitectura propuesta

```text
                ┌───────────────────┐
                │  React + Vite     │
                │     Frontend      │
                └─────────┬─────────┘
                          │ HTTP / REST
                          ▼
                ┌───────────────────┐
                │   NestJS API      │
                │  Lógica de negocio│
                └─────────┬─────────┘
                          │
                ┌─────────▼─────────┐
                │    PostgreSQL     │
                │ Datos persistentes│
                └───────────────────┘

                NestJS publica eventos
                          │
                          ▼
                ┌───────────────────┐
                │   Apache Kafka    │
                │      Tópicos      │
                └─────────┬─────────┘
                          │
               ┌──────────┼───────────┐
               ▼          ▼           ▼
          ┌─────────┐ ┌─────────┐ ┌──────────┐
          │Auditoría│ │Avisos   │ │Analítica │
          │eventos  │ │futuros  │ │futura    │
          └─────────┘ └─────────┘ └──────────┘
```

Los consumidores de auditoría, notificaciones y analítica representan componentes propuestos para etapas posteriores, no funcionalidades que deban considerarse implementadas actualmente.

### Tópicos y eventos propuestos

| Tópico | Evento | Propósito |
|---|---|---|
| `pedidos.events` | `pedido.creado` | Informar que se ha registrado un nuevo pedido. |
| `pedidos.events` | `pedido.actualizado` | Comunicar cambios relevantes en un pedido. |
| `pedidos.events` | `pedido.estado_cambiado` | Facilitar el seguimiento del ciclo de vida del pedido. |
| `vehiculos.events` | `vehiculo.creado` | Comunicar el registro de un vehículo. |
| `vehiculos.events` | `vehiculo.asignado` | Informar que un vehículo ha sido asociado a un pedido. |

Los nombres anteriores son una propuesta de diseño. La implementación definitiva deberá definir el esquema de cada mensaje, sus identificadores, marcas de tiempo y reglas de versionado.

### ¿Qué aportará Kafka al proyecto?

**Desacoplamiento:** la API no necesitará ejecutar directamente cada tarea secundaria. Los consumidores podrán reaccionar a los eventos de forma independiente.

**Procesamiento asíncrono:** las tareas que no necesiten completarse dentro de una solicitud HTTP podrán ejecutarse en segundo plano.

**Escalabilidad:** será posible aumentar la capacidad de determinados consumidores según la carga de trabajo, dentro de las garantías y límites de particionado de Kafka.

**Trazabilidad:** los eventos podrán utilizarse para construir registros de auditoría y consultar la evolución de las operaciones.

**Extensibilidad:** en el futuro se podrán incorporar notificaciones, indicadores operativos y otros servicios sin integrar toda su lógica dentro del backend principal.

Kafka no sustituirá a PostgreSQL. La base de datos seguirá siendo responsable de conservar la información transaccional del sistema, mientras Kafka se utilizará como plataforma de distribución de eventos.

Para mejorar la fiabilidad de la solución, también se evaluarán mecanismos como reintentos, consumidores idempotentes y el patrón *Transactional Outbox*, que ayuda a evitar inconsistencias entre la persistencia de los cambios y la publicación de los eventos.

## 🗺️ Evolución del proyecto

El desarrollo se organizará en etapas para avanzar desde una base funcional hacia una arquitectura distribuida.

### Etapa 1 — Aplicación Full Stack

- Desarrollo de la interfaz web.
- Implementación de los módulos de pedidos y vehículos.
- Creación de la API REST con NestJS.
- Configuración de PostgreSQL y Sequelize.
- Definición de modelos, relaciones y migraciones.
- Preparación del entorno mediante Docker Compose.

### Etapa 2 — Arquitectura orientada a eventos

- Incorporación de Apache Kafka al entorno de desarrollo.
- Definición de los eventos de dominio.
- Implementación de productores en el backend.
- Creación de consumidores independientes.
- Validación de la entrega, procesamiento y recuperación de mensajes.
- Pruebas de errores, reintentos y duplicados.

### Etapa 3 — Trazabilidad y procesamiento adicional

- Registro de eventos relevantes para auditoría.
- Construcción de un historial de cambios.
- Evaluación de notificaciones basadas en eventos.
- Implementación de indicadores operativos.
- Evaluación de mecanismos para detectar y gestionar pedidos que requieran atención.

### Etapa 4 — Escalabilidad y mejoras

- Pruebas de rendimiento y carga.
- Optimización del procesamiento de eventos.
- Mejoras de observabilidad, registros y métricas.
- Revisión de seguridad, permisos y configuración de despliegue.
- Preparación para un entorno de producción.

Las etapas son una hoja de ruta propuesta y podrán ajustarse conforme avance el desarrollo.

## 📁 Estructura del repositorio

```text
RouteMind/
├── backend/
│   ├── src/
│   │   ├── pedidos/
│   │   ├── vehiculos/
│   │   ├── health/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── migrations/
│   ├── config/
│   ├── test/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

La estructura podrá ampliarse con módulos de Kafka, productores, consumidores y pruebas de integración a medida que se incorporen esas capacidades.

## 🚀 Ejecución en desarrollo

### Requisitos

- Node.js y npm.
- Docker Desktop con Docker Compose.
- Git.

### Preparación

1. Clonar el repositorio.
2. Configurar las variables de entorno siguiendo `backend/.env.example`.
3. Instalar las dependencias del backend y del frontend.
4. Iniciar los servicios definidos en `docker-compose.yml`.
5. Ejecutar las migraciones de la base de datos.
6. Iniciar la API y la interfaz web utilizando los scripts de sus respectivos archivos `package.json`.

Los comandos concretos, puertos y variables requeridas deberán documentarse conforme a la configuración real del proyecto. La incorporación de Kafka requerirá actualizar también el entorno de Docker y la configuración del backend.

## 🔐 Seguridad y buenas prácticas

- Mantener las credenciales fuera del control de versiones.
- Utilizar variables de entorno para la configuración.
- Validar los datos recibidos por la API.
- Gestionar los errores de forma consistente.
- Mantener migraciones versionadas de la base de datos.
- Documentar los contratos de los eventos.
- Diseñar consumidores capaces de gestionar mensajes repetidos.
- Separar los entornos de desarrollo y producción.

## 📌 Estado actual

RouteMind se encuentra en desarrollo. La base del proyecto contempla el frontend con React, el backend con NestJS, la persistencia con PostgreSQL y Sequelize, y la gestión de pedidos y vehículos.

La incorporación de Apache Kafka forma parte de la evolución arquitectónica prevista y se documentará como implementada únicamente cuando sus productores, consumidores y flujos de procesamiento estén desarrollados y verificados.

## 👨‍💻 Propósito

RouteMind es un proyecto de portafolio orientado a fortalecer conocimientos de desarrollo Full Stack, diseño de API REST, modelado de datos, contenerización y arquitectura distribuida.

El objetivo final es construir una plataforma funcional que permita demostrar cómo integrar una aplicación web con tecnologías de mensajería y procesamiento de eventos, aplicando principios de escalabilidad, mantenibilidad y separación de responsabilidades.
