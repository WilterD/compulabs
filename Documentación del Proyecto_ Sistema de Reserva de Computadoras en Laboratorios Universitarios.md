# Documentación del Proyecto: Sistema de Reserva de Computadoras en Laboratorios Universitarios

## Descripción General

Este proyecto implementa un sistema de reserva de computadoras para laboratorios universitarios utilizando una arquitectura de microservicios en contenedores con Docker y Kubernetes. El sistema permite a los estudiantes reservar computadoras en tiempo real, visualizar la disponibilidad y gestionar sus reservas, mientras que los administradores pueden gestionar laboratorios, computadoras y supervisar el uso del sistema.

## Arquitectura del Sistema

El sistema está construido con una arquitectura de microservicios que facilita la escalabilidad, el mantenimiento y la resiliencia:

1. **Frontend**: Aplicación React con TypeScript que proporciona una interfaz de usuario responsiva y en tiempo real.
2. **Backend**: API RESTful desarrollada con Flask que gestiona la lógica de negocio y la comunicación con la base de datos.
3. **Base de Datos**: MySQL para almacenamiento persistente de datos.
4. **Contenedorización**: Docker para empaquetar cada componente en contenedores independientes.
5. **Orquestación**: Kubernetes para gestionar, escalar y mantener los contenedores en producción.
6. **Despliegue**: Azure Kubernetes Service (AKS) para el despliegue en la nube.

## Estructura del Proyecto

```
proyecto_reservas_lab/
├── backend/                      # Código del backend Flask
│   └── reservas_app/
│       ├── src/
│       │   ├── models/           # Modelos de datos
│       │   ├── routes/           # Endpoints de la API
│       │   └── main.py           # Punto de entrada del backend
│       ├── tests/                # Pruebas unitarias
│       └── requirements.txt      # Dependencias del backend
├── frontend/                     # Código del frontend React
│   └── reservas_frontend/
│       ├── src/
│       │   ├── components/       # Componentes reutilizables
│       │   ├── contexts/         # Contextos de React
│       │   ├── pages/            # Páginas de la aplicación
│       │   └── services/         # Servicios para comunicación con API
│       └── public/               # Archivos estáticos
├── docker/                       # Configuración de Docker
│   ├── Dockerfile.backend        # Dockerfile para el backend
│   ├── Dockerfile.frontend       # Dockerfile para el frontend
│   ├── nginx.conf                # Configuración de Nginx
│   └── docker-compose.yml        # Configuración de Docker Compose
├── kubernetes/                   # Configuración de Kubernetes
│   ├── manifests/                # Manifiestos YAML para Kubernetes
│   │   ├── db-deployment.yaml    # Despliegue de la base de datos
│   │   ├── db-service.yaml       # Servicio para la base de datos
│   │   ├── db-pvc.yaml           # Volumen persistente para la base de datos
│   │   ├── db-secrets.yaml       # Secretos para la base de datos
│   │   ├── backend-deployment.yaml # Despliegue del backend
│   │   ├── backend-service.yaml  # Servicio para el backend
│   │   ├── frontend-deployment.yaml # Despliegue del frontend
│   │   ├── frontend-service.yaml # Servicio para el frontend
│   │   └── ingress.yaml          # Configuración de ingress
│   └── README.md                 # Instrucciones para Kubernetes
├── integration_test.sh           # Script de pruebas de integración
├── unit_tests.sh                 # Script de pruebas unitarias
├── azure_deployment_guide.md     # Guía de despliegue en Azure
├── requerimientos_funcionales.md # Requerimientos del sistema
└── arquitectura_microservicios.md # Descripción de la arquitectura
```

## Funcionalidades Principales

### Para Estudiantes
- Registro e inicio de sesión
- Visualización de laboratorios disponibles
- Visualización de computadoras disponibles por laboratorio
- Reserva de computadoras en tiempo real
- Gestión de reservas (crear, modificar, cancelar)
- Notificaciones sobre el estado de las reservas

### Para Administradores
- Gestión de laboratorios (crear, modificar, eliminar)
- Gestión de computadoras (crear, modificar, eliminar, cambiar estado)
- Supervisión de reservas
- Generación de reportes de uso

## Tecnologías Utilizadas

### Backend
- Python 3.11
- Flask (Framework web)
- SQLAlchemy (ORM)
- Flask-SocketIO (Comunicación en tiempo real)
- MySQL (Base de datos)
- JWT (Autenticación)

### Frontend
- TypeScript
- React
- React Router
- Axios (Comunicación HTTP)
- Socket.io-client (Comunicación en tiempo real)
- Tailwind CSS (Estilos)

### DevOps
- Docker
- Docker Compose
- Kubernetes
- Azure Kubernetes Service (AKS)
- Azure Database for MySQL
- Nginx (Servidor web y proxy inverso)

## Instalación y Ejecución Local

### Requisitos Previos
- Docker y Docker Compose
- Python 3.11
- Node.js 20.x
- pnpm

### Pasos para Ejecución Local

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd proyecto_reservas_lab
```

2. Construir y ejecutar con Docker Compose:
```bash
cd docker
docker-compose up -d
```

3. Acceder a la aplicación:
   - Frontend: http://localhost
   - Backend API: http://localhost:5000/api

## Pruebas

### Pruebas Unitarias
```bash
./unit_tests.sh
```

### Pruebas de Integración
```bash
./integration_test.sh
```

## Despliegue en Azure

Para desplegar el sistema en Azure, sigue las instrucciones detalladas en el archivo `azure_deployment_guide.md`.

## Mantenimiento y Escalabilidad

### Escalabilidad
- El sistema está diseñado para escalar horizontalmente mediante Kubernetes.
- Los microservicios pueden escalarse independientemente según la demanda.
- La base de datos puede configurarse con réplicas de lectura para mejorar el rendimiento.

### Monitoreo
- Utilizar Azure Monitor para supervisar el rendimiento y la salud del sistema.
- Configurar alertas para eventos críticos.
- Revisar logs regularmente para detectar problemas.

### Actualizaciones
- Seguir un enfoque de integración continua y despliegue continuo (CI/CD).
- Actualizar imágenes Docker y aplicar cambios mediante Kubernetes.
- Realizar pruebas exhaustivas antes de actualizar en producción.

## Consideraciones de Seguridad

- Autenticación mediante JWT con expiración de tokens.
- Comunicación HTTPS para todas las interacciones.
- Secretos gestionados mediante Kubernetes Secrets.
- Validación de entradas en frontend y backend.
- Principio de mínimo privilegio para roles de usuario.

## Contacto y Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo:
- Email: soporte@ejemplo.com
- Repositorio: [URL del repositorio]
