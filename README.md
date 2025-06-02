# Configuración de Kubernetes para el Sistema de Reserva de Computadoras

Este directorio contiene los archivos de configuración para desplegar el sistema en Kubernetes.

## Estructura de archivos

- `backend-deployment.yaml`: Configuración del despliegue del backend
- `backend-service.yaml`: Configuración del servicio para el backend
- `frontend-deployment.yaml`: Configuración del despliegue del frontend
- `frontend-service.yaml`: Configuración del servicio para el frontend
- `db-deployment.yaml`: Configuración del despliegue de la base de datos
- `db-service.yaml`: Configuración del servicio para la base de datos
- `db-pvc.yaml`: Configuración del volumen persistente para la base de datos
- `ingress.yaml`: Configuración del ingress para acceso externo

## Instrucciones de despliegue

1. Asegúrate de tener acceso a un clúster de Kubernetes (AKS en Azure)
2. Aplica los archivos de configuración en el siguiente orden:
   ```
   kubectl apply -f db-pvc.yaml
   kubectl apply -f db-deployment.yaml
   kubectl apply -f db-service.yaml
   kubectl apply -f backend-deployment.yaml
   kubectl apply -f backend-service.yaml
   kubectl apply -f frontend-deployment.yaml
   kubectl apply -f frontend-service.yaml
   kubectl apply -f ingress.yaml
   ```
3. Verifica el estado de los pods:
   ```
   kubectl get pods
   ```
4. Verifica el estado de los servicios:
   ```
   kubectl get services
   ```
5. Obtén la IP externa del ingress:
   ```
   kubectl get ingress
   ```
