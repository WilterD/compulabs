# Arquitectura de Microservicios para Sistema de Reserva de Computadoras

## Visión General de la Arquitectura

La arquitectura del sistema se basa en un enfoque de microservicios contenedorizados, donde cada servicio es responsable de una funcionalidad específica y se comunica con otros servicios a través de APIs REST y mensajería asíncrona. Esta arquitectura permite la escalabilidad horizontal, el despliegue independiente y la resiliencia del sistema.

## Componentes Principales

### 1. API Gateway
- **Responsabilidad**: Punto de entrada único para todas las solicitudes de clientes
- **Funcionalidades**:
  - Enrutamiento de solicitudes a los microservicios correspondientes
  - Autenticación y autorización
  - Limitación de tasa de solicitudes
  - Balanceo de carga
  - Caché de respuestas
- **Tecnologías**: Azure API Management, Nginx

### 2. Servicio de Autenticación y Autorización
- **Responsabilidad**: Gestionar la identidad y los permisos de los usuarios
- **Funcionalidades**:
  - Registro de usuarios
  - Autenticación de usuarios
  - Gestión de sesiones
  - Control de acceso basado en roles
  - Integración con sistemas de autenticación universitarios
- **Tecnologías**: Flask, JWT, OAuth 2.0, Azure Active Directory

### 3. Servicio de Gestión de Laboratorios
- **Responsabilidad**: Administrar la información de los laboratorios
- **Funcionalidades**:
  - CRUD de laboratorios
  - Gestión de horarios de laboratorios
  - Asignación de computadoras a laboratorios
  - Gestión de mantenimientos programados
- **Tecnologías**: Flask, PostgreSQL

### 4. Servicio de Gestión de Computadoras
- **Responsabilidad**: Administrar la información de las computadoras
- **Funcionalidades**:
  - CRUD de computadoras
  - Gestión de características técnicas
  - Monitoreo de estado de computadoras
  - Gestión de mantenimientos específicos
- **Tecnologías**: Flask, PostgreSQL

### 5. Servicio de Reservas
- **Responsabilidad**: Gestionar las reservas de computadoras
- **Funcionalidades**:
  - Creación, modificación y cancelación de reservas
  - Verificación de disponibilidad
  - Gestión de conflictos
  - Reservas recurrentes
- **Tecnologías**: Flask, PostgreSQL, Redis

### 6. Servicio de Notificaciones
- **Responsabilidad**: Enviar notificaciones a los usuarios
- **Funcionalidades**:
  - Notificaciones por correo electrónico
  - Notificaciones en tiempo real
  - Recordatorios de reservas
  - Alertas de cambios o cancelaciones
- **Tecnologías**: Flask, RabbitMQ/Azure Service Bus, WebSockets

### 7. Servicio de Reportes y Analítica
- **Responsabilidad**: Generar informes y estadísticas de uso
- **Funcionalidades**:
  - Generación de reportes de uso
  - Estadísticas de disponibilidad
  - Análisis de patrones de uso
  - Exportación de datos
- **Tecnologías**: Flask, PostgreSQL, Pandas

### 8. Frontend Web
- **Responsabilidad**: Interfaz de usuario para estudiantes y administradores
- **Funcionalidades**:
  - Visualización de disponibilidad en tiempo real
  - Gestión de reservas
  - Panel de administración
  - Visualización de reportes
- **Tecnologías**: React, TypeScript, Tailwind CSS

## Comunicación entre Microservicios

### Comunicación Síncrona
- **API REST**: Para operaciones CRUD y consultas
- **gRPC**: Para comunicaciones de alto rendimiento entre servicios internos

### Comunicación Asíncrona
- **Mensajería**: Para eventos y notificaciones
- **Event Sourcing**: Para mantener la consistencia de datos entre servicios
- **Tecnologías**: RabbitMQ, Azure Service Bus

## Persistencia de Datos

### Bases de Datos por Servicio
- Cada microservicio tiene su propia base de datos
- Garantiza el desacoplamiento y la independencia de los servicios
- Permite la escalabilidad independiente

### Tipos de Bases de Datos
- **PostgreSQL**: Para datos estructurados (usuarios, laboratorios, computadoras, reservas)
- **Redis**: Para caché y datos en tiempo real
- **Azure Cosmos DB**: Para datos no estructurados y escalabilidad global

## Componentes de Infraestructura

### Contenedorización
- **Docker**: Para empaquetar cada microservicio y sus dependencias
- **Dockerfile** específico para cada microservicio
- **Docker Compose** para desarrollo local

### Orquestación
- **Kubernetes (AKS)**: Para gestionar los contenedores en producción
- **Servicios**: Para exponer los microservicios
- **Deployments**: Para gestionar las réplicas de los microservicios
- **ConfigMaps y Secrets**: Para la configuración y secretos
- **Ingress**: Para el enrutamiento de tráfico externo

### Monitoreo y Logging
- **Azure Monitor**: Para monitoreo de la infraestructura
- **Application Insights**: Para monitoreo de aplicaciones
- **ELK Stack**: Para centralización y análisis de logs
- **Prometheus y Grafana**: Para métricas y visualización

## Escalabilidad y Alta Disponibilidad

### Escalabilidad Horizontal
- Replicación de microservicios según demanda
- Balanceo de carga entre réplicas
- Autoescalado basado en métricas de uso

### Alta Disponibilidad
- Múltiples réplicas de cada microservicio
- Despliegue en múltiples zonas de disponibilidad
- Estrategias de recuperación ante fallos

## Seguridad

### Autenticación y Autorización
- JWT para autenticación entre servicios
- OAuth 2.0 para autenticación de usuarios
- RBAC para control de acceso

### Seguridad de Red
- Comunicación cifrada (TLS/SSL)
- Redes virtuales y grupos de seguridad
- Políticas de red de Kubernetes

### Seguridad de Datos
- Cifrado de datos en tránsito y en reposo
- Gestión segura de secretos con Azure Key Vault
- Auditoría de acceso a datos sensibles

## Diagrama de Arquitectura

```
+-------------------+
|                   |
|    Cliente Web    |
|                   |
+--------+----------+
         |
         v
+--------+----------+
|                   |
|    API Gateway    |
|                   |
+--------+----------+
         |
+--------+----------+--------+----------+--------+----------+--------+----------+
|                   |                   |                   |                   |
| Autenticación     | Laboratorios      | Computadoras      | Reservas          |
|                   |                   |                   |                   |
+--------+----------+--------+----------+--------+----------+--------+----------+
         |                   |                   |                   |
         |                   |                   |                   |
+--------+----------+        |                   |          +-------+----------+
|                   |        |                   |          |                  |
| Notificaciones    |        |                   |          | Reportes         |
|                   |        |                   |          |                  |
+--------+----------+        |                   |          +------------------+
         |                   |                   |                   |
         v                   v                   v                   v
+--------+----------+--------+----------+--------+----------+--------+----------+
|                   |                   |                   |                   |
| Base de Datos     | Base de Datos     | Base de Datos     | Base de Datos     |
| Autenticación     | Laboratorios      | Computadoras      | Reservas          |
|                   |                   |                   |                   |
+-------------------+-------------------+-------------------+-------------------+
```

## Flujo de Trabajo de Reserva (Ejemplo)

1. El usuario se autentica a través del Servicio de Autenticación
2. El usuario consulta la disponibilidad de computadoras a través del Servicio de Reservas
3. El Servicio de Reservas consulta al Servicio de Computadoras y al Servicio de Laboratorios
4. El usuario realiza una reserva a través del Servicio de Reservas
5. El Servicio de Reservas verifica la disponibilidad y crea la reserva
6. El Servicio de Reservas notifica al Servicio de Notificaciones
7. El Servicio de Notificaciones envía una confirmación al usuario
8. El Servicio de Reportes registra la actividad para análisis posterior
