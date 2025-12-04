# 🔧 Diagnóstico y Solución - Azure Deployment

## 📊 **Análisis del Problema**

### ✅ Lo que estaba funcionando:
1. **Deployment exitoso en Azure** - Status: Succeeded
2. **Azure Function proxy configurada correctamente** - Ruta: `/api/opmanager-proxy/{*path}`
3. **API funcionando en Postman** - Todos los endpoints responden correctamente

### ❌ Lo que NO estaba funcionando:
1. **La aplicación desplegada no mostraba datos**
2. **Las peticiones iban a la ruta incorrecta**

---

## 🔍 **Causa Raíz Identificada**

### Problema 1: Environment de Producción Incorrecto

**Archivo**: `src/environments/environment.prod.ts`

**Antes** ❌:
```typescript
export const environment = {
  production: true,
  opmanagerApiUrl: '/api', // ← INCORRECTO
};
```

**Después** ✅:
```typescript
export const environment = {
  production: true,
  opmanagerApiUrl: '/api/opmanager-proxy', // ← CORRECTO
};
```

**Impacto**: 
- Las peticiones iban a `/api/json/v2/device/listDevices` (404 Not Found)
- Deberían ir a `/api/opmanager-proxy/json/v2/device/listDevices` (200 OK)

### Problema 2: Headers Incompletos en Azure Function

Según las imágenes de Postman, el API de OpManager usa:
- ✅ `apiKey` header
- ✅ `Cookie` header (JSESSIONID para mantener sesión)
- ✅ `User-Agent` header
- ✅ `Accept` header

**Antes** ❌:
```javascript
// Solo pasaba apiKey y authorization
const headers = {
    'Content-Type': 'application/json',
};
if (req.headers.apikey) {
    headers['apikey'] = req.headers.apikey;
}
```

**Después** ✅:
```javascript
// Pasa todos los headers necesarios
const headers = {
    'Content-Type': 'application/json',
};
if (req.headers.apikey) {
    headers['apikey'] = req.headers.apikey;
}
if (req.headers.cookie) {
    headers['cookie'] = req.headers.cookie;
}
if (req.headers['user-agent']) {
    headers['user-agent'] = req.headers['user-agent'];
}
if (req.headers.accept) {
    headers['accept'] = req.headers.accept;
}
```

---

## 🔄 **Flujo Correcto Ahora**

```
Usuario → https://green-wave-016489610.3.azurestaticapps.net
            ↓
Angular App (environment.prod.ts)
            ↓
Petición a: /api/opmanager-proxy/json/v2/device/listDevices
            ↓
Azure Function (opmanager-proxy)
  - Recibe headers: apiKey, Cookie, User-Agent, Accept
  - Construye URL: https://itview.intwo.cloud/api/json/v2/device/listDevices
  - Pasa todos los headers al API externo
            ↓
OpManager API (itview.intwo.cloud)
  - Valida apiKey
  - Valida Cookie (JSESSIONID)
  - Retorna datos
            ↓
Azure Function → Angular App → Usuario
```

---

## 📝 **Cambios Realizados**

### 1. Actualización de Environment de Producción
**Archivo**: `src/environments/environment.prod.ts`
- ✅ Cambiado `opmanagerApiUrl` de `/api` a `/api/opmanager-proxy`

### 2. Mejora de Azure Function Proxy
**Archivo**: `api/opmanager-proxy/index.js`
- ✅ Agregado forwarding de `Cookie` header
- ✅ Agregado forwarding de `User-Agent` header
- ✅ Agregado forwarding de `Accept` header

### 3. Build y Deployment
- ✅ Build exitoso (8.5 segundos)
- ✅ Commit y push a GitHub
- ✅ Deployment automático en Azure (en progreso)

---

## ⏱️ **Próximos Pasos**

### 1. Espera el Deployment (2-5 minutos)

Monitorea el progreso en:
- **GitHub Actions**: https://github.com/qaandres206-source/opmanager-ionic-dashboard/actions
- **Commit**: `fix: update production environment to use Azure Function proxy and enhance header forwarding`

### 2. Verifica el Deployment

Una vez que termine el deployment:

1. **Abre tu aplicación**:
   ```
   https://green-wave-016489610.3.azurestaticapps.net
   ```

2. **Hard refresh** (para limpiar cache):
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

3. **Abre DevTools** (F12):
   - Ve a la pestaña **Network**
   - Ve a la pestaña **Console**

4. **Ve a Settings**:
   - Pega tu API Key
   - Haz clic en **"PROBAR CONEXIÓN"**

### 3. Verifica en Network Tab

