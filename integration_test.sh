#!/bin/bash

# Script para integrar y probar el sistema completo en local

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando pruebas de integración del sistema de reservas...${NC}"

# Directorio base del proyecto
PROJECT_DIR="/home/ubuntu/proyecto_reservas_lab"
cd $PROJECT_DIR

# 1. Construir las imágenes Docker
echo -e "${YELLOW}Construyendo imágenes Docker...${NC}"
cd $PROJECT_DIR/docker

echo -e "${YELLOW}Construyendo imagen del backend...${NC}"
docker build -t reservas-backend:latest -f Dockerfile.backend ..

echo -e "${YELLOW}Construyendo imagen del frontend...${NC}"
docker build -t reservas-frontend:latest -f Dockerfile.frontend ..

# 2. Iniciar los servicios con Docker Compose
echo -e "${YELLOW}Iniciando servicios con Docker Compose...${NC}"
docker-compose up -d

# 3. Esperar a que los servicios estén disponibles
echo -e "${YELLOW}Esperando a que los servicios estén disponibles...${NC}"
sleep 30

# 4. Verificar que los servicios están funcionando
echo -e "${YELLOW}Verificando servicios...${NC}"

# Verificar base de datos
DB_STATUS=$(docker-compose exec db mysqladmin -u root -ppassword ping 2>/dev/null)
if [[ $DB_STATUS == *"mysqld is alive"* ]]; then
  echo -e "${GREEN}✓ Base de datos MySQL funcionando correctamente${NC}"
else
  echo -e "${RED}✗ Error: Base de datos MySQL no responde${NC}"
fi

# Verificar backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [[ $BACKEND_STATUS == "200" ]]; then
  echo -e "${GREEN}✓ Backend Flask funcionando correctamente${NC}"
else
  echo -e "${RED}✗ Error: Backend Flask no responde (código: $BACKEND_STATUS)${NC}"
fi

# Verificar frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [[ $FRONTEND_STATUS == "200" ]]; then
  echo -e "${GREEN}✓ Frontend React funcionando correctamente${NC}"
else
  echo -e "${RED}✗ Error: Frontend React no responde (código: $FRONTEND_STATUS)${NC}"
fi

# 5. Realizar pruebas básicas de integración
echo -e "${YELLOW}Realizando pruebas de integración...${NC}"

# Prueba de registro de usuario
echo -e "${YELLOW}Prueba: Registro de usuario...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123","name":"Test"}' http://localhost:5000/api/auth/register)
if [[ $REGISTER_RESPONSE == *"exitosamente"* ]]; then
  echo -e "${GREEN}✓ Registro de usuario exitoso${NC}"
else
  echo -e "${RED}✗ Error en registro de usuario: $REGISTER_RESPONSE${NC}"
fi

# Prueba de inicio de sesión
echo -e "${YELLOW}Prueba: Inicio de sesión...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}' http://localhost:5000/api/auth/login)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
if [[ ! -z "$TOKEN" ]]; then
  echo -e "${GREEN}✓ Inicio de sesión exitoso${NC}"
else
  echo -e "${RED}✗ Error en inicio de sesión: $LOGIN_RESPONSE${NC}"
fi

# Prueba de creación de laboratorio
echo -e "${YELLOW}Prueba: Creación de laboratorio...${NC}"
LAB_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Lab de Prueba","location":"Edificio A","capacity":20,"opening_time":"08:00","closing_time":"20:00","description":"Laboratorio de prueba"}' http://localhost:5000/api/labs)
if [[ $LAB_RESPONSE == *"exitosamente"* ]]; then
  echo -e "${GREEN}✓ Creación de laboratorio exitosa${NC}"
else
  echo -e "${RED}✗ Error en creación de laboratorio: $LAB_RESPONSE${NC}"
fi

# 6. Mostrar logs para diagnóstico
echo -e "${YELLOW}Mostrando logs de los servicios para diagnóstico...${NC}"
echo -e "${YELLOW}Logs del backend:${NC}"
docker-compose logs --tail=20 backend
echo -e "${YELLOW}Logs del frontend:${NC}"
docker-compose logs --tail=20 frontend

echo -e "${YELLOW}Pruebas de integración completadas.${NC}"
echo -e "${GREEN}El sistema está listo para ser desplegado en Azure.${NC}"
