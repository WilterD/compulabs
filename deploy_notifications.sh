#!/bin/bash

# Script de despliegue para el microservicio de notificaciones
# Autor: Sistema de Reservas de Laboratorios

set -e  # Salir si hay algún error

echo "🚀 Desplegando microservicio de notificaciones..."
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor, instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Por favor, instala Docker Compose primero."
    exit 1
fi

print_status "Verificando archivos necesarios..."

# Verificar que existan los archivos necesarios
required_files=(
    "notification_service.py"
    "requirements_notifications.txt"
    "Dockerfile.notifications"
    "docker-compose.yml"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Archivo $file no encontrado"
        exit 1
    fi
done

print_success "Todos los archivos necesarios están presentes"

# Verificar si existe archivo .env
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado"
    print_status "Creando archivo .env desde env.example..."
    
    if [ -f "env.example" ]; then
        cp env.example .env
        print_warning "Archivo .env creado. Por favor, configura las variables de entorno antes de continuar."
        print_status "Edita el archivo .env con tus credenciales de email y SMS"
        exit 1
    else
        print_error "Archivo env.example no encontrado"
        exit 1
    fi
fi

print_status "Construyendo imagen del microservicio de notificaciones..."

# Construir la imagen
docker build -f Dockerfile.notifications -t reservas-notifications .

if [ $? -eq 0 ]; then
    print_success "Imagen construida exitosamente"
else
    print_error "Error construyendo la imagen"
    exit 1
fi

print_status "Iniciando el microservicio de notificaciones..."

# Iniciar solo el microservicio de notificaciones
docker-compose up -d notifications

if [ $? -eq 0 ]; then
    print_success "Microservicio de notificaciones iniciado"
else
    print_error "Error iniciando el microservicio"
    exit 1
fi

# Esperar un poco para que el servicio esté listo
print_status "Esperando a que el servicio esté listo..."
sleep 10

# Verificar que el servicio esté funcionando
print_status "Verificando estado del servicio..."

max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:5001/api/notifications/health > /dev/null 2>&1; then
        print_success "Microservicio de notificaciones está funcionando correctamente"
        break
    else
        print_status "Intento $attempt/$max_attempts: Esperando a que el servicio esté listo..."
        sleep 2
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    print_error "El servicio no respondió después de $max_attempts intentos"
    print_status "Verificando logs del servicio..."
    docker-compose logs notifications
    exit 1
fi

# Mostrar información del servicio
print_status "Información del servicio:"
echo "  - URL: http://localhost:5001"
echo "  - Health Check: http://localhost:5001/api/notifications/health"
echo "  - Documentación: NOTIFICATIONS_README.md"

# Verificar configuración
print_status "Verificando configuración..."

health_response=$(curl -s http://localhost:5001/api/notifications/health)
email_configured=$(echo $health_response | grep -o '"email_configured":[^,]*' | cut -d':' -f2)
sms_configured=$(echo $health_response | grep -o '"sms_configured":[^,]*' | cut -d':' -f2)

if [ "$email_configured" = "true" ]; then
    print_success "Email configurado correctamente"
else
    print_warning "Email no configurado - configura SMTP_USER y SMTP_PASSWORD en .env"
fi

if [ "$sms_configured" = "true" ]; then
    print_success "SMS configurado correctamente"
else
    print_warning "SMS no configurado - configura las variables de Twilio en .env"
fi

print_status "Ejecutando pruebas básicas..."

# Ejecutar script de pruebas si existe
if [ -f "test_notifications.py" ]; then
    python test_notifications.py
else
    print_warning "Script de pruebas no encontrado"
fi

echo ""
print_success "Despliegue completado exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "  1. Configura las variables de entorno en .env"
echo "  2. Reinicia el servicio: docker-compose restart notifications"
echo "  3. Ejecuta las pruebas: python test_notifications.py"
echo "  4. Consulta la documentación: NOTIFICATIONS_README.md"
echo ""
echo "🔗 URLs útiles:"
echo "  - Health Check: http://localhost:5001/api/notifications/health"
echo "  - Logs: docker-compose logs notifications"
echo "  - Estado: docker-compose ps" 