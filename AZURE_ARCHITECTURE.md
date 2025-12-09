# Arquitectura de Despliegue en Azure

## 📋 Descripción General

Este documento describe la arquitectura completa del proyecto **OpManager Ionic Dashboard** desplegado en **Azure Static Web Apps** con **Azure Functions** como proxy de API.

## 🏗️ Componentes Principales

### 1. Frontend - Azure Static Web Apps

**Tecnologías:**
- **Ionic 8** - Framework UI
- **Angular 19** - Framework de aplicación
- **TypeScript** - Lenguaje de programación

**Ubicación:** Azure Static Web Apps
**Contenido:** Archivos estáticos compilados en la carpeta `www/`

**Características:**
- Single Page Application (SPA)
- Routing del lado del cliente
- Optimización de assets (minificación, tree-shaking)
- CDN global de Azure
- HTTPS automático
- Dominio personalizado disponible

**Configuración:**
```json
// staticwebapp.config.json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*"]
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "platform": {
    "apiRuntime": "node:22"
  }
}
```

### 2. Backend - Azure Functions (API Proxy)

**Tecnología:** Node.js 22
**Ubicación:** `/api/opmanager-proxy/`
**Runtime:** Azure Functions v4

**Responsabilidades:**
1. **Proxy de API**: Reenvía peticiones al OpManager MSP API
2. **Manejo de CORS**: Configura headers CORS apropiados
3. **Autenticación**: Reenvía API Keys de forma segura
4. **Transformación de requests**: Adapta peticiones entre frontend y backend
5. **Logging**: Registra todas las peticiones para debugging

**Endpoints:**
- `GET /api/opmanager-proxy/*` - Proxy de todas las peticiones GET
- `POST /api/opmanager-proxy/*` - Proxy de peticiones POST
- `PUT /api/opmanager-proxy/*` - Proxy de peticiones PUT
- `DELETE /api/opmanager-proxy/*` - Proxy de peticiones DELETE

**Flujo de Autenticación:**
```javascript
// Headers reenviados
headers: {
  'apikey': req.headers.apikey,
  'apiKey': req.headers['apiKey'],
  'authorization': req.headers.authorization,
  'Content-Type': 'application/json'
}
```

### 3. API Externa - OpManager MSP

**URL Base:** `https://itview.intwo.cloud/api`
**Protocolo:** REST API
**Autenticación:** API Key en headers

**Endpoints Principales:**
- `/json/device/getDeviceList` - Lista de dispositivos
- `/json/alarms/getAlarms` - Alertas activas
- `/json/device/getHealthSummary` - Resumen de salud
- `/json/device/getInterfaceList` - Interfaces de red

### 4. CI/CD Pipeline - Azure DevOps

**Archivo:** `azure-pipelines.yml`
**Trigger:** Push a ramas `main` y `develop`

**Etapas del Pipeline:**

#### Stage 1: Build
```yaml
- Install Node.js 22.x
- Cache npm packages
- npm ci (install dependencies)
- Install Ionic & Angular CLI
- ionic build --prod
- Publish artifacts (www/)
```

#### Stage 2: Deploy
```yaml
- Download build artifacts
- Deploy to Azure Static Web Apps
- Deploy Azure Functions (api/)
```

**Variables de Entorno:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Token de autenticación de Azure
- `nodeVersion: '22.x'` - Versión de Node.js
- `buildConfiguration: 'production'` - Configuración de build

## 🔄 Flujo de Datos

### Flujo de Petición Completo

```
1. Usuario → Navegador Web
   └─ Carga aplicación desde Azure Static Web Apps
   
2. Usuario → Acción en UI (ej: ver dispositivos)
   └─ Angular Service hace petición HTTP
   
3. Frontend → Azure Functions
   └─ GET /api/opmanager-proxy/json/device/getDeviceList
   └─ Headers: { apikey: 'xxx' }
   
4. Azure Functions → Validación
   └─ Verifica API Key presente
   └─ Configura CORS headers
   └─ Prepara petición proxy
   
5. Azure Functions → OpManager API
   └─ GET https://itview.intwo.cloud/api/json/device/getDeviceList
   └─ Reenvía headers de autenticación
   
6. OpManager API → Procesa petición
   └─ Valida API Key
   └─ Consulta base de datos
   └─ Retorna datos JSON
   
7. Azure Functions → Recibe respuesta
   └─ Agrega CORS headers
   └─ Retorna al frontend
   
8. Frontend → Procesa respuesta
   └─ Angular Service recibe datos
   └─ Actualiza estado de la aplicación
   └─ Renderiza UI con nuevos datos
```

## 🔐 Seguridad

### Autenticación y Autorización

1. **API Key Storage:**
   - Almacenada en `localStorage` del navegador
   - Enviada en cada petición via headers
   - Nunca expuesta en URLs

2. **CORS Configuration:**
   ```javascript
   headers: {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, apiKey, apikey, Authorization'
   }
   ```

3. **Security Headers (Azure Static Web Apps):**
   ```json
   "globalHeaders": {
     "X-Content-Type-Options": "nosniff",
     "X-Frame-Options": "DENY",
     "X-XSS-Protection": "1; mode=block"
   }
   ```

4. **HTTPS Enforcement:**
   - Todo el tráfico es HTTPS
   - Certificados SSL automáticos de Azure
   - Redirección automática HTTP → HTTPS

### Protección de Datos

