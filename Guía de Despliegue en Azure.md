# Guía de Despliegue en Azure

Este documento proporciona instrucciones detalladas para desplegar el sistema de reserva de computadoras en Azure Kubernetes Service (AKS).

## Requisitos Previos

1. Cuenta de Azure con créditos disponibles (cuenta de estudiante)
2. Azure CLI instalado y configurado
3. kubectl instalado
4. Docker instalado y configurado

## Pasos para el Despliegue

### 1. Configuración del Entorno Azure

```bash
# Iniciar sesión en Azure
az login

# Crear un grupo de recursos
az group create --name ReservasLabGroup --location eastus

# Crear un registro de contenedores (ACR)
az acr create --resource-group ReservasLabGroup --name reservaslabregistry --sku Basic

# Iniciar sesión en el registro de contenedores
az acr login --name reservaslabregistry

# Obtener el servidor de inicio de sesión del ACR
ACR_SERVER=$(az acr show --name reservaslabregistry --query loginServer --output tsv)
```

### 2. Construcción y Publicación de Imágenes

```bash
# Etiquetar las imágenes para el registro de Azure
docker tag reservas-backend:latest ${ACR_SERVER}/reservas-backend:latest
docker tag reservas-frontend:latest ${ACR_SERVER}/reservas-frontend:latest

# Subir las imágenes al registro
docker push ${ACR_SERVER}/reservas-backend:latest
docker push ${ACR_SERVER}/reservas-frontend:latest
```

### 3. Creación del Clúster AKS

```bash
# Crear el clúster AKS
az aks create \
    --resource-group ReservasLabGroup \
    --name ReservasLabAKS \
    --node-count 2 \
    --enable-addons monitoring \
    --generate-ssh-keys \
    --attach-acr reservaslabregistry

# Obtener las credenciales para kubectl
az aks get-credentials --resource-group ReservasLabGroup --name ReservasLabAKS
```

### 4. Configuración de la Base de Datos

```bash
# Crear una instancia de Azure Database for MySQL
az mysql server create \
    --resource-group ReservasLabGroup \
    --name reservaslab-mysql \
    --location eastus \
    --admin-user adminuser \
    --admin-password "YourStrongPassword123!" \
    --sku-name GP_Gen5_2 \
    --version 8.0

# Configurar reglas de firewall para permitir acceso desde AKS
az mysql server firewall-rule create \
    --resource-group ReservasLabGroup \
    --server reservaslab-mysql \
    --name AllowAKS \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 255.255.255.255

# Crear la base de datos
az mysql db create \
    --resource-group ReservasLabGroup \
    --server-name reservaslab-mysql \
    --name reservas_db
```

### 5. Actualización de Manifiestos de Kubernetes

Antes de aplicar los manifiestos, es necesario actualizar las referencias a las imágenes y configuraciones de base de datos:

1. Actualizar `db-deployment.yaml` para usar Azure Database for MySQL
2. Actualizar `backend-deployment.yaml` con la imagen del ACR y las credenciales de la base de datos
3. Actualizar `frontend-deployment.yaml` con la imagen del ACR
4. Actualizar `ingress.yaml` con el dominio adecuado

### 6. Despliegue en AKS

```bash
# Crear el secreto para la base de datos
kubectl create secret generic mysql-secrets \
    --from-literal=root-password="YourStrongPassword123!" \
    --from-literal=username="adminuser" \
    --from-literal=password="YourStrongPassword123!"

# Aplicar los manifiestos
kubectl apply -f kubernetes/manifests/backend-deployment.yaml
kubectl apply -f kubernetes/manifests/backend-service.yaml
kubectl apply -f kubernetes/manifests/frontend-deployment.yaml
kubectl apply -f kubernetes/manifests/frontend-service.yaml

# Instalar el controlador de ingress NGINX
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx

# Aplicar el ingress
kubectl apply -f kubernetes/manifests/ingress.yaml

# Verificar el despliegue
kubectl get pods
kubectl get services
kubectl get ingress
```

### 7. Configuración de DNS y SSL

```bash
# Obtener la IP pública del ingress
INGRESS_IP=$(kubectl get service nginx-ingress-ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Crear un registro DNS en Azure
az network dns record-set a add-record \
    --resource-group ReservasLabGroup \
    --zone-name yourdomain.com \
    --record-set-name reservas \
    --ipv4-address ${INGRESS_IP}

# Instalar cert-manager para SSL
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.5.3/cert-manager.yaml

# Crear un ClusterIssuer para Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Actualizar el ingress para usar SSL
# Añadir estas anotaciones al archivo ingress.yaml:
# cert-manager.io/cluster-issuer: "letsencrypt-prod"
# Y especificar tls en la configuración
```

### 8. Monitoreo y Escalado

```bash
# Configurar escalado automático para los deployments
kubectl autoscale deployment backend --cpu-percent=70 --min=2 --max=10
kubectl autoscale deployment frontend --cpu-percent=70 --min=2 --max=10

# Acceder al panel de monitoreo de Azure
az aks browse --resource-group ReservasLabGroup --name ReservasLabAKS
```

## Verificación del Despliegue

1. Acceder a la aplicación a través del dominio configurado: https://reservas.yourdomain.com
2. Verificar que todas las funcionalidades estén operativas:
   - Registro e inicio de sesión
   - Visualización de laboratorios y computadoras
   - Creación y gestión de reservas
   - Panel de administración

## Solución de Problemas

- **Problemas de conexión a la base de datos**: Verificar las reglas de firewall y credenciales
- **Imágenes no disponibles**: Verificar que las imágenes se hayan subido correctamente al ACR
- **Errores de ingress**: Verificar la configuración del controlador de ingress y los registros DNS
- **Certificados SSL**: Verificar los logs de cert-manager para problemas de emisión de certificados

## Mantenimiento

- **Actualizaciones de la aplicación**: Construir nuevas imágenes, subirlas al ACR y actualizar los deployments
- **Copias de seguridad**: Configurar copias de seguridad automáticas para la base de datos
- **Monitoreo**: Revisar regularmente las métricas de rendimiento y logs en Azure Monitor
