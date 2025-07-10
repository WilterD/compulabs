# Configuración Docker - Sistema de Reserva de Computadoras

## Servicios Incluidos

- **MySQL 8.0**: Base de datos principal
- **phpMyAdmin 5.2.1**: Interfaz web para administrar la base de datos
- **Backend Flask**: API REST con Socket.IO
- **Frontend React**: Interfaz de usuario
- **Nginx**: Servidor web y proxy reverso

## Características de Seguridad y Estabilidad

### Base de Datos (MySQL)
- ✅ Configuraciones de seguridad avanzadas
- ✅ Logging completo (error, general, slow queries)
- ✅ Reintentos de conexión automáticos
- ✅ Configuraciones de rendimiento optimizadas
- ✅ Health checks automáticos

### phpMyAdmin
- ✅ Configuraciones de seguridad
- ✅ Límites de upload y ejecución
- ✅ Logging de errores
- ✅ Timeouts configurables
- ✅ Reintentos de conexión

### Backend
- ✅ Reintentos de conexión a la base de datos
- ✅ Health checks automáticos
- ✅ Logging estructurado
- ✅ Configuraciones de seguridad Flask

## Comandos de Ejecución

### 1. Construir todas las imágenes
```bash
docker-compose build
```

### 2. Levantar todos los servicios
```bash
docker-compose up -d
```

### 3. Ver logs en tiempo real
```bash
docker-compose logs -f
```

### 4. Ver logs de un servicio específico
```bash
docker-compose logs -f backend
docker-compose logs -f db
docker-compose logs -f phpmyadmin
```

### 5. Detener todos los servicios
```bash
docker-compose down
```

### 6. Reconstruir y levantar (después de cambios)
```bash
docker-compose up --build -d
```

## Acceso a los Servicios

| Servicio | URL | Puerto | Descripción |
|----------|-----|--------|-------------|
| Frontend | http://localhost | 80 | Interfaz principal de usuario |
| Backend API | http://localhost:5000 | 5000 | API REST directa |
| Backend API (via Nginx) | http://localhost/api/ | 80 | API REST a través de proxy |
| phpMyAdmin | http://localhost:8080 | 8080 | Administración de base de datos |
| MySQL | localhost | 3306 | Base de datos directa |

## Credenciales por Defecto

### Base de Datos
- **Host**: db (interno) / localhost (externo)
- **Puerto**: 3306
- **Base de datos**: reservas_db
- **Usuario**: reservas_user
- **Contraseña**: reservas_password
- **Root**: password

### phpMyAdmin
- **Usuario**: reservas_user
- **Contraseña**: reservas_password

## Configuraciones de Seguridad

### MySQL
- Autenticación nativa MySQL
- Configuraciones de SQL mode estricto
- Logging de consultas lentas
- Límites de conexiones
- Configuraciones de InnoDB optimizadas

### phpMyAdmin
- Configuraciones de timeout
- Límites de upload (64MB)
- Logging de errores habilitado
- Configuraciones de sesión seguras

### Backend
- Variables de entorno para reintentos
- Health checks automáticos
- Logging estructurado
- Configuraciones de seguridad Flask

## Volúmenes de Datos

- `mysql_data`: Datos de MySQL
- `mysql_logs`: Logs de MySQL
- `backend_logs`: Logs del backend
- `phpmyadmin_data`: Datos de phpMyAdmin

## Troubleshooting

### Problemas de Conexión a la Base de Datos
```bash
# Verificar estado de la base de datos
docker-compose logs db

# Conectar directamente a MySQL
docker-compose exec db mysql -u reservas_user -p reservas_db

# Verificar logs de phpMyAdmin
docker-compose logs phpmyadmin
```

### Problemas del Backend
```bash
# Verificar logs del backend
docker-compose logs backend

# Acceder al contenedor del backend
docker-compose exec backend bash

# Verificar health check
docker-compose exec backend curl -f http://localhost:5000/health
```

### Reiniciar Servicios Específicos
```bash
# Reiniciar solo la base de datos
docker-compose restart db

# Reiniciar solo el backend
docker-compose restart backend

# Reiniciar solo phpMyAdmin
docker-compose restart phpmyadmin
```

## Desarrollo

### Modificar Configuraciones
- **MySQL**: Editar `mysql.cnf`
- **phpMyAdmin**: Modificar variables de entorno en `docker-compose.yml`
- **Backend**: Modificar variables de entorno en `docker-compose.yml`

### Agregar Nuevos Servicios
1. Agregar el servicio en `docker-compose.yml`
2. Configurar dependencias con `depends_on`
3. Agregar a la red `reservas_network`
4. Configurar health checks si es necesario

## Monitoreo

### Health Checks
Todos los servicios incluyen health checks automáticos:
- **MySQL**: Ping a la base de datos
- **Backend**: Endpoint `/health`
- **phpMyAdmin**: Verificación de disponibilidad web

### Logs
Los logs están disponibles para todos los servicios:
```bash
# Ver todos los logs
docker-compose logs

# Ver logs de un servicio específico
docker-compose logs [servicio]

# Seguir logs en tiempo real
docker-compose logs -f [servicio]
``` 