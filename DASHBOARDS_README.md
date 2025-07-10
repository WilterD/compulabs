# 📊 Dashboards por Rol de Usuario

Este documento explica cómo funcionan los diferentes dashboards según el rol del usuario en el sistema de reservas de computadoras.

## 🎯 Roles de Usuario

El sistema tiene tres roles principales:

### 👨‍🎓 **Estudiante (student)**
- **Acceso:** Dashboard básico con funcionalidades limitadas
- **Funcionalidades:**
  - Ver laboratorios disponibles
  - Ver computadoras disponibles
  - Crear y gestionar sus propias reservas
  - Ver estadísticas personales
  - Recibir notificaciones en tiempo real

### 👨‍💼 **Administrador (admin)**
- **Acceso:** Panel de administración completo
- **Funcionalidades:**
  - Gestionar laboratorios (crear, editar, eliminar)
  - Gestionar computadoras (crear, editar, eliminar, cambiar estado)
  - Ver todas las reservas del sistema
  - Confirmar o cancelar reservas
  - Ver todos los usuarios
  - Recibir notificaciones en tiempo real

### 👑 **Superusuario (superuser)**
- **Acceso:** Panel de superusuario con control total
- **Funcionalidades:**
  - Todas las funcionalidades del administrador
  - Crear y gestionar administradores
  - Ver todos los usuarios del sistema
  - Control total del sistema

## 🚀 Cómo Funciona

### 1. **Autenticación**
Cuando un usuario hace login, el sistema:
1. Verifica las credenciales
2. Asigna un token JWT
3. Determina el rol del usuario
4. Redirige al dashboard correspondiente

### 2. **Redirección Automática**
El componente `Dashboard.tsx` actúa como router principal:

```typescript
// Lógica de redirección
if (user?.role === 'superuser') {
  return <SuperUserPanel />;
}

if (user.role === 'admin') {
  return <AdminPanel />;
}

if (user.role === 'student') {
  return <StudentDashboard />;
}
```

### 3. **Componentes Específicos**

#### **StudentDashboard.tsx**
- Dashboard personalizado para estudiantes
- Muestra estadísticas relevantes para el usuario
- Acceso rápido a funcionalidades comunes
- Lista de reservas recientes del usuario

#### **AdminPanel.tsx**
- Panel completo de administración
- Gestión de laboratorios, computadoras y reservas
- Interfaz con pestañas para organizar funcionalidades
- Acceso a todas las reservas del sistema

#### **SuperUserPanel.tsx**
- Panel de superusuario con control total
- Gestión de administradores
- Vista general del sistema

## 📱 Interfaz de Usuario

### **Dashboard del Estudiante**
```
┌─────────────────────────────────────────────────────────┐
│                    Bienvenido, [Nombre]                 │
│              Panel de estudiante                        │
├─────────────────────────────────────────────────────────┤
│ [📊] Laboratorios    [💻] Computadoras Disponibles     │
│ [📅] Mis Reservas    [⏰] Próximas                      │
├─────────────────────────────────────────────────────────┤
│                    Acciones Rápidas                     │
│ [🔍] Ver Laboratorios  [➕] Nueva Reserva  [📋] Mis Reservas │
├─────────────────────────────────────────────────────────┤
│                 Mis Reservas Recientes                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Computadora | Laboratorio | Fecha | Estado         │ │
│ │ PC-A01      | Lab Info A  | 15/01 | Confirmada     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Panel del Administrador**
```
┌─────────────────────────────────────────────────────────┐
│                 Panel de Administración                 │
├─────────────────────────────────────────────────────────┤
│ [🏢] Laboratorios  [💻] Computadoras  [📅] Reservas    │
├─────────────────────────────────────────────────────────┤
│                    Gestión de Laboratorios              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [➕] Agregar Laboratorio                            │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Nombre | Ubicación | Capacidad | Estado        │ │ │
│ │ │ Lab A  | Edificio 1| 20        | [Editar] [❌] │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Configuración

### **Variables de Entorno**
```bash
# Frontend
VITE_API_URL=http://localhost:5000/api

# Backend
DB_USERNAME=reservas_user
DB_PASSWORD=reservas_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=reservas_db
```

### **Base de Datos**
Los roles se almacenan en la tabla `users`:
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🧪 Pruebas

### **Script de Prueba Automatizada**
```bash
python test_dashboard_roles.py
```

Este script verifica:
- ✅ Login de cada tipo de usuario
- ✅ Acceso a endpoints específicos del rol
- ✅ Funcionamiento del backend
- ✅ Accesibilidad del frontend

### **Pruebas Manuales**

#### **1. Probar como Estudiante**
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com", "password": "student123"}'

# Ver mis reservas
curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:5000/api/reservations/user/1
```

#### **2. Probar como Administrador**
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Ver todas las reservas
curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:5000/api/reservations/all
```

#### **3. Probar como Superusuario**
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superuser@example.com", "password": "superuser123"}'

# Ver administradores
curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:5000/api/superuser/admins
```

## 🔒 Seguridad

### **Autorización por Rol**
- Cada endpoint verifica el rol del usuario
- Los estudiantes solo pueden acceder a sus propios datos
- Los administradores pueden ver todos los datos
- Los superusuarios tienen control total

### **Tokens JWT**
- Tokens con expiración de 24 horas
- Incluyen información del rol del usuario
- Se validan en cada solicitud

### **Validación de Datos**
- Verificación de entrada en todos los endpoints
- Sanitización de datos
- Validación de permisos antes de operaciones

## 🚨 Solución de Problemas

### **Problema: Usuario no ve su dashboard**
**Solución:**
1. Verificar que el usuario tenga un rol válido en la base de datos
2. Verificar que el token JWT sea válido
3. Revisar los logs del frontend para errores de redirección

### **Problema: Acceso denegado a endpoints**
**Solución:**
1. Verificar que el usuario tenga el rol correcto
2. Verificar que el token incluya el rol
3. Revisar la configuración de autorización en el backend

### **Problema: Dashboard no carga datos**
**Solución:**
1. Verificar que el backend esté funcionando
2. Verificar la conexión a la base de datos
3. Revisar los logs del backend para errores

## 📞 Soporte

Si encuentras problemas con los dashboards:

1. **Revisa los logs:**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Verifica la base de datos:**
   ```bash
   docker-compose exec db mysql -u reservas_user -preservas_password reservas_db -e "SELECT * FROM users;"
   ```

3. **Ejecuta las pruebas:**
   ```bash
   python test_dashboard_roles.py
   ```

4. **Contacta al administrador del sistema**

---

**Última actualización:** Julio 2025
**Versión:** 1.0.0 