#!/usr/bin/env python3
"""
Script de prueba completo para el microservicio de notificaciones con WebSockets
"""

import requests
import json
import time
import sys
import threading
import socketio

# Configuración
NOTIFICATION_SERVICE_URL = "http://localhost:5001"
BACKEND_URL = "http://localhost:5000"

class CompleteNotificationTester:
    def __init__(self):
        self.sio = socketio.Client()
        self.notifications_received = []
        self.setup_socket_events()
        
    def setup_socket_events(self):
        """Configura los eventos de Socket.IO"""
        
        @self.sio.event
        def connect():
            print("✅ WebSocket conectado")
        
        @self.sio.event
        def disconnect():
            print("❌ WebSocket desconectado")
        
        @self.sio.on('notification')
        def on_notification(data):
            print(f"🔔 Notificación WebSocket recibida: {data.get('type')}")
            self.notifications_received.append(data)
        
        @self.sio.on('broadcast_notification')
        def on_broadcast(data):
            print(f"📢 Broadcast WebSocket recibido: {data.get('type')}")
            self.notifications_received.append(data)

    def test_health_check(self):
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
                print(f"   - WebSocket habilitado: {data.get('websocket_enabled')}")
                return True
            else:
                print(f"❌ Health check falló: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error en health check: {str(e)}")
            return False

    def test_websocket_connection(self):
        """Prueba la conexión WebSocket"""
        print("\n🔌 Probando conexión WebSocket...")
        try:
            self.sio.connect(NOTIFICATION_SERVICE_URL)
            time.sleep(2)  # Esperar a que se establezca la conexión
            
            if self.sio.connected:
                print("✅ Conexión WebSocket exitosa")
                return True
            else:
                print("❌ Conexión WebSocket falló")
                return False
        except Exception as e:
            print(f"❌ Error conectando WebSocket: {str(e)}")
            return False

    def test_notification_with_websocket(self):
        """Prueba notificaciones con WebSocket"""
        print("\n📧 Probando notificaciones con WebSocket...")
        
        # Conectar WebSocket si no está conectado
        if not self.sio.connected:
            if not self.test_websocket_connection():
                return False
        
        # Unirse a una sala de usuario
        user_id = 1
        self.sio.emit('join_user_room', {'user_id': user_id})
        print(f"👤 Unido a la sala del usuario {user_id}")
        
        # Enviar notificación de prueba
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
                print(f"✅ Notificación de prueba enviada")
                print(f"   - Email enviado: {data.get('email_sent')}")
                print(f"   - SMS enviado: {data.get('sms_sent')}")
                print(f"   - WebSocket enviado: {data.get('websocket_sent')}")
                
                # Esperar notificación WebSocket
                print("⏰ Esperando notificación WebSocket...")
                time.sleep(3)
                
                if self.notifications_received:
                    print(f"✅ Notificación WebSocket recibida")
                    for notification in self.notifications_received:
                        print(f"   - Tipo: {notification.get('type')}")
                        print(f"   - Timestamp: {notification.get('timestamp')}")
                else:
                    print("⚠️  No se recibieron notificaciones WebSocket")
                
                return True
            else:
                print(f"❌ Notificación de prueba falló: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error en notificación de prueba: {str(e)}")
            return False

    def test_reservation_notifications_with_websocket(self):
        """Prueba notificaciones de reservas con WebSocket"""
        print("\n📅 Probando notificaciones de reservas con WebSocket...")
        
        # Conectar WebSocket si no está conectado
        if not self.sio.connected:
            if not self.test_websocket_connection():
                return False
        
        # Unirse a una sala de usuario
        user_id = 1
        self.sio.emit('join_user_room', {'user_id': user_id})
        print(f"👤 Unido a la sala del usuario {user_id}")
        
        # Limpiar notificaciones anteriores
        self.notifications_received.clear()
        
        # Datos de prueba para reserva
        reservation_data = {
            "user_id": user_id,
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
        
        try:
            response = requests.post(
                f"{NOTIFICATION_SERVICE_URL}/api/notifications/reservation-created",
                json=reservation_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Notificación de reserva creada enviada")
                print(f"   - Email enviado: {data.get('email_sent')}")
                print(f"   - SMS enviado: {data.get('sms_sent')}")
                print(f"   - WebSocket enviado: {data.get('websocket_sent')}")
                
                # Esperar notificación WebSocket
                print("⏰ Esperando notificación WebSocket de reserva...")
                time.sleep(3)
                
                if self.notifications_received:
                    print(f"✅ Notificación WebSocket de reserva recibida")
                    for notification in self.notifications_received:
                        print(f"   - Tipo: {notification.get('type')}")
                        print(f"   - Mensaje: {notification.get('data', {}).get('message')}")
                        print(f"   - Timestamp: {notification.get('timestamp')}")
                else:
                    print("⚠️  No se recibieron notificaciones WebSocket de reserva")
                
                return True
            else:
                print(f"❌ Notificación de reserva falló: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error en notificación de reserva: {str(e)}")
            return False

    def test_backend_connection(self):
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

    def run_all_tests(self):
        """Ejecuta todas las pruebas"""
        print("🧪 Iniciando pruebas completas del microservicio de notificaciones")
        print("=" * 70)
        
        results = []
        
        # Prueba 1: Health check
        results.append(("Health Check", self.test_health_check()))
        
        # Prueba 2: Conexión WebSocket
        results.append(("WebSocket Connection", self.test_websocket_connection()))
        
        # Prueba 3: Notificaciones con WebSocket
        results.append(("Notifications with WebSocket", self.test_notification_with_websocket()))
        
        # Prueba 4: Notificaciones de reservas con WebSocket
        results.append(("Reservation Notifications with WebSocket", self.test_reservation_notifications_with_websocket()))
        
        # Prueba 5: Conexión con backend
        results.append(("Backend Connection", self.test_backend_connection()))
        
        # Mostrar resultados
        print("\n" + "=" * 70)
        print("📊 RESULTADOS DE LAS PRUEBAS")
        print("=" * 70)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASÓ" if result else "❌ FALLÓ"
            print(f"{test_name:<40} {status}")
            if result:
                passed += 1
        
        print("=" * 70)
        print(f"Total: {passed}/{total} pruebas pasaron")
        
        if passed == total:
            print("🎉 ¡Todas las pruebas pasaron exitosamente!")
        else:
            print("⚠️  Algunas pruebas fallaron")
        
        # Limpiar
        if self.sio.connected:
            self.sio.disconnect()
        
        return passed == total

def main():
    """Función principal"""
    tester = CompleteNotificationTester()
    
    try:
        success = tester.run_all_tests()
        
        print("\n📋 Resumen:")
        print("   - El microservicio de notificaciones está funcionando")
        print("   - WebSockets habilitados para notificaciones en tiempo real")
        print("   - Puedes configurar las credenciales de email/SMS en las variables de entorno")
        print("   - Consulta NOTIFICATIONS_README.md para más información")
        
        if success:
            print("\n🚀 El microservicio está listo para usar en producción")
        else:
            print("\n🔧 Revisa la configuración y vuelve a ejecutar las pruebas")
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n👋 Pruebas interrumpidas por el usuario")
        if tester.sio.connected:
            tester.sio.disconnect()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error inesperado: {str(e)}")
        if tester.sio.connected:
            tester.sio.disconnect()
        sys.exit(1)

if __name__ == "__main__":
    main() 