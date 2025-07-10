#!/usr/bin/env python3
"""
Script de prueba para verificar las estadísticas del dashboard del administrador
"""

import requests
import json
import sys

# Configuración
BACKEND_URL = "http://localhost:5000/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

def test_admin_login():
    """Prueba el login del administrador"""
    print("🔐 Probando login del administrador...")
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login exitoso")
            print(f"   - Usuario: {data.get('user', {}).get('name')}")
            print(f"   - Rol: {data.get('user', {}).get('role')}")
            return data.get('token')
        else:
            print(f"❌ Login falló: {response.status_code}")
            print(f"   - Respuesta: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error en login: {str(e)}")
        return None

def test_dashboard_statistics(token):
    """Prueba las estadísticas del dashboard"""
    if not token:
        print("❌ No hay token, saltando pruebas de estadísticas")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n📊 Probando estadísticas del dashboard...")
    
    # Obtener todos los datos necesarios para las estadísticas
    endpoints = [
        ("/labs", "Laboratorios"),
        ("/computers", "Computadoras"),
        ("/reservations/all", "Reservas"),
        ("/auth/users", "Usuarios")
    ]
    
    stats = {}
    
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                stats[name.lower()] = data
                print(f"✅ {name}: {len(data)} elementos")
            else:
                print(f"❌ Error al obtener {name}: {response.status_code}")
                return
        except Exception as e:
            print(f"❌ Error en {name}: {str(e)}")
            return
    
    # Calcular estadísticas
    print("\n📈 Calculando estadísticas...")
    
    # Laboratorios
    total_labs = len(stats.get('laboratorios', []))
    print(f"   - Total laboratorios: {total_labs}")
    
    # Computadoras
    computers = stats.get('computadoras', [])
    total_computers = len(computers)
    available_computers = len([c for c in computers if c.get('status') == 'available'])
    maintenance_computers = len([c for c in computers if c.get('status') == 'maintenance'])
    reserved_computers = len([c for c in computers if c.get('status') == 'reserved'])
    
    print(f"   - Total computadoras: {total_computers}")
    print(f"   - Disponibles: {available_computers}")
    print(f"   - En mantenimiento: {maintenance_computers}")
    print(f"   - Reservadas: {reserved_computers}")
    
    # Reservas
    reservations = stats.get('reservas', [])
    total_reservations = len(reservations)
    pending_reservations = len([r for r in reservations if r.get('status') == 'pending'])
    confirmed_reservations = len([r for r in reservations if r.get('status') == 'confirmed'])
    cancelled_reservations = len([r for r in reservations if r.get('status') == 'cancelled'])
    
    print(f"   - Total reservas: {total_reservations}")
    print(f"   - Pendientes: {pending_reservations}")
    print(f"   - Confirmadas: {confirmed_reservations}")
    print(f"   - Canceladas: {cancelled_reservations}")
    
    # Usuarios
    users = stats.get('usuarios', [])
    total_users = len(users)
    students = len([u for u in users if u.get('role') == 'student'])
    admins = len([u for u in users if u.get('role') == 'admin'])
    superusers = len([u for u in users if u.get('role') == 'superuser'])
    
    print(f"   - Total usuarios: {total_users}")
    print(f"   - Estudiantes: {students}")
    print(f"   - Administradores: {admins}")
    print(f"   - Superusuarios: {superusers}")
    
    # Calcular ocupación del sistema
    if total_computers > 0:
        occupancy_rate = ((total_computers - available_computers) / total_computers) * 100
        print(f"   - Ocupación del sistema: {occupancy_rate:.1f}%")
    
    return {
        'total_labs': total_labs,
        'total_computers': total_computers,
        'available_computers': available_computers,
        'maintenance_computers': maintenance_computers,
        'reserved_computers': reserved_computers,
        'total_reservations': total_reservations,
        'pending_reservations': pending_reservations,
        'confirmed_reservations': confirmed_reservations,
        'cancelled_reservations': cancelled_reservations,
        'total_users': total_users,
        'students': students,
        'admins': admins,
        'superusers': superusers
    }

def test_recent_activity(token):
    """Prueba la actividad reciente"""
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🕒 Probando actividad reciente...")
    
    try:
        # Obtener reservas recientes
        response = requests.get(f"{BACKEND_URL}/reservations/all", headers=headers)
        if response.status_code == 200:
            reservations = response.data
            
            # Ordenar por fecha de creación (más recientes primero)
            recent_reservations = sorted(
                reservations, 
                key=lambda x: x.get('created_at', ''), 
                reverse=True
            )[:5]
            
            print(f"   - Últimas 5 reservas:")
            for i, reservation in enumerate(recent_reservations, 1):
                status = reservation.get('status', 'unknown')
                created_at = reservation.get('created_at', 'N/A')
                print(f"     {i}. Reserva #{reservation.get('id')} - {status} - {created_at}")
        
    except Exception as e:
        print(f"❌ Error al obtener actividad reciente: {str(e)}")

def test_endpoint_performance(token):
    """Prueba el rendimiento de los endpoints"""
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n⚡ Probando rendimiento de endpoints...")
    
    endpoints = [
        ("/labs", "Laboratorios"),
        ("/computers", "Computadoras"),
        ("/reservations/all", "Reservas"),
        ("/auth/users", "Usuarios")
    ]
    
    for endpoint, name in endpoints:
        try:
            import time
            start_time = time.time()
            response = requests.get(f"{BACKEND_URL}{endpoint}", headers=headers)
            end_time = time.time()
            
            if response.status_code == 200:
                response_time = (end_time - start_time) * 1000  # en milisegundos
                print(f"   - {name}: {response_time:.2f}ms")
            else:
                print(f"   - {name}: Error {response.status_code}")
        except Exception as e:
            print(f"   - {name}: Error - {str(e)}")

def main():
    """Función principal de pruebas"""
    print("🧪 Iniciando pruebas del dashboard del administrador")
    print("=" * 60)
    
    # Verificar que el backend esté funcionando
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        if response.status_code == 200:
            print("✅ Backend funcionando correctamente")
        else:
            print("❌ Backend no responde correctamente")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Backend no disponible: {str(e)}")
        sys.exit(1)
    
    # Probar login del administrador
    token = test_admin_login()
    
    if token:
        # Probar estadísticas del dashboard
        stats = test_dashboard_statistics(token)
        
        # Probar actividad reciente
        test_recent_activity(token)
        
        # Probar rendimiento
        test_endpoint_performance(token)
        
        print("\n" + "=" * 60)
        print("✅ Pruebas completadas")
        print("\n📋 Resumen del sistema:")
        if stats:
            print(f"   - Laboratorios: {stats['total_labs']}")
            print(f"   - Computadoras: {stats['total_computers']} ({stats['available_computers']} disponibles)")
            print(f"   - Reservas: {stats['total_reservations']} ({stats['pending_reservations']} pendientes)")
            print(f"   - Usuarios: {stats['total_users']} ({stats['students']} estudiantes, {stats['admins']} admins)")
        
        print("\n🎯 Para ver el dashboard en el navegador:")
        print("   1. Abre: http://localhost")
        print("   2. Login con: admin@example.com / admin123")
        print("   3. Ve a la pestaña '📊 Dashboard'")
    else:
        print("\n❌ No se pudo autenticar como administrador")
        print("   Verifica las credenciales en la base de datos")

if __name__ == "__main__":
    main() 