**Deberías ver** ✅:
```
Request URL: /api/opmanager-proxy/json/v2/device/listDevices?selCustomerID=-1&regionID=-1
Status: 200 OK
Headers:
  - apiKey: [tu-api-key]
  - Cookie: JSESSIONID=...
  - User-Agent: Mozilla/5.0...
```

**NO deberías ver** ❌:
```
Request URL: /api/json/v2/device/listDevices  ← Falta "opmanager-proxy"
Status: 404 Not Found
```

### 4. Verifica en Console Tab

**Deberías ver** ✅:
```
[OpManagerApiService] Initializing... { 
  production: true, 
  configuredUrl: '/api/opmanager-proxy',
  finalBaseUrl: '/api/opmanager-proxy' 
}
```

---

## 🐛 **Debugging**

### Si sigues viendo 404:

1. **Verifica que el deployment terminó**:
   - Ve a GitHub Actions
   - Asegúrate de que el último commit se desplegó exitosamente

2. **Limpia el cache del navegador completamente**:
   - Abre DevTools (F12)
   - Clic derecho en el botón de refresh
   - Selecciona **"Empty Cache and Hard Reload"**
   - O abre en modo incógnito

3. **Verifica la URL de la petición**:
   - Debe incluir `/api/opmanager-proxy/`
   - Si no lo incluye, el cache del navegador no se limpió

### Si ves "Invalid API Key":

Esto es **normal** si la API key es incorrecta. Verifica:

1. **API Key guardada en localStorage**:
   - Abre DevTools → Console
   - Ejecuta: `localStorage.getItem('opmanagerApiKey')`
   - Debe retornar tu API key

2. **Header enviado en la petición**:
   - Ve a Network → Headers
   - Busca `apiKey` en Request Headers
   - Debe tener tu API key

### Si ves errores de CORS:

Esto **NO debería pasar** con la configuración actual. Si lo ves:

1. Verifica que la Azure Function está retornando los headers CORS:
   ```javascript
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
   'Access-Control-Allow-Headers': 'Content-Type, apiKey, apikey, Authorization'
   ```

2. Verifica en Network que la petición va a `/api/opmanager-proxy/*`

---

## 📊 **Comparación: Local vs Azure**

| Aspecto | Local (ionic serve) | Azure (Producción) |
|---------|---------------------|-------------------|
| **Base URL** | `https://itview.intwo.cloud/api` | `/api/opmanager-proxy` |
| **Environment** | `environment.ts` | `environment.prod.ts` |
| **Proxy** | `proxy.conf.json` | Azure Function |
| **CORS** | Manejado por proxy | Manejado por Azure Function |
| **Headers** | Directo al API | Forwarding por Azure Function |

---

## 🎯 **Resultado Esperado**

Después del deployment, deberías poder:

1. ✅ Abrir la aplicación en Azure
2. ✅ Ingresar tu API Key en Settings
3. ✅ Hacer clic en "PROBAR CONEXIÓN" sin errores
4. ✅ Ver los dispositivos en la página de Dispositivos
5. ✅ Ver las alarmas en la página de Alarmas
6. ✅ Ver las interfaces en la página de Interfaces
7. ✅ No ver errores de CORS en la consola
8. ✅ No ver errores 404 en Network
9. ✅ Ver peticiones a `/api/opmanager-proxy/*` con status 200

---

## 📝 **Notas Importantes**

### Sobre el Local (ionic serve)

Si `ionic serve` no funciona localmente, puede ser por:

1. **Versión de Node.js**: Asegúrate de usar Node.js 18 o 22
   ```bash
   nvm use 18
   # o
   nvm use 22
   ```

2. **Proxy local**: El archivo `proxy.conf.json` debe estar configurado:
   ```json
   {
     "/api": {
       "target": "https://itview.intwo.cloud",
       "secure": false,
       "changeOrigin": true
     }
   }
   ```

3. **Environment local**: Usa `environment.ts` (no `environment.prod.ts`):
   ```typescript
   export const environment = {
     production: false,
     opmanagerApiUrl: 'https://itview.intwo.cloud/api',
   };
   ```

### Sobre las Cookies

Si el API requiere cookies de sesión (JSESSIONID), la Azure Function ahora las pasa correctamente. Sin embargo, ten en cuenta que:

- Las cookies se mantienen por sesión del navegador
- Si cierras el navegador, la sesión puede expirar
- Puede que necesites re-autenticarte periódicamente

---

**Última actualización**: 2025-12-04 16:32
**Commit**: `fix: update production environment to use Azure Function proxy and enhance header forwarding`
**Estado**: 🚀 Desplegando...
**Tiempo estimado**: 2-5 minutos
**URL de la app**: https://green-wave-016489610.3.azurestaticapps.net
