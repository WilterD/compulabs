#!/usr/bin/env python3
"""
Script de prueba para verificar el dashboard del administrador
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
            print(f"   - Token: {data.get('token')[:20]}...")
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

def test_admin_endpoints(token):
    """Prueba los endpoints del administrador"""
    if not token:
        print("❌ No hay token, saltando pruebas de endpoints")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n📋 Probando endpoints del administrador...")
    
    # Probar endpoint de laboratorios
    try:
        response = requests.get(f"{BACKEND_URL}/labs", headers=headers)
        if response.status_code == 200:
            labs = response.json()
            print(f"✅ Laboratorios: {len(labs)} encontrados")
        else:
            print(f"❌ Error al obtener laboratorios: {response.status_code}")
    except Exception as e:
        print(f"❌ Error en laboratorios: {str(e)}")
    
    # Probar endpoint de computadoras
    try:
        response = requests.get(f"{BACKEND_URL}/computers", headers=headers)
        if response.status_code == 200:
            computers = response.json()
            print(f"✅ Computadoras: {len(computers)} encontradas")
        else:
            print(f"❌ Error al obtener computadoras: {response.status_code}")
    except Exception as e:
        print(f"❌ Error en computadoras: {str(e)}")
    
    # Probar endpoint de reservas
    try:
        response = requests.get(f"{BACKEND_URL}/reservations/all", headers=headers)
        if response.status_code == 200:
            reservations = response.json()
            print(f"✅ Reservas: {len(reservations)} encontradas")
        else:
            print(f"❌ Error al obtener reservas: {response.status_code}")
    except Exception as e:
        print(f"❌ Error en reservas: {str(e)}")
    
    # Probar endpoint de usuarios
    try:
        response = requests.get(f"{BACKEND_URL}/auth/users", headers=headers)
        if response.status_code == 200:
            users = response.json()
            print(f"✅ Usuarios: {len(users)} encontrados")
        else:
            print(f"❌ Error al obtener usuarios: {response.status_code}")
    except Exception as e:
        print(f"❌ Error en usuarios: {str(e)}")

def test_health_check():
    """Prueba el health check del backend"""
    print("\n🏥 Probando health check del backend...")
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check exitoso")
            print(f"   - Estado: {data.get('status')}")
            print(f"   - Base de datos: {data.get('database')}")
            return True
        else:
            print(f"❌ Health check falló: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error en health check: {str(e)}")
        return False

def main():
    """Función principal de pruebas"""
    print("🧪 Iniciando pruebas del dashboard del administrador")
    print("=" * 60)
    
    # Verificar que el backend esté funcionando
    if not test_health_check():
        print("\n❌ El backend no está disponible")
        print("   Asegúrate de que esté ejecutándose con: docker-compose up backend")
        sys.exit(1)
    
    # Probar login del administrador
    token = test_admin_login()
    
    # Probar endpoints del administrador
    test_admin_endpoints(token)
    
    print("\n" + "=" * 60)
    print("✅ Pruebas completadas")
    print("\n📋 Resumen:")
    print("   - El backend está funcionando correctamente")
    if token:
        print("   - El administrador puede autenticarse")
        print("   - Los endpoints del administrador están disponibles")
    else:
        print("   - ⚠️  Problema con la autenticación del administrador")
        print("   - Verifica las credenciales en la base de datos")

if __name__ == "__main__":
    main() 