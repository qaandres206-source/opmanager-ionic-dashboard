# OpManager Ionic Dashboard - Guía de Configuración

## Requisitos Previos
- Node.js v22 (recomendado usar `nvm`)
- npm o yarn
- Una API Key válida de OpManager MSP

## Instalación Inicial

```bash
cd /Users/andresm/code/opmanager-ionic-dashboard
npm install
```

## Configuración de la API Key

1. Abre `http://localhost:8100` cuando `ionic serve` esté corriendo.
2. En la app, dirígete a **Configuración** (Settings tab).
3. Ingresa tu **API Key** de OpManager MSP.
4. Presiona **Conectar** para verificar la conexión.

**Nota:** La API Key se guarda en `localStorage` de tu navegador.

## Ejecutar la App (con Proxy para CORS)

El proxy evita errores CORS durante desarrollo. El servidor de Ionic reenvía las llamadas a `/api/...` hacia `https://itview.intwo.cloud/api/...`.

```bash
nvm use 22
ionic serve --proxy-config proxy.conf.json
```

La app se abrirá en `http://localhost:8100`.

## Parámetros Importantes

Todos los endpoints reciben automáticamente:
- **`apiKey`** → enviado en headers HTTP (no en parámetros)
- **`selCustomerID`** → `-1` por defecto (todos los clientes); cámbialo por el ID del cliente específico en la UI
- **`regionID`** → `-1` por defecto (todas las regiones)

Ejemplo de cómo se envía una petición desde la app:
```
GET http://localhost:8100/api/json/alarm/listAlarms?selCustomerID=-1&regionID=-1
Headers: apiKey: <tu_api_key>
```

## Endpoints Disponibles

### Dispositivos
- **Todos los dispositivos**: `getDevices()`
- **Por categoría** (Firewall, Server, Switch, etc.): `getDevices({ category: 'Firewall' })`
- **Por estado** (severity=1 Critical, 4 Service Down, 7 Unmanaged): `getDevices({ severity: 1 })`
- **Notas de dispositivo**: `getDeviceNotes(deviceName)`

### Alertas
- **Todas las alertas**: `getAlarms()`
- **Por severidad** (1=Critical, 4=Service Down): `getAlarms({ severity: 1 })`
- **Por tipo**: `getAlarms({ alertType: 'ActiveAlarms' })`

### Eventos
- **Todos los eventos**: `getEvents()`
- **Por tipo** (Device Down, Interface Down): `getEvents({ eventType: 'Device Down' })`

### Ping / Trace (POST)
- **Ping a dispositivo**: `postPingResponse(deviceName)`
- **Trace a dispositivo**: `postTraceResponse(deviceName)`

## Características Implementadas

✅ **Proxy de desarrollo** → Evita CORS en `ionic serve`  
✅ **Paginación manual en cliente** → Tab1 (Dispositivos) y Tab2 (Alertas)  
✅ **Virtual scroll (CDK)** → Renderiza eficientemente miles de alertas  
✅ **Filtro global de cliente** → Compartido entre pestañas  
✅ **Spinner de carga** → Feedback visual durante peticiones  
✅ **Manejo de errores CORS** → Mensaje útil si algo falla  

## Resolución de Problemas

### Error "Access to XMLHttpRequest blocked by CORS"
- Asegúrate de estar usando `ionic serve --proxy-config proxy.conf.json`
- El proxy debe estar activo (verifica que no haya errores en la salida de `ionic`)

### Alertas/Dispositivos no cargan
- Revisa que hayas ingresado una **API Key válida** en Configuración
- Abre **DevTools (F12) → Network** y verifica que las llamadas lleguen a `/api/...`
- Revisa la pestaña **Console** para mensajes de error

### Rendimiento lento al cargar muchas alertas
- El sistema carga ~300k registros. Esto es **normal** la primera vez (puede tardar 6-10s).
- El virtual scroll mantendrá la UI responsiva una vez cargado.

## Estructura del Proyecto

```
src/app/
├── services/
│   ├── opmanager-api.service.ts      ← Todos los endpoints aquí
│   ├── dashboard-state.service.ts    ← Estado global (cliente, carga, etc.)
├── tab1/                             ← Dispositivos (con paginación)
├── tab2/                             ← Alertas (con virtual scroll)
├── tab3/                             ← Resumen de Salud
├── settings/                         ← Ingreso de API Key
└── ...
```

## Testing con Playwright

### Instalación de Playwright

```bash
# Instalar Playwright
npm install -D @playwright/test

# Instalar browsers
npx playwright install
```

### Ejecutar Tests E2E

```bash
# Ejecutar todos los tests
npm run test:e2e

# Con UI interactiva (recomendado)
npm run test:e2e:ui

# En modo headed (ver el browser)
npm run test:e2e:headed

# Ver reporte
npm run test:e2e:report
```

### Configurar API Key para Tests

Para tests con datos reales:

```bash
export TEST_API_KEY="your-api-key-here"
```

Para más detalles, consulta [TESTING.md](./TESTING.md)

## Próximas Mejoras

- [ ] Añadir más filtros en Tab1 (búsqueda, orden)
- [ ] Implementar tab para Eventos
- [ ] Exportar alertas/dispositivos a Excel
- [ ] Caché local (IndexedDB) para datos frecuentes
- [ ] Gráficos de tendencias en Tab3

## Ayuda

Si encuentras problemas, revisa:
1. La consola del navegador (DevTools → Console)
2. El output de `ionic serve` en la terminal
3. El Network tab de DevTools para ver las peticiones HTTP

---

**Última actualización**: 18 de Noviembre de 2025
