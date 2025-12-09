# Diagramas de Arquitectura - OpManager Ionic Dashboard

Este documento contiene todos los diagramas de arquitectura del proyecto desplegado en Azure.

## 📊 Índice de Diagramas

1. [Diagrama de Arquitectura General](#1-diagrama-de-arquitectura-general)
2. [Diagrama de Flujo de Datos](#2-diagrama-de-flujo-de-datos)
3. [Diagrama de Pipeline CI/CD](#3-diagrama-de-pipeline-cicd)
4. [Diagrama de Infraestructura Detallada](#4-diagrama-de-infraestructura-detallada)

---

## 1. Diagrama de Arquitectura General

### Descripción
Muestra la arquitectura completa del sistema desplegado en Azure, incluyendo:
- Frontend en Azure Static Web Apps
- Backend (Azure Functions) como proxy
- API externa de OpManager MSP
- Pipeline de CI/CD con Azure DevOps

### Componentes Principales

#### Frontend (Azure Static Web Apps)
- **Tecnología**: Ionic 8 + Angular 19
- **Contenido**: SPA compilada en carpeta `www/`
- **Features**:
  - CDN global de Azure
  - HTTPS automático
  - Routing del lado del cliente
  - Optimización de assets

#### Backend (Azure Functions)
- **Runtime**: Node.js 22
- **Función**: API Proxy
- **Responsabilidades**:
  - Manejo de CORS
  - Reenvío de autenticación
  - Transformación de requests
  - Logging y monitoreo

#### API Externa
- **URL**: https://itview.intwo.cloud/api
- **Autenticación**: API Key en headers
- **Protocolo**: REST API

#### CI/CD
- **Plataforma**: Azure DevOps
- **Trigger**: Push a main/develop
- **Stages**: Build → Deploy

---

## 2. Diagrama de Flujo de Datos

### Descripción
Diagrama de secuencia que muestra el flujo completo de una petición desde el usuario hasta la API externa y vuelta.

### Flujo Paso a Paso

```
1. Usuario abre la aplicación
   └─ Azure Static Web Apps sirve el SPA

2. Usuario realiza acción (ej: ver dispositivos)
   └─ Angular Service hace HTTP request

3. Frontend → Azure Functions
   └─ GET /api/opmanager-proxy/json/device/getDeviceList
   └─ Headers: { apikey: 'xxx' }

4. Azure Functions valida y procesa
   └─ Verifica API Key
   └─ Configura CORS headers
   └─ Prepara proxy request

5. Azure Functions → OpManager API
   └─ GET https://itview.intwo.cloud/api/json/device/getDeviceList
   └─ Reenvía headers de autenticación

6. OpManager API responde
   └─ 200 OK con datos JSON

7. Azure Functions → Frontend
   └─ Retorna datos con CORS headers

8. Frontend procesa respuesta
   └─ RxJS Observables
   └─ State management

9. UI se actualiza
   └─ Renderiza nuevos datos
```

### Tiempos de Respuesta Estimados
- **Static Web Apps**: ~50ms
- **Azure Functions**: ~200ms
- **OpManager API**: ~500ms
- **Total**: ~750ms

---

## 3. Diagrama de Pipeline CI/CD

### Descripción
Muestra el pipeline completo de integración y despliegue continuo usando Azure DevOps.

### Stages del Pipeline

#### Stage 1: Build
```yaml
Trigger: Push to main/develop
VM: Ubuntu Latest
Steps:
  1. Setup Node.js 22.x
  2. Cache npm packages
  3. npm ci (install dependencies)
  4. Install Ionic & Angular CLI
  5. ionic build --prod
  6. Run tests (opcional)
  7. Publish artifacts (www/)
```

**Duración**: ~3-5 minutos

#### Stage 2: Deploy
```yaml
Environment: Production
Parallel Deployment:
  - Frontend: Deploy www/ to Azure Static Web Apps
  - API: Deploy api/ to Azure Functions
```

**Duración**: ~2 minutos

### Triggers Configurados
- **Push to main** → Deploy a producción
- **Push to develop** → Deploy a staging (si configurado)
- **Pull Request** → Build + Tests solamente

### Variables de Entorno
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Token de autenticación
- `nodeVersion: '22.x'` - Versión de Node.js
- `buildConfiguration: 'production'` - Configuración de build

---

## 4. Diagrama de Infraestructura Detallada

### Descripción
Vista detallada de todos los recursos de Azure y sus configuraciones.

### Recursos de Azure

#### Azure Static Web Apps
```
SKU: Free/Standard
Features:
  - CDN Endpoint global
  - Edge Locations worldwide
  - SSL/TLS Certificate (automático)
  - Custom Domain Support
  - Routing Engine (SPA fallback)
  
Contenido:
  - index.html
  - JavaScript bundles (main, polyfills, runtime)
  - CSS files
  - assets/ (imágenes, iconos)
```

#### Azure Functions
```
Plan: Consumption
Runtime: Node.js 22
Features:
  - HTTP Trigger Functions
  - Auto-scaling
  - Cold Start: ~1-2 segundos
  - Max Timeout: 230 segundos
  
Functions:
  - opmanager-proxy (HTTP Trigger)
```

#### Monitoring & Logging
```
Servicios disponibles:
  - Application Insights (opcional)
  - Azure Monitor
  - Log Analytics
  
Métricas:
  - Request count
  - Response time
  - Error rate
  - Function executions
```

### Networking

#### Seguridad
- **HTTPS Only**: Todo el tráfico es HTTPS
- **TLS 1.2+**: Protocolo de encriptación moderno
- **CORS**: Configurado en Azure Functions
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.

#### Configuración CORS
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, apiKey, apikey, Authorization'
}
```

### Costos Estimados

| Servicio | Plan | Costo Mensual |
|----------|------|---------------|
| Azure Static Web Apps | Free | $0 |
| Azure Functions | Consumption | ~$0.20/millón ejecuciones |
| Bandwidth | Primeros 100GB | Gratis |
| **Total Estimado** | | **$5-20/mes** |

*Nota: Los costos pueden variar según el uso real*

---

## 🔐 Seguridad

### Autenticación
- **API Key**: Almacenada en localStorage del navegador
- **Headers**: Enviada en cada petición
- **Proxy**: Azure Functions maneja la autenticación con OpManager

### Protección de Datos
- **No hay base de datos**: Arquitectura stateless
- **API Key no se almacena en servidor**: Solo en cliente
- **HTTPS**: Todo el tráfico encriptado
- **Security Headers**: Protección contra XSS, clickjacking, etc.

### Mejoras de Seguridad Opcionales
- Azure AD Integration
- Managed Identity
- Azure Key Vault (para secretos)
- DDoS Protection
- Web Application Firewall (WAF)

---

## 📈 Escalabilidad

### Azure Static Web Apps
- **CDN Global**: Distribución automática en múltiples regiones
- **Caching**: Assets estáticos cacheados en edge locations
- **Compression**: Gzip/Brotli automático

### Azure Functions
- **Serverless**: Escala automáticamente según demanda
- **Concurrent Executions**: Hasta 200 por instancia
- **Auto-scaling**: Instancias adicionales según carga

---

## 🛠️ Configuración

### Archivos Clave

#### `azure-pipelines.yml`
Define el pipeline de CI/CD completo.

#### `staticwebapp.config.json`
Configuración de Azure Static Web Apps:
- Routing rules
- API routes
- Security headers
- Platform settings

#### `api/opmanager-proxy/function.json`
Configuración de Azure Function:
- HTTP trigger
- Route pattern
- Auth level

#### `api/opmanager-proxy/index.js`
Lógica del proxy:
- Request forwarding
- CORS handling
- Error handling

---

## 🚀 Deployment

### Desarrollo Local
```bash
# Frontend con proxy
npm run start:proxy

# Servidor local (simula producción)
npm run build:prod
npm run server
```

### Producción (Automático)
```bash
# Hacer commit y push
git add .
git commit -m "Your changes"
git push origin main

# Azure DevOps ejecuta el pipeline automáticamente
# Build → Test → Deploy
```

### Verificación Post-Deploy
1. Verificar que el pipeline completó exitosamente
2. Abrir la URL de Azure Static Web Apps
3. Configurar API Key en Settings
4. Probar conexión
5. Verificar que los datos cargan correctamente

---

## 📚 Referencias

### Documentación Azure
- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions](https://docs.microsoft.com/azure/azure-functions/)
- [Azure DevOps Pipelines](https://docs.microsoft.com/azure/devops/pipelines/)

### Documentación del Proyecto
- [README.md](../README.md) - Guía general
- [AZURE_ARCHITECTURE.md](../AZURE_ARCHITECTURE.md) - Arquitectura detallada
- [SETUP_GUIDE.md](../SETUP_GUIDE.md) - Guía de configuración
- [TESTING.md](../TESTING.md) - Guía de testing

---

## 🔄 Actualizaciones

**Última actualización**: Diciembre 2024
**Versión**: 1.0
**Autor**: Equipo de Desarrollo OpManager MSP

---

## 📝 Notas Adicionales

### Alternativas Consideradas

#### Render
- Configuración más simple
- Express server con proxy integrado
- No serverless (siempre corriendo)
- Archivo: `render.yaml`

#### Firebase Hosting
- Descartado en favor de Azure
- Mejor integración con Azure DevOps
- Limitaciones con Azure Functions

### Próximos Pasos
1. Configurar Application Insights para monitoreo avanzado
2. Implementar staging environment
3. Configurar custom domain
4. Optimizar cold start de Azure Functions
5. Implementar caching strategies

---

**¿Preguntas?** Consulta la documentación completa o contacta al equipo de desarrollo.
