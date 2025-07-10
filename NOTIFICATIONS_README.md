# Microservicio de Notificaciones

Este microservicio se encarga de manejar todas las notificaciones del sistema de reservas de laboratorios, incluyendo emails y SMS.

## 🚀 Características

- **Notificaciones por Email**: Usando SMTP (Gmail, Outlook, etc.)
- **Notificaciones por SMS**: Usando Twilio
- **Múltiples tipos de notificaciones**:
  - Reserva creada
  - Reserva confirmada
  - Reserva cancelada
  - Recordatorios
- **Health Check**: Endpoint para verificar el estado del servicio
- **Logging**: Sistema de logs detallado
- **Configuración flexible**: Variables de entorno para todas las configuraciones

## 📋 Endpoints

### Health Check
```
GET /api/notifications/health
```
Verifica el estado del servicio y la configuración de email/SMS.

### Notificaciones de Reservas

#### Reserva Creada
```
POST /api/notifications/reservation-created
```
Notifica cuando se crea una nueva reserva.

**Body:**
```json
{
  "user_id": 123,
  "reservation_data": {
    "computer_name": "PC-A01",
    "laboratory_name": "Laboratorio de Informática A",
    "date": "2024-01-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "status": "Pendiente"
  },
  "token": "jwt_token_here"
}
```

#### Reserva Confirmada
```
POST /api/notifications/reservation-confirmed
```
Notifica cuando se confirma una reserva.

#### Reserva Cancelada
```
POST /api/notifications/reservation-cancelled
```
Notifica cuando se cancela una reserva.

**Body:**
```json
{
  "user_id": 123,
  "reservation_data": {
    "computer_name": "PC-A01",
    "laboratory_name": "Laboratorio de Informática A",
    "date": "2024-01-15",
    "start_time": "14:00",
    "end_time": "16:00"
  },
  "token": "jwt_token_here",
  "reason": "Mantenimiento programado"
}
```

#### Recordatorio
```
POST /api/notifications/reminder
```
Envía recordatorios de reservas próximas.

#### Prueba de Notificaciones
```
POST /api/notifications/test
```
Prueba el sistema de notificaciones.

**Body:**
```json
{
  "email": "test@example.com",
  "phone": "+1234567890"
}
```

## 🔧 Configuración

### Variables de Entorno

#### Email (SMTP)
- `SMTP_SERVER`: Servidor SMTP (default: smtp.gmail.com)
- `SMTP_PORT`: Puerto SMTP (default: 587)
- `SMTP_USER`: Email del remitente
- `SMTP_PASSWORD`: Contraseña de aplicación

#### SMS (Twilio)
- `TWILIO_ACCOUNT_SID`: Account SID de Twilio
- `TWILIO_AUTH_TOKEN`: Auth Token de Twilio
- `TWILIO_PHONE_NUMBER`: Número de teléfono de Twilio

