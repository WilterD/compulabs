"""
Script de integración para conectar el backend principal con el microservicio de notificaciones.
Este archivo debe ser importado en los blueprints del backend principal.
"""

import requests
import logging
import os
from functools import wraps

# Configuración
NOTIFICATION_SERVICE_URL = os.getenv('NOTIFICATION_SERVICE_URL', 'http://notifications:5001')
logger = logging.getLogger(__name__)

def send_notification(notification_type, data):
    """
    Envía una notificación al microservicio de notificaciones
    
    Args:
        notification_type (str): Tipo de notificación ('reservation-created', 'reservation-confirmed', etc.)
        data (dict): Datos de la notificación
    """
    try:
        url = f"{NOTIFICATION_SERVICE_URL}/api/notifications/{notification_type}"
        response = requests.post(url, json=data, timeout=10)
        
        if response.status_code == 200:
            logger.info(f"Notificación {notification_type} enviada exitosamente")
            return True
        else:
            logger.error(f"Error enviando notificación {notification_type}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error de conexión con el servicio de notificaciones: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error inesperado enviando notificación: {str(e)}")
        return False

def notify_reservation_created(user_id, reservation_data, token):
    """Notifica cuando se crea una nueva reserva"""
    data = {
        'user_id': user_id,
        'reservation_data': reservation_data,
        'token': token
    }
    return send_notification('reservation-created', data)

def notify_reservation_confirmed(user_id, reservation_data, token):
    """Notifica cuando se confirma una reserva"""
    data = {
        'user_id': user_id,
        'reservation_data': reservation_data,
        'token': token
    }
    return send_notification('reservation-confirmed', data)

def notify_reservation_cancelled(user_id, reservation_data, token, reason="No especificada"):
    """Notifica cuando se cancela una reserva"""
    data = {
        'user_id': user_id,
        'reservation_data': reservation_data,
        'token': token,
        'reason': reason
    }
    return send_notification('reservation-cancelled', data)

def send_reminder(user_id, reservation_data, token):
    """Envía un recordatorio de reserva"""
    data = {
        'user_id': user_id,
        'reservation_data': reservation_data,
        'token': token
    }
    return send_notification('reminder', data)

def test_notification(email, phone=None):
    """Prueba el sistema de notificaciones"""
    data = {
        'email': email,
        'phone': phone
    }
    return send_notification('test', data)

# Decorador para manejar errores de notificaciones
def handle_notification_errors(func):
    """Decorador que maneja errores de notificaciones sin afectar la funcionalidad principal"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error en notificación durante {func.__name__}: {str(e)}")
            # No lanzar la excepción para no afectar la funcionalidad principal
            return False
    return wrapper

# Funciones decoradas para uso seguro
@handle_notification_errors
def safe_notify_reservation_created(user_id, reservation_data, token):
    return notify_reservation_created(user_id, reservation_data, token)

@handle_notification_errors
def safe_notify_reservation_confirmed(user_id, reservation_data, token):
    return notify_reservation_confirmed(user_id, reservation_data, token)

@handle_notification_errors
def safe_notify_reservation_cancelled(user_id, reservation_data, token, reason="No especificada"):
    return notify_reservation_cancelled(user_id, reservation_data, token, reason)

@handle_notification_errors
def safe_send_reminder(user_id, reservation_data, token):
    return send_reminder(user_id, reservation_data, token) 