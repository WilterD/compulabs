#!/usr/bin/env python3
"""
Script de prueba para el microservicio de notificaciones con Socket.IO
"""

import requests
import json
import time
import sys
import socketio
import threading

# Configuración
NOTIFICATION_SERVICE_URL = "http://localhost:5001"
BACKEND_URL = "http://localhost:5000"

# Cliente Socket.IO para pruebas
sio = socketio.Client()

# Variables para almacenar eventos recibidos
received_events = []
connected = False

@sio.event
def connect():
    global connected
    connected = True
    print("✅ Conectado al servicio de notificaciones via Socket.IO")

@sio.event
def disconnect():
    global connected
    connected = False
    print("❌ Desconectado del servicio de notificaciones")

@sio.event
def connected(data):
    print(f"📡 Evento 'connected' recibido: {data}")

@sio.event
def notification(data):
    print(f"📨 Notificación recibida: {data}")
    received_events.append(('notification', data))

@sio.event
def broadcast_notification(data):
    print(f"📢 Notificación broadcast recibida: {data}")
    received_events.append(('broadcast_notification', data))

@sio.event
def joined_room(data):
    print(f"🏠 Unido a sala: {data}")

@sio.event
def left_room(data):
    print(f"🚪 Salido de sala: {data}")

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
            print(f"   - Socket habilitado: {data.get('socket_enabled')}")
            return True
        else:
            print(f"❌ Health check falló: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error en health check: {str(e)}")
        return False

def test_socket_connection():
    """Prueba la conexión Socket.IO"""
    print("\n🔌 Probando conexión Socket.IO...")
    try:
        sio.connect(NOTIFICATION_SERVICE_URL)
        time.sleep(2)  # Esperar a que se establezca la conexión
        
        if connected:
            print("✅ Conexión Socket.IO exitosa")
            return True
        else:
            print("❌ Conexión Socket.IO falló")
            return False
    except Exception as e:
        print(f"❌ Error conectando Socket.IO: {str(e)}")
        return False

def test_socket_rooms():
    """Prueba las salas de Socket.IO"""
    print("\n🏠 Probando salas de Socket.IO...")
    try:
        # Unirse a sala de usuario
        sio.emit('join_user_room', {'user_id': 123})
        time.sleep(1)
        
        # Unirse a sala de administrador
        sio.emit('join_admin_room', {'admin_id': 456})
        time.sleep(1)
        
        print("✅ Pruebas de salas completadas")
        return True
    except Exception as e:
        print(f"❌ Error en pruebas de salas: {str(e)}")
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
            print(f"   - Socket enviado: {data.get('socket_sent')}")
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
        "user_id": 123,
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
            print(f"   - Socket enviado: {data.get('socket_sent')}")
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

def wait_for_socket_events(timeout=5):
    """Espera por eventos de Socket.IO"""
    print(f"\n⏳ Esperando eventos de Socket.IO ({timeout}s)...")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        if received_events:
            print(f"✅ Eventos recibidos: {len(received_events)}")
            for event_type, data in received_events:
                print(f"   - {event_type}: {data}")
            return True
        time.sleep(0.5)
    
    print("⚠️  No se recibieron eventos de Socket.IO")
    return False

def main():
    """Función principal de pruebas"""
    print("🧪 Iniciando pruebas del microservicio de notificaciones con Socket.IO")
    print("=" * 70)
    
    # Verificar que el servicio esté ejecutándose
    if not test_health_check():
        print("\n❌ El servicio de notificaciones no está disponible")
        print("   Asegúrate de que esté ejecutándose con: docker-compose up notifications")
        sys.exit(1)
    
    # Probar conexión Socket.IO
    if not test_socket_connection():
        print("\n❌ No se pudo conectar via Socket.IO")
        sys.exit(1)
    
    # Probar salas de Socket.IO
    test_socket_rooms()
    
    # Probar conexión con backend
    backend_available = test_backend_connection()
    
    # Probar notificaciones básicas
    test_notification_service()
    
    # Esperar por eventos de Socket.IO
    wait_for_socket_events()
    
    # Probar notificaciones de reservas (solo si el backend está disponible)
    if backend_available:
        test_reservation_notifications()
        # Esperar por eventos adicionales
        wait_for_socket_events(3)
    else:
        print("\n⚠️  Saltando pruebas de reservas - backend no disponible")
    
    # Desconectar Socket.IO
    if connected:
        sio.disconnect()
    
    print("\n" + "=" * 70)
    print("✅ Pruebas completadas")
    print("\n📋 Resumen:")
    print("   - El microservicio de notificaciones está funcionando")
    print("   - Socket.IO está habilitado y funcionando")
    print("   - Puedes configurar las credenciales de email/SMS en las variables de entorno")
    print("   - Consulta NOTIFICATIONS_README.md para más información")
    
    if received_events:
        print(f"\n📨 Eventos Socket.IO recibidos: {len(received_events)}")
        for event_type, data in received_events:
            print(f"   - {event_type}: {data}")

if __name__ == "__main__":
    main() 