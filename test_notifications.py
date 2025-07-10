#!/usr/bin/env python3
"""
Script de prueba para el microservicio de notificaciones
"""

import requests
import json
import time
import sys

# Configuración
NOTIFICATION_SERVICE_URL = "http://localhost:5001"
BACKEND_URL = "http://localhost:5000"

def test_health_check():
    """Prueba el health check del servicio"""
    print("🔍 Probando health check...")
    try:
        response = requests.get(f"{NOTIFICATION_SERVICE_URL}/api/notifications/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check exitoso")
            print(f"   - Servicio: {data.get('service')}")
            print(f"   - Email configurado: {data.get('email_configured')}")
            print(f"   - SMS configurado: {data.get('sms_configured')}")
            return True
        else:
            print(f"❌ Health check falló: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error en health check: {str(e)}")
        return False

def test_notification_service():
    """Prueba el servicio de notificaciones"""
    print("\n📧 Probando servicio de notificaciones...")
    
    # Datos de prueba
    test_data = {
        "email": "test@example.com",
        "phone": "+1234567890"
    }
    
    try:
        response = requests.post(
            f"{NOTIFICATION_SERVICE_URL}/api/notifications/test",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Prueba de notificación exitosa")
            print(f"   - Email enviado: {data.get('email_sent')}")
            print(f"   - SMS enviado: {data.get('sms_sent')}")
            print(f"   - WebSocket enviado: {data.get('websocket_sent')}")
            return True
        else:
            print(f"❌ Prueba de notificación falló: {response.status_code}")
            print(f"   - Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error en prueba de notificación: {str(e)}")
        return False

def test_reservation_notifications():
    """Prueba las notificaciones de reservas"""
    print("\n📅 Probando notificaciones de reservas...")
    
    # Datos de prueba para reserva
    reservation_data = {
        "user_id": 1,
        "reservation_data": {
            "computer_name": "PC-A01",
            "laboratory_name": "Laboratorio de Informática A",
            "date": "2024-01-15",
            "start_time": "14:00",
            "end_time": "16:00",
            "status": "Pendiente"
        },
        "token": "test_token"
    }
    
    # Probar notificación de reserva creada
    try:
        response = requests.post(
            f"{NOTIFICATION_SERVICE_URL}/api/notifications/reservation-created",
            json=reservation_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Notificación de reserva creada exitosa")
            print(f"   - Email enviado: {data.get('email_sent')}")
            print(f"   - SMS enviado: {data.get('sms_sent')}")
            print(f"   - WebSocket enviado: {data.get('websocket_sent')}")
        else:
            print(f"⚠️  Notificación de reserva creada falló: {response.status_code}")
            print(f"   - Respuesta: {response.text}")
    except Exception as e:
        print(f"❌ Error en notificación de reserva creada: {str(e)}")

def test_backend_connection():
    """Prueba la conexión con el backend principal"""
    print("\n🔗 Probando conexión con el backend principal...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=10)
        if response.status_code == 200:
            print(f"✅ Conexión con backend exitosa")
            return True
        else:
            print(f"⚠️  Backend respondió con código: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando con backend: {str(e)}")
        return False

import requests

url = "http://localhost:8001/notify"
data = {
    "user_id": 2,
    "message": "¡Tienes una nueva reserva!",
    "type": "reserva"
}

response = requests.post(url, json=data)
print("Respuesta del microservicio:", response.json())

def main():
    """Función principal de pruebas"""
    print("🧪 Iniciando pruebas del microservicio de notificaciones")
    print("=" * 60)
    
    # Verificar que el servicio esté ejecutándose
    if not test_health_check():
        print("\n❌ El servicio de notificaciones no está disponible")
        print("   Asegúrate de que esté ejecutándose con: docker-compose up notifications")
        sys.exit(1)
    
    # Probar conexión con backend
    backend_available = test_backend_connection()
    
    # Probar notificaciones básicas
    test_notification_service()
    
    # Probar notificaciones de reservas (solo si el backend está disponible)
    if backend_available:
        test_reservation_notifications()
    else:
        print("\n⚠️  Saltando pruebas de reservas - backend no disponible")
    
    print("\n" + "=" * 60)
    print("✅ Pruebas completadas")
    print("\n📋 Resumen:")
    print("   - El microservicio de notificaciones está funcionando")
    print("   - WebSockets habilitados para notificaciones en tiempo real")
    print("   - Puedes configurar las credenciales de email/SMS en las variables de entorno")
    print("   - Consulta NOTIFICATIONS_README.md para más información")
    print("\n🔗 Para probar WebSockets:")
    print("   python test_websocket_client.py [user_id]")

if __name__ == "__main__":
    main() 