# Sistema de Reserva de Computadoras en Laboratorios Universitarios

Sistema completo de microservicios para la gestión de reservas de computadoras en laboratorios universitarios, desarrollado con React, Flask, MySQL y Docker.

## 🏗️ Arquitectura

- **Frontend**: React + TypeScript + Vite
- **Backend**: Flask + Socket.IO (Python)
- **Microservicio de Notificaciones**: Flask (Python) - Emails y SMS
- **Base de Datos**: MySQL 8.0
- **Gestión de BD**: phpMyAdmin
- **Contenedores**: Docker + Docker Compose

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker
- Docker Compose

### Instalación y Ejecución

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd proyecto_microservicios
```

2. **Ejecutar con Docker Compose**
```bash
# Ejecutar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Detener todos los servicios
docker-compose down
```

3. **Acceder a los servicios**
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Microservicio de Notificaciones**: http://localhost:5001
- **phpMyAdmin**: http://localhost:8080
- **Base de Datos**: localhost:3306

## 📊 Gestión de Base de Datos

### phpMyAdmin
Accede a la interfaz web de gestión de base de datos en **http://localhost:8080**

**Credenciales de acceso:**
- **Usuario**: `root`
- **Contraseña**: `rootpassword`

**Base de datos**: `reservas_db`

### Comandos útiles para la base de datos

```bash
# Conectar directamente a MySQL
docker exec -it reservas_db mysql -u root -prootpassword

# Ver logs de la base de datos
docker logs reservas_db

# Hacer backup de la base de datos
docker exec reservas_db mysqldump -u root -prootpassword reservas_db > backup.sql

# Restaurar backup
docker exec -i reservas_db mysql -u root -prootpassword reservas_db < backup.sql
```

## 👥 Usuarios de Prueba

### Administrador
- **Email**: `admin@test.com`
- **Contraseña**: `admin123`
- **Rol**: Administrador completo

### Super Usuario
- **Email**: `superuser@example.com`
- **Contraseña**: `super123`
- **Rol**: Super administrador

### Estudiante
- **Email**: `student@example.com`
- **Contraseña**: `student123`
- **Rol**: Estudiante

## 🔧 Gestión de Servicios

### Ejecutar servicios individualmente

```bash
# Solo la base de datos
docker-compose up -d db

# Solo phpMyAdmin
docker-compose up -d phpmyadmin

# Solo el backend
docker-compose up -d backend

# Solo el frontend
docker-compose up -d frontend

# Solo el microservicio de notificaciones
docker-compose up -d notifications
```

### Verificar estado de los servicios

```bash
# Ver todos los contenedores
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs notifications
docker-compose logs db
docker-compose logs phpmyadmin
```

### Reiniciar servicios

```bash
# Reiniciar un servicio específico
docker-compose restart backend
docker-compose restart notifications

# Reiniciar todos los servicios
docker-compose restart
```

## 🗄️ Estructura de la Base de Datos

### Tablas principales:
- **users**: Usuarios del sistema (estudiantes, admins, super usuarios)
- **laboratories**: Laboratorios disponibles
- **computers**: Computadoras en cada laboratorio
- **reservations**: Reservas realizadas por los estudiantes

### Consultas útiles:

```sql
-- Ver todas las reservas con detalles
SELECT 
    r.id,
    u.name as estudiante,
    c.name as computadora,
    l.name as laboratorio,
    r.date,
    r.start_time,
    r.end_time,
    r.status
FROM reservations r
JOIN users u ON r.user_id = u.id
JOIN computers c ON r.computer_id = c.id
JOIN laboratories l ON c.laboratory_id = l.id
ORDER BY r.date DESC;

-- Ver computadoras por estado
SELECT 
    c.name,
    c.status,
    l.name as laboratorio
FROM computers c
JOIN laboratories l ON c.laboratory_id = l.id
ORDER BY l.name, c.name;

-- Ver estadísticas de reservas
SELECT 
    status,
    COUNT(*) as total
FROM reservations
GROUP BY status;
```

## 🔄 Actualizaciones en Tiempo Real

El sistema incluye comunicación en tiempo real mediante Socket.IO:

- **Cambios de estado de computadoras**: Los estudiantes ven inmediatamente cuando una computadora pasa a mantenimiento o se elimina
- **Gestión de reservas**: Los administradores pueden confirmar/cancelar reservas y los estudiantes ven las actualizaciones en tiempo real
- **Eliminación de laboratorios**: Los estudiantes son redirigidos automáticamente si se elimina un laboratorio

## 🛠️ Desarrollo

### Estructura del proyecto
```
proyecto_microservicios/
├── frontend/                 # Aplicación React
├── backend/                  # API Flask
├── notification_service.py   # Microservicio de notificaciones
├── notification_integration.py # Integración con el backend
├── docker-compose.yml        # Configuración de contenedores
├── init.sql                  # Script de inicialización de BD
├── NOTIFICATIONS_README.md   # Documentación del microservicio
└── README.md                 # Este archivo
```

### Variables de entorno
Las variables de entorno están configuradas en el `docker-compose.yml`:

- **Base de datos**: MySQL con usuario `reservas_user` y contraseña `reservas_password`
- **phpMyAdmin**: Acceso root con contraseña `rootpassword`
- **Backend**: Puerto 5000
- **Frontend**: Puerto 80
- **Microservicio de Notificaciones**: Puerto 5001

## 📧 Microservicio de Notificaciones

El sistema incluye un microservicio dedicado para manejar notificaciones por email y SMS:

### Características
- **Notificaciones por Email**: Usando SMTP (Gmail, Outlook, etc.)
- **Notificaciones por SMS**: Usando Twilio
- **Tipos de notificaciones**:
  - Reserva creada
  - Reserva confirmada
  - Reserva cancelada
  - Recordatorios

### Configuración
Para configurar las notificaciones, establece las siguientes variables de entorno:

```bash
# Email (Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Documentación
Para más información sobre el microservicio de notificaciones, consulta:
- [NOTIFICATIONS_README.md](NOTIFICATIONS_README.md) - Documentación completa
- [test_notifications.py](test_notifications.py) - Script de pruebas

### Pruebas
```bash
# Probar el microservicio de notificaciones
python test_notifications.py

# Health check manual
curl http://localhost:5001/api/notifications/health
```
- **phpMyAdmin**: Puerto 8080

## 🐛 Solución de Problemas

### Base de datos no inicia
```bash
# Limpiar volúmenes y reiniciar
docker-compose down -v
docker-compose up -d
```

### Problemas de conectividad
```bash
# Verificar que todos los contenedores estén corriendo
docker-compose ps

# Verificar logs de errores
docker-compose logs
```

### Reiniciar completamente
```bash
# Parar y eliminar todo
docker-compose down -v --remove-orphans

# Reconstruir imágenes
docker-compose build --no-cache

# Iniciar de nuevo
docker-compose up -d
```

## 📝 Notas

- La base de datos se inicializa automáticamente con datos de prueba
- Los cambios en la base de datos persisten entre reinicios gracias al volumen Docker
- phpMyAdmin permite gestión visual completa de la base de datos
- El sistema está optimizado para desarrollo y producción