#### Otros
- `BACKEND_URL`: URL del backend principal (default: http://backend:5000)

### Configuración de Gmail

Para usar Gmail como servidor SMTP:

1. Activa la verificación en dos pasos en tu cuenta de Google
2. Genera una contraseña de aplicación:
   - Ve a Configuración de la cuenta de Google
   - Seguridad > Verificación en dos pasos > Contraseñas de aplicación
   - Genera una nueva contraseña para "Correo"
3. Usa tu email de Gmail como `SMTP_USER` y la contraseña de aplicación como `SMTP_PASSWORD`

### Configuración de Twilio

1. Crea una cuenta en [Twilio](https://www.twilio.com/)
2. Obtén tu Account SID y Auth Token del dashboard
3. Compra un número de teléfono en Twilio
4. Configura las variables de entorno correspondientes

## 🐳 Docker

### Construir la imagen
```bash
docker build -f Dockerfile.notifications -t reservas-notifications .
```

### Ejecutar con Docker Compose
```bash
# Ejecutar solo el microservicio de notificaciones
docker-compose up notifications

# Ejecutar todos los servicios
docker-compose up -d
```

### Variables de entorno en Docker Compose
```yaml
environment:
  SMTP_SERVER: smtp.gmail.com
  SMTP_PORT: 587
  SMTP_USER: tu_email@gmail.com
  SMTP_PASSWORD: tu_app_password
  TWILIO_ACCOUNT_SID: tu_account_sid
  TWILIO_AUTH_TOKEN: tu_auth_token
  TWILIO_PHONE_NUMBER: +1234567890
  BACKEND_URL: http://backend:5000
```

## ☸️ Kubernetes

### Aplicar la configuración
```bash
# Crear ConfigMap y Secrets
kubectl apply -f notifications-config.yaml
kubectl apply -f notifications-secrets.yaml

# Desplegar el servicio
kubectl apply -f notifications-deployment.yaml
kubectl apply -f notifications-service.yaml
```

### Configurar Secrets
Antes de aplicar los secrets, codifica tus credenciales en base64:

```bash
echo -n "tu_email@gmail.com" | base64
echo -n "tu_app_password" | base64
echo -n "tu_twilio_account_sid" | base64
echo -n "tu_twilio_auth_token" | base64
echo -n "+1234567890" | base64
```

Luego actualiza el archivo `notifications-secrets.yaml` con los valores codificados.

## 🔗 Integración con el Backend Principal

Para integrar este microservicio con el backend principal:

1. Copia el archivo `notification_integration.py` al directorio del backend
2. Importa las funciones de notificación en tus blueprints:

```python
from notification_integration import (
    safe_notify_reservation_created,
    safe_notify_reservation_confirmed,
    safe_notify_reservation_cancelled
)

# En tu endpoint de crear reserva
@reservation_bp.route('', methods=['POST'])
@token_required
def create_reservation(current_user):
    # ... lógica de creación de reserva ...
    
    # Enviar notificación
    reservation_data = {
        'computer_name': computer.name,
        'laboratory_name': computer.laboratory.name,
        'date': reservation.start_time.strftime('%Y-%m-%d'),
        'start_time': reservation.start_time.strftime('%H:%M'),
        'end_time': reservation.end_time.strftime('%H:%M'),
        'status': reservation.status
    }
    
    safe_notify_reservation_created(
        current_user.id, 
        reservation_data, 
        request.headers.get('Authorization', '').split(' ')[1]
    )
    
    return jsonify({'message': 'Reserva creada exitosamente'}), 201
```

## 📊 Monitoreo

### Health Check
El endpoint `/api/notifications/health` devuelve:

```json
{
  "status": "ok",
  "service": "notification-service",
  "timestamp": "2024-01-15T10:30:00",
  "email_configured": true,
  "sms_configured": false
}
```

### Logs
El servicio registra logs detallados de todas las operaciones:

```bash
# Ver logs del contenedor
docker logs reservas_notifications

# Ver logs en Kubernetes
kubectl logs -l app=reservas-notifications
```

## 🧪 Pruebas

### Probar el servicio manualmente
```bash
# Health check
curl http://localhost:5001/api/notifications/health

# Probar notificación
curl -X POST http://localhost:5001/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phone": "+1234567890"}'
```

### Probar desde el backend
```python
from notification_integration import test_notification

# Probar email
test_notification("test@example.com")

# Probar email y SMS
test_notification("test@example.com", "+1234567890")
```

## 🔒 Seguridad

- Las credenciales se manejan a través de variables de entorno
- En Kubernetes, se usan Secrets para las credenciales sensibles
- El servicio no almacena información sensible
- Las comunicaciones con el backend principal usan JWT para autenticación

## 🚨 Troubleshooting

### Error de conexión SMTP
- Verifica que las credenciales de Gmail sean correctas
- Asegúrate de usar una contraseña de aplicación, no tu contraseña normal
- Verifica que la verificación en dos pasos esté activada

### Error de Twilio
- Verifica que el Account SID y Auth Token sean correctos
- Asegúrate de que el número de teléfono esté verificado en Twilio
- Verifica que tengas saldo en tu cuenta de Twilio

### Error de conexión con el backend
- Verifica que la URL del backend sea correcta
- Asegúrate de que el backend esté ejecutándose
- Verifica la conectividad de red entre los servicios

## 📈 Escalabilidad

El microservicio está diseñado para ser escalable:

- **Múltiples réplicas**: Puede ejecutar múltiples instancias
- **Stateless**: No mantiene estado, por lo que es fácil de escalar
- **Health checks**: Kubernetes puede reiniciar pods fallidos automáticamente
- **Resource limits**: Configurado con límites de CPU y memoria 