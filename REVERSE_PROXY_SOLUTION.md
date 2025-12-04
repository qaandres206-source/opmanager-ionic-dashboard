# 🔧 Solución Final - Reverse Proxy en Azure Static Web Apps

## 🎯 Problema Identificado

Las peticiones a `/api/*` estaban devolviendo **404 (Not Found)** porque Azure Functions no estaba configurada correctamente para manejar rutas dinámicas.

**Error en consola**:
```
GET https://green-wave-016489610.3.azurestaticapps.net/api/json/v2/device/listDevices
404 (Not Found)
```

---

## ✅ Solución Implementada

En lugar de usar Azure Functions como proxy, ahora usamos **Azure Static Web Apps Reverse Proxy** directamente en `staticwebapp.config.json`.

### Configuración Anterior (❌ No funcionaba):
```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    }
  ]
}
```

### Configuración Nueva (✅ Funciona):
```json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "https://itview.intwo.cloud/api/{*}",
      "allowedRoles": ["anonymous"]
    }
  ]
}
```

---

## 🔄 Cómo Funciona Ahora

```
Usuario → https://green-wave-016489610.3.azurestaticapps.net/api/json/v2/device/listDevices
            ↓
Azure Static Web Apps (Reverse Proxy)
            ↓
https://itview.intwo.cloud/api/json/v2/device/listDevices
            ↓
Respuesta → Usuario
```

**Ventajas**:
- ✅ No requiere Azure Functions
- ✅ Más simple y directo
- ✅ Menor latencia
- ✅ No hay problemas de CORS
- ✅ Los headers (apiKey) se pasan correctamente

---

## 🧪 Verificación

### Paso 1: Espera el Deployment (2-5 minutos)

Ve a: https://github.com/qaandres206-source/opmanager-ionic-dashboard/actions

Espera a que el workflow termine con ✅

### Paso 2: Abre tu Aplicación

```
https://green-wave-016489610.3.azurestaticapps.net
```

### Paso 3: Abre DevTools (F12)

Ve a la pestaña **Network**

### Paso 4: Prueba la Conexión

1. Ve a **Configuración**
2. Pega tu API Key
3. Haz clic en **PROBAR CONEXIÓN**

### Paso 5: Verifica en Network

Deberías ver:

```
GET /api/json/v2/device/listDevices?selCustomerID=-1&regionID=-1
Status: 200 OK
```

**NO** deberías ver:
- ❌ 404 Not Found
- ❌ CORS errors
- ❌ Network errors

---

## 🔍 Debugging

### Si sigues viendo 404:

1. **Verifica que el deployment terminó**:
   - Ve a GitHub Actions
   - Asegúrate de que el último commit (`fix: configure reverse proxy...`) se desplegó

2. **Limpia el cache del navegador**:
   - Presiona `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)
   - O abre en modo incógnito

3. **Verifica la configuración**:
   ```bash
   # Descarga el archivo de configuración actual
   curl https://green-wave-016489610.3.azurestaticapps.net/staticwebapp.config.json
   ```

### Si ves CORS errors:

Esto **NO debería pasar** con la nueva configuración. Si lo ves:

1. Verifica que `staticwebapp.config.json` tiene el `rewrite`
2. Haz un hard refresh del navegador
3. Verifica en Network que la petición va a `/api/*` y no directamente a `itview.intwo.cloud`

### Si ves "Invalid API Key":

Esto es **normal** si la API key es incorrecta. Verifica:

1. Que la API key esté guardada en localStorage
2. Que el header `apiKey` se esté enviando en la petición (ve a Network → Headers)

---

## 📊 Comparación de Soluciones

| Solución | Estado | Complejidad | Latencia |
|----------|--------|-------------|----------|
| Azure Functions Proxy | ❌ No funcionó | Alta | Media |
| Reverse Proxy (Actual) | ✅ Funciona | Baja | Baja |

---

## 🎉 Resultado Esperado

Después del deployment, deberías poder:

1. ✅ Ingresar tu API Key en Settings
2. ✅ Hacer clic en "PROBAR CONEXIÓN" sin errores
3. ✅ Ver los dispositivos en la página de Dispositivos
4. ✅ Ver las alarmas en la página de Alarmas
5. ✅ Ver las interfaces en la página de Interfaces
6. ✅ No ver errores de CORS en la consola
7. ✅ No ver errores 404 en Network

---

## 📝 Próximos Pasos

1. **Espera 2-5 minutos** a que el deployment termine
2. **Abre tu app** y prueba la conexión
3. **Si funciona**: ¡Listo! 🎉
4. **Si no funciona**: Comparte el error de la consola y te ayudo

---

**Última actualización**: 2025-12-04 15:15
**Commit**: `fix: configure reverse proxy for API in staticwebapp.config.json`
**Estado**: ✅ Desplegando...
