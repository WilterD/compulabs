#!/usr/bin/env python3
"""
Script de prueba para verificar que los dashboards funcionen según el rol del usuario
"""

import requests
import json
import sys

# Configuración
BACKEND_URL = "http://localhost:5000/api"
FRONTEND_URL = "http://localhost"

# Credenciales de prueba
USERS = {
    "admin": {
        "email": "admin@example.com",
        "password": "admin123",
        "role": "admin"
    },
    "student": {
        "email": "student@example.com", 
        "password": "student123",
        "role": "student"
    },
    "superuser": {
        "email": "superuser@example.com",
        "password": "superuser123", 
        "role": "superuser"
    }
}

def test_user_login(user_type):
    """Prueba el login de un tipo de usuario específico"""
    user_data = USERS.get(user_type)
    if not user_data:
        print(f"❌ Tipo de usuario '{user_type}' no encontrado")
        return None
    
    print(f"🔐 Probando login de {user_type}...")
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login exitoso para {user_type}")
            print(f"   - Usuario: {data.get('user', {}).get('name')}")
            print(f"   - Rol: {data.get('user', {}).get('role')}")
            print(f"   - Token: {data.get('token')[:20]}...")
            return data.get('token')
        else:
            print(f"❌ Login falló para {user_type}: {response.status_code}")
            print(f"   - Respuesta: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error en login de {user_type}: {str(e)}")
        return None

def test_dashboard_access(token, user_type):
    """Prueba el acceso a endpoints específicos del dashboard según el rol"""
    if not token:
        print(f"❌ No hay token para {user_type}, saltando pruebas")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n📋 Probando acceso a dashboard de {user_type}...")
    
    # Endpoints comunes para todos los roles
    common_endpoints = [
        ("/health", "Health Check"),
        ("/labs", "Laboratorios"),
    ]
    
    # Endpoints específicos por rol
    role_endpoints = {
        "admin": [
            ("/computers", "Computadoras"),
            ("/reservations/all", "Todas las Reservas"),
            ("/auth/users", "Usuarios"),
        ],
        "student": [
            ("/computers/available", "Computadoras Disponibles"),
            ("/reservations", "Mis Reservas"),
        ],
        "superuser": [
            ("/computers", "Computadoras"),
            ("/reservations/all", "Todas las Reservas"),
            ("/auth/users", "Usuarios"),
            ("/superuser/admins", "Administradores"),
        ]
    }
    
    # Probar endpoints comunes
    for endpoint, name in common_endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", headers=headers)
            if response.status_code == 200:
                print(f"✅ {name}: Acceso permitido")
            else:
                print(f"❌ {name}: Acceso denegado ({response.status_code})")
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)}")
    
    # Probar endpoints específicos del rol
    endpoints = role_endpoints.get(user_type, [])
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"✅ {name}: {len(data)} elementos")
                else:
                    print(f"✅ {name}: Acceso permitido")
            else:
                print(f"❌ {name}: Acceso denegado ({response.status_code})")
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)}")

def test_frontend_access():
    """Prueba el acceso al frontend"""
    print(f"\n🌐 Probando acceso al frontend...")
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print(f"✅ Frontend accesible en {FRONTEND_URL}")
            return True
        else:
            print(f"❌ Frontend respondió con código: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error accediendo al frontend: {str(e)}")
        return False

def create_test_users():
    """Crea usuarios de prueba si no existen"""
    print("\n👥 Verificando usuarios de prueba...")
    
    # Primero hacer login como superuser para crear otros usuarios
    superuser_token = test_user_login("superuser")
    if not superuser_token:
        print("⚠️  No se pudo obtener token de superuser, saltando creación de usuarios")
        return
    
    headers = {"Authorization": f"Bearer {superuser_token}"}
    
    # Crear admin si no existe
    try:
        response = requests.post(f"{BACKEND_URL}/auth/create-admin", 
                               headers=headers,
                               json={
                                   "email": "admin@example.com",
                                   "password": "admin123",
                                   "name": "Administrador"
                               })
        if response.status_code == 201:
            print("✅ Usuario admin creado")
        elif response.status_code == 409:
            print("ℹ️  Usuario admin ya existe")
        else:
            print(f"⚠️  Error creando admin: {response.status_code}")
    except Exception as e:
        print(f"❌ Error creando admin: {str(e)}")

def main():
    """Función principal de pruebas"""
    print("🧪 Iniciando pruebas de dashboards por rol")
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
    
    # Verificar frontend
    frontend_available = test_frontend_access()
    
    # Crear usuarios de prueba
    create_test_users()
    
    # Probar login y acceso para cada tipo de usuario
    for user_type in ["student", "admin", "superuser"]:
        print(f"\n{'='*20} {user_type.upper()} {'='*20}")
        
        # Probar login
        token = test_user_login(user_type)
        
        # Probar acceso a dashboard
        test_dashboard_access(token, user_type)
    
    print("\n" + "=" * 60)
    print("✅ Pruebas completadas")
    print("\n📋 Resumen:")
    print("   - El backend está funcionando correctamente")
    if frontend_available:
        print("   - El frontend está accesible")
        print("   - Puedes probar los dashboards en el navegador:")
        print(f"     {FRONTEND_URL}")
    else:
        print("   - ⚠️  El frontend no está accesible")
    
    print("\n🎯 Para probar en el navegador:")
    print("   1. Abre el navegador en la URL del frontend")
    print("   2. Haz login con las credenciales de prueba:")
    for user_type, data in USERS.items():
        print(f"      - {user_type}: {data['email']} / {data['password']}")
    print("   3. Verifica que se muestre el dashboard correcto según el rol")

if __name__ == "__main__":
    main() 