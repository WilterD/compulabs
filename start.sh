#!/bin/bash

# Script de inicio para el backend
echo "Iniciando servicio de backend..."

# Esperar a que la base de datos esté disponible
echo "Esperando a que la base de datos esté disponible..."
python wait_for_db.py

if [ $? -ne 0 ]; then
    echo "Error: No se pudo conectar a la base de datos después de varios intentos"
    exit 1
fi

echo "Base de datos disponible. Iniciando aplicación Flask..."

# Iniciar la aplicación Flask
exec python main.py 