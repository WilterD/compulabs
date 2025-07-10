#!/usr/bin/env python3
"""
Script para esperar a que la base de datos esté disponible con reintentos
"""
import os
import time
import pymysql
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def wait_for_database():
    """Espera a que la base de datos esté disponible con reintentos"""
    
    # Obtener variables de entorno
    db_host = os.getenv('DB_HOST', 'db')
    db_port = int(os.getenv('DB_PORT', 3306))
    db_name = os.getenv('DB_NAME', 'reservas_db')
    db_user = os.getenv('DB_USERNAME', 'reservas_user')
    db_password = os.getenv('DB_PASSWORD', 'reservas_password')
    
    # Configuraciones de reintentos
    max_attempts = int(os.getenv('DB_RETRY_ATTEMPTS', 5))
    retry_delay = int(os.getenv('DB_RETRY_DELAY', 3))
    connection_timeout = int(os.getenv('DB_CONNECTION_TIMEOUT', 30))
    
    logger.info(f"Esperando conexión a la base de datos en {db_host}:{db_port}")
    logger.info(f"Configuración: {max_attempts} intentos, {retry_delay}s entre intentos")
    
    for attempt in range(1, max_attempts + 1):
        try:
            logger.info(f"Intento {attempt}/{max_attempts} de conexión a la base de datos...")
            
            # Intentar conexión
            connection = pymysql.connect(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_password,
                database=db_name,
                connect_timeout=connection_timeout,
                autocommit=True
            )
            
            if connection:
                logger.info("¡Conexión exitosa!")
                connection.close()
                return True
                
        except Exception as e:
            logger.warning(f"Error en intento {attempt}: {e}")
            
            if attempt < max_attempts:
                logger.info(f"Esperando {retry_delay} segundos antes del siguiente intento...")
                time.sleep(retry_delay)
            else:
                logger.error(f"Falló la conexión después de {max_attempts} intentos")
                return False
    
    return False

if __name__ == "__main__":
    success = wait_for_database()
    if not success:
        exit(1)
    else:
        logger.info("Base de datos lista para usar") 