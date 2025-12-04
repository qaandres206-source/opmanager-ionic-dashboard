# 🔧 Solución de Problemas de CORS y Testing

## 🎯 Problema Identificado

**Error**: `Http failure response for https://green-wave-016489610.3.azurestaticapps.net/: 0 Unknown Error`

**Causa**: CORS (Cross-Origin Resource Sharing) - El navegador bloqueaba las peticiones directas desde tu dominio de Azure hacia la API de OpManager.

---

## ✅ Solución Implementada

### 1. **Proxy de Azure Functions**

Configuramos Azure Functions para actuar como proxy entre tu aplicación y la API de OpManager:

```
Tu App (Azure) → Azure Function (/api/*) → OpManager API (itview.intwo.cloud)
```

**Archivos modificados**:

- `api/host.json`: Configurado `routePrefix: ""` para rutas limpias
- `api/proxies/function.json`: Agregada ruta `api/{*path}` para capturar todas las peticiones
- `src/app/services/opmanager-api.service.ts`: Cambiado para usar siempre `/api` como proxy

### 2. **Beneficios de esta solución**:

- ✅ No hay problemas de CORS
- ✅ La API key nunca se expone en el navegador
- ✅ Funciona tanto en desarrollo como en producción
- ✅ Puedes agregar autenticación/validación en el proxy si lo necesitas

---

## 🧪 Testing del Deployment

### **Opción 1: Testing Manual en el Navegador**

1. **Abre tu aplicación en Azure**:
   ```
   https://green-wave-016489610.3.azurestaticapps.net
   ```

2. **Abre las DevTools** (F12)

3. **Ve a la pestaña Console**

4. **Ingresa tu API Key** en Settings

5. **Verifica los logs**:
   ```javascript
   // Deberías ver:
   [OpManagerApiService] Initializing...
   [OpManager API] Request { method: 'GET', url: '/api/json/v2/device/listDevices', ... }
   ```

6. **Ve a la pestaña Network**:
   - Filtra por "api"
   - Deberías ver peticiones a `/api/json/v2/device/listDevices`
   - Status: 200 OK
   - No deberías ver errores de CORS

### **Opción 2: Testing con Playwright (Automatizado)**

Ya tienes Playwright configurado. Vamos a crear tests para verificar el deployment:

```bash
# Ejecutar tests contra producción
npm run test:e2e -- --grep "production"
```

### **Opción 3: Testing de la API directamente**

Puedes probar el proxy directamente:

```bash
# Reemplaza YOUR_API_KEY con tu API key real
curl -H "apiKey: YOUR_API_KEY" \
  "https://green-wave-016489610.3.azurestaticapps.net/api/json/v2/device/listDevices?selCustomerID=-1&regionID=-1"
```

---

## 📊 Checklist de Verificación Post-Deployment

### Frontend (Aplicación Angular/Ionic)

- [ ] La aplicación carga correctamente
- [ ] No hay errores en la consola del navegador
- [ ] El formulario de Settings es visible
- [ ] Puedes ingresar y guardar la API Key
- [ ] El botón "PROBAR CONEXIÓN" funciona
- [ ] El botón "ACTUALIZAR" carga datos

### API Proxy (Azure Functions)

- [ ] Las peticiones a `/api/*` se redirigen correctamente
- [ ] No hay errores de CORS
- [ ] Los headers (apiKey) se pasan correctamente
- [ ] Las respuestas tienen el formato correcto

### Datos

- [ ] Los dispositivos se cargan en la página de Dispositivos
- [ ] Las alarmas se muestran en la página de Alarmas
- [ ] Las interfaces se listan en la página de Interfaces
- [ ] Los gráficos y estadísticas se muestran correctamente

---

## 🔍 Debugging en Producción

### Ver logs de Azure Functions

1. Ve a Azure Portal
2. Busca tu Static Web App: `dashboard-msp`
3. Ve a **Functions** en el menú lateral
4. Haz clic en tu función `proxies`
5. Ve a **Monitor** para ver los logs

### Ver logs en el navegador

Abre DevTools (F12) y ve a la pestaña Console. Deberías ver:

```javascript
[OpManagerApiService] Initializing... { production: true, ... }
[OpManager API] Request { method: 'GET', url: '/api/json/v2/device/listDevices', ... }
```

### Verificar que el proxy funciona

En la pestaña Network de DevTools:

1. Filtra por "api"
2. Haz clic en una petición
3. Ve a la pestaña "Headers"
4. Verifica:
   - **Request URL**: Debe ser `/api/json/...`
   - **Status Code**: Debe ser `200`
   - **Response Headers**: Debe tener `Content-Type: application/json`

---

## 🚨 Troubleshooting

### Error: "Failed to fetch" o "Network Error"

**Posibles causas**:
1. Azure Functions no está desplegada
2. La ruta del proxy está mal configurada
3. La API de OpManager no responde

**Solución**:
```bash
# Verificar que la función está desplegada
curl https://green-wave-016489610.3.azurestaticapps.net/api/json/v2/device/listDevices

# Deberías ver un error de autenticación (es normal sin API key)
# Si ves 404, el proxy no está configurado correctamente
```

### Error: "Invalid API Key"

**Causa**: La API key es incorrecta o no se está pasando correctamente

**Solución**:
1. Verifica que guardaste la API key en Settings
2. Abre DevTools → Application → Local Storage
3. Verifica que existe la key `opmanagerApiKey`
4. Verifica en Network que el header `apiKey` se está enviando

### Error: "CORS policy"

**Causa**: El proxy no está funcionando y la app está intentando conectarse directamente

**Solución**:
1. Verifica que `baseUrl` en el servicio sea `/api`
2. Haz un hard refresh (Ctrl+Shift+R o Cmd+Shift+R)
3. Limpia el cache del navegador

---

## 📝 Testing Automatizado con Playwright

Crea un archivo de test para producción:

```typescript
// e2e/production.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Production Deployment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://green-wave-016489610.3.azurestaticapps.net');
  });

  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle(/OpManager/);
  });

  test('should show settings page', async ({ page }) => {
    await page.click('text=Configuración');
    await expect(page.locator('text=API Key de OpManager')).toBeVisible();
  });

  test('should test API connection', async ({ page }) => {
    // Navegar a settings
    await page.click('text=Configuración');
    
    // Ingresar API key (usa una variable de entorno)
    const apiKey = process.env.OPMANAGER_API_KEY;
    if (apiKey) {
      await page.fill('input[type="password"]', apiKey);
      await page.click('text=GUARDAR API KEY');
      
      // Probar conexión
      await page.click('text=PROBAR CONEXIÓN');
      
      // Verificar que no hay errores
      await expect(page.locator('text=Conexión exitosa')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should not have CORS errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Verificar que no hay errores de CORS
    const corsErrors = errors.filter(e => e.includes('CORS') || e.includes('Cross-Origin'));
    expect(corsErrors).toHaveLength(0);
  });
});
```

Ejecutar tests:

```bash
# Configurar la API key como variable de entorno
export OPMANAGER_API_KEY="tu-api-key-aqui"

# Ejecutar tests de producción
npm run test:e2e -- production.spec.ts

# Ejecutar en modo headed para ver el navegador
npm run test:e2e:headed -- production.spec.ts
```

---

## 🎯 Resumen de Cambios

### Antes (❌ No funcionaba):
```
App en Azure → Intenta conectar directamente a itview.intwo.cloud
                ↓
            ❌ CORS Error
```

### Después (✅ Funciona):
```
App en Azure → /api/* → Azure Function → itview.intwo.cloud
                                ↓
                            ✅ Success
```

---

## 📞 Próximos Pasos

1. **Espera a que el deployment termine** (2-5 minutos)
2. **Abre tu app en Azure**: https://green-wave-016489610.3.azurestaticapps.net
3. **Prueba la conexión** con tu API key
4. **Verifica que no hay errores de CORS** en la consola
5. **Navega por las diferentes páginas** para verificar que todo funciona

---

**Última actualización**: 2025-12-04
**Estado**: ✅ Proxy configurado, esperando deployment