- **No hay backend database** - Stateless architecture
- **API Key no se almacena en servidor** - Solo en cliente
- **Proxy oculta API externa** - No expone URLs directamente
- **Logging seguro** - No se registran API Keys

## 📊 Escalabilidad y Rendimiento

### Azure Static Web Apps
- **CDN Global**: Distribución de contenido en múltiples regiones
- **Caching**: Assets estáticos cacheados automáticamente
- **Compression**: Gzip/Brotli habilitado
- **HTTP/2**: Protocolo moderno para mejor rendimiento

### Azure Functions
- **Serverless**: Escala automáticamente según demanda
- **Consumption Plan**: Paga solo por uso
- **Cold Start**: ~1-2 segundos (Node.js 22)
- **Concurrent Executions**: Hasta 200 por instancia

### Optimizaciones Frontend
```typescript
// Virtual Scrolling para listas grandes
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

// Lazy Loading de módulos
loadChildren: () => import('./tab1/tab1.module').then(m => m.Tab1PageModule)

// OnPush Change Detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

## 🌐 Networking

### Dominios y URLs

**Producción:**
- Frontend: `https://<app-name>.azurestaticapps.net`
- API: `https://<app-name>.azurestaticapps.net/api/opmanager-proxy/*`

**Desarrollo Local:**
- Frontend: `http://localhost:8100`
- API Proxy: Configurado en `proxy.conf.json`

### Routing Configuration

**Frontend Routes (Angular):**
```typescript
const routes: Routes = [
  { path: '', redirectTo: 'tabs', pathMatch: 'full' },
  { path: 'tabs', loadChildren: () => import('./tabs/tabs.module') },
  { path: 'settings', loadChildren: () => import('./settings/settings.module') }
];
```

**API Routes (Azure Functions):**
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post", "put", "delete", "options"],
      "route": "opmanager-proxy/{*path}"
    }
  ]
}
```

## 📦 Estructura de Deployment

```
Azure Static Web Apps
├── Frontend (www/)
│   ├── index.html
│   ├── main.*.js (Angular bundle)
│   ├── polyfills.*.js
│   ├── runtime.*.js
│   ├── styles.*.css
│   └── assets/
│       ├── icon/
│       └── shapes.svg
│
└── API (api/)
    ├── host.json
    ├── package.json
    └── opmanager-proxy/
        ├── function.json
        └── index.js
```

## 🔧 Configuración de Entornos

### Desarrollo Local

```bash
# Frontend con proxy
npm run start:proxy

# Variables de entorno
# No se requieren - API Key se configura en UI
```

### Producción (Azure)

```bash
# Build
ionic build --prod

# Deploy (automático via pipeline)
git push origin main
```

**Variables en Azure:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - En Azure DevOps
- `API_BASE_URL` - Configurado en código (https://itview.intwo.cloud/api)

## 📈 Monitoreo y Logging

### Application Insights (Disponible)

Azure Static Web Apps se puede integrar con Application Insights para:
- Monitoreo de rendimiento
- Tracking de errores
- Análisis de uso
- Alertas personalizadas

### Logs de Azure Functions

```javascript
context.log(`[OpManager Proxy] ${req.method} ${fullUrl}`);
context.log(`[OpManager Proxy] Response status: ${response.status}`);
context.log.error('[OpManager Proxy] Error:', error);
```

**Acceso a logs:**
```bash
# Azure CLI
az functionapp logs tail --name <function-app-name> --resource-group <rg-name>

# Azure Portal
Portal → Function App → Monitor → Logs
```

## 🚀 Ventajas de esta Arquitectura

### ✅ Pros

1. **Serverless**: No gestión de servidores
2. **Escalabilidad**: Automática según demanda
3. **Costo-efectivo**: Pago por uso
4. **Global**: CDN distribuido mundialmente
5. **Seguridad**: HTTPS automático, headers de seguridad
6. **CI/CD**: Deployment automático
7. **Mantenimiento**: Mínimo overhead operacional

### ⚠️ Consideraciones

1. **Cold Starts**: Azure Functions puede tener latencia inicial
2. **Límites de ejecución**: 230 segundos por función
3. **Stateless**: No hay persistencia de sesión
4. **Dependencia de Azure**: Vendor lock-in

## 🔄 Alternativas Consideradas

### Render (Implementación Alternativa)

El proyecto también tiene configuración para Render:
- `render.yaml` - Configuración de deployment
- `server/index.js` - Express server con proxy integrado
- Ventaja: Más simple, un solo servicio
- Desventaja: No es serverless, siempre corriendo

### Firebase Hosting (Descartado)

- Removido en conversaciones anteriores
- Razón: Mejor integración con Azure DevOps
- Limitaciones con Azure Functions

## 📚 Referencias

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Node.js Guide](https://docs.microsoft.com/azure/azure-functions/functions-reference-node)
- [Ionic Framework](https://ionicframework.com/)
- [Angular Documentation](https://angular.io/)

## 🛠️ Troubleshooting

### Error: CORS en producción
**Solución:** Verificar que Azure Functions retorna headers CORS correctos

### Error: 404 en rutas de Angular
**Solución:** Verificar `staticwebapp.config.json` tiene `navigationFallback`

### Error: API Key no funciona
**Solución:** Verificar que headers `apikey` o `apiKey` se envían correctamente

### Error: Cold start lento
**Solución:** Considerar Azure Functions Premium Plan para instancias warm

---

**Última actualización:** Diciembre 2024
**Versión:** 1.0
**Autor:** Equipo de Desarrollo OpManager MSP
