# Requerimientos Funcionales del Sistema de Reserva de Computadoras

## 1. Actores del Sistema

### Estudiantes
- Usuarios principales que realizarán reservas de computadoras en los laboratorios
- Necesitan autenticarse con credenciales universitarias
- Pueden ver disponibilidad en tiempo real
- Pueden realizar, modificar y cancelar reservas

### Administradores de Laboratorio
- Gestionan los laboratorios y las computadoras disponibles
- Supervisan y administran las reservas
- Pueden bloquear horarios para mantenimiento
- Generan reportes de uso

### Sistema
- Actualiza la disponibilidad en tiempo real
- Envía notificaciones sobre reservas y cambios
- Gestiona conflictos de reservas
- Mantiene registros de uso y estadísticas

## 2. Requerimientos Funcionales Principales

### Gestión de Usuarios
- RF1.1: El sistema debe permitir el registro de usuarios con correo institucional
- RF1.2: El sistema debe autenticar usuarios mediante credenciales universitarias
- RF1.3: El sistema debe asignar roles específicos (estudiante, administrador)
- RF1.4: El sistema debe permitir la recuperación de contraseñas

### Gestión de Laboratorios y Computadoras
- RF2.1: El sistema debe permitir registrar laboratorios con su ubicación y horarios
- RF2.2: El sistema debe permitir registrar computadoras con sus características técnicas
- RF2.3: El sistema debe permitir asignar computadoras a laboratorios específicos
- RF2.4: El sistema debe permitir marcar computadoras como disponibles o no disponibles
- RF2.5: El sistema debe permitir programar mantenimientos preventivos

### Gestión de Reservas
- RF3.1: El sistema debe mostrar la disponibilidad de computadoras en tiempo real
- RF3.2: El sistema debe permitir realizar reservas en intervalos de tiempo específicos
- RF3.3: El sistema debe evitar conflictos de reservas (misma computadora, mismo horario)
- RF3.4: El sistema debe permitir a los usuarios modificar o cancelar sus reservas
- RF3.5: El sistema debe notificar a los usuarios sobre confirmaciones, modificaciones o cancelaciones
- RF3.6: El sistema debe implementar políticas de tiempo máximo de reserva
- RF3.7: El sistema debe permitir reservas recurrentes (ej. mismo horario cada semana)

### Visualización y Reportes
- RF4.1: El sistema debe mostrar un calendario con las reservas del usuario
- RF4.2: El sistema debe permitir filtrar computadoras por características técnicas
- RF4.3: El sistema debe generar reportes de uso por laboratorio, computadora y usuario
- RF4.4: El sistema debe mostrar estadísticas de uso y disponibilidad
- RF4.5: El sistema debe permitir exportar reportes en formatos estándar (PDF, CSV)

## 3. Requerimientos No Funcionales

### Rendimiento
- RNF1.1: El sistema debe actualizar la disponibilidad en tiempo real (latencia máxima de 2 segundos)
- RNF1.2: El sistema debe soportar al menos 500 usuarios concurrentes
- RNF1.3: El sistema debe responder a las solicitudes en menos de 3 segundos

### Seguridad
- RNF2.1: El sistema debe implementar autenticación segura
- RNF2.2: El sistema debe cifrar datos sensibles
- RNF2.3: El sistema debe registrar todas las acciones críticas (logs)
- RNF2.4: El sistema debe implementar protección contra ataques comunes (XSS, CSRF, inyección SQL)

### Disponibilidad
- RNF3.1: El sistema debe estar disponible 24/7, con un tiempo de actividad del 99.5%
- RNF3.2: El sistema debe implementar mecanismos de recuperación ante fallos

### Escalabilidad
- RNF4.1: El sistema debe ser escalable horizontalmente para manejar incrementos de carga
- RNF4.2: El sistema debe permitir agregar nuevos laboratorios y computadoras sin afectar el rendimiento

### Usabilidad
- RNF5.1: La interfaz debe ser intuitiva y responsive (adaptable a dispositivos móviles)
- RNF5.2: El sistema debe proporcionar retroalimentación clara sobre las acciones realizadas
- RNF5.3: El sistema debe ser accesible según estándares WCAG 2.1

## 4. Restricciones Técnicas

- El sistema debe implementarse utilizando una arquitectura de microservicios
- Los microservicios deben estar contenedorizados con Docker
- La orquestación de contenedores debe realizarse con Kubernetes
- El despliegue debe realizarse en la plataforma Azure
- El sistema debe utilizar bases de datos relacionales para datos estructurados
- El sistema debe implementar comunicación en tiempo real para actualizaciones de disponibilidad
