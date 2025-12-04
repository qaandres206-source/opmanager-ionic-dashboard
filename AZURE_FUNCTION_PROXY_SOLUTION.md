# 🔧 Solución Final - Azure Function Proxy Dedicada

## 📊 **Resumen de lo que pasó**

### Intento 1: Reverse Proxy en staticwebapp.config.json ❌
```json
{
  "route": "/api/*",
  "rewrite": "https://itview.intwo.cloud/api/{*}"
}
```
**Resultado**: 404 Not Found - Azure Static Web Apps no soporta rewrites externos de esta forma.

### Intento 2: Azure Function Proxy Dedicada ✅
Creé una Azure Function específica en `/api/opmanager-proxy/*` que:
- Recibe peticiones de tu app
- Las redirige a `https://itview.intwo.cloud/api/*`
- Pasa todos los headers (incluido `apiKey`)
- Retorna la respuesta al cliente

---

## 🔄 **Cómo Funciona Ahora**

```
Tu App → /api/opmanager-proxy/json/v2/device/listDevices
           ↓
Azure Function (opmanager-proxy)
           ↓
https://itview.intwo.cloud/api/json/v2/device/listDevices
           ↓
Respuesta → Tu App
```

---

## 📝 **Cambios Realizados**

### 1. Nueva Azure Function: `api/opmanager-proxy/`

**`function.json`**:
```json
{
  "route": "opmanager-proxy/{*path}"
}
```

**`index.js`**:
- Proxy completo con soporte para todos los métodos HTTP
- Pasa headers `apiKey`, `apikey`, `authorization`
- Maneja errores correctamente
- Agrega headers CORS

### 2. Actualización del Servicio Angular

**Antes**:
```typescript
private baseUrl = '/api';
```

**Ahora**:
```typescript
private baseUrl = '/api/opmanager-proxy';
```

### 3. Limpieza de staticwebapp.config.json

Eliminé el `rewrite` que no funcionaba.

---

## ⏱️ **Próximos Pasos**

### 1. Espera el Deployment (2-5 minutos)

El workflow está ejecutándose ahora:
- Ve a: https://github.com/qaandres206-source/opmanager-ionic-dashboard/actions
- Espera a que termine con ✅

### 2. Prueba la Aplicación

Una vez que el deployment termine:

1. **Abre tu app**: https://green-wave-016489610.3.azurestaticapps.net
2. **Hard refresh**: Ctrl+Shift+R (o Cmd+Shift+R en Mac)
3. **Abre DevTools** (F12) → Pestaña **Network**
4. **Ve a Settings** y asegúrate de que tu API Key esté guardada
5. **Haz clic en "PROBAR CONEXIÓN"**

### 3. Verifica en Network

**Deberías ver**:
```
GET /api/opmanager-proxy/json/v2/device/listDevices?selCustomerID=-1&regionID=-1
Status: 200 OK
```

**NO deberías ver**:
```
Status: 404 Not Found
```

---

## 🔍 **Debugging**

Si ves 404 de nuevo:

1. **Verifica que el deployment terminó**
2. **Verifica la URL de la petición en Network**:
   - Debe ser: `/api/opmanager-proxy/json/v2/device/listDevices`
   - NO debe ser: `/api/json/v2/device/listDevices`
3. **Si la URL es incorrecta**, haz un hard refresh más agresivo:
   - Abre DevTools
   - Clic derecho en el botón de refresh
   - Selecciona "Empty Cache and Hard Reload"

---

## 📊 **Monitoreo del Deployment**

Puedes ver el progreso en tiempo real:
- GitHub Actions: https://github.com/qaandres206-source/opmanager-ionic-dashboard/actions
- Workflow actual: #15 (fix: create dedicated Azure Function proxy for OpManager API)

---

## 🎯 **Qué Esperar**

### ✅ Si funciona:

**Network Tab**:
```
Name: listDevices?selCustomerID=-1&regionID=-1
Status: 200 OK
Type: xhr
Size: ~5KB
```

**Console Tab**:
```
[OpManagerApiService] Initializing... { finalBaseUrl: '/api/opmanager-proxy' }
[OpManager API] Request { url: '/api/opmanager-proxy/json/v2/device/listDevices', ... }
```

**En la App**:
- ✅ El botón "PROBAR CONEXIÓN" muestra éxito
- ✅ Puedes navegar a "Dispositivos" y ver datos
- ✅ Puedes navegar a "Alarmas" y ver datos

### ❌ Si NO funciona:

Comparte:
1. Captura de la pestaña Network mostrando la petición
2. Captura de la pestaña Console mostrando errores
3. La URL exacta que se está llamando

---

**Última actualización**: 2025-12-04 15:25
**Commit**: `fix: create dedicated Azure Function proxy for OpManager API`
**Estado**: 🚀 Desplegando...
**Tiempo estimado**: 2-5 minutos
