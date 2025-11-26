# Deployment Guide - OpManager MSP Dashboard

Esta guía cubre el proceso completo de deployment del OpManager MSP Dashboard en Firebase.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Configuración Inicial](#configuración-inicial)
- [Build de Producción](#build-de-producción)
- [Deployment a Firebase](#deployment-a-firebase)
- [Variables de Entorno](#variables-de-entorno)
- [Cloud Functions](#cloud-functions)
- [Checklist de Producción](#checklist-de-producción)
- [Rollback](#rollback)
- [Monitoreo](#monitoreo)

## 🔧 Requisitos Previos

- Node.js v22+
- Firebase CLI instalado globalmente
- Acceso al proyecto Firebase
- Permisos de deployment

### Instalar Firebase CLI

```bash
npm install -g firebase-tools

# Login a Firebase
firebase login

# Verificar login
firebase projects:list
```

## ⚙️ Configuración Inicial

### 1. Inicializar Firebase (solo primera vez)

```bash
# En el directorio del proyecto
firebase init

# Seleccionar:
# - Hosting
# - Functions
```

### 2. Configurar Proyecto

Verifica que `.firebaserc` tenga el proyecto correcto:

```json
{
  "projects": {
    "default": "opmanager-dashboard-app"
  }
}
```

### 3. Configurar Hosting

Verifica `firebase.json`:

```json
{
  "hosting": {
    "public": "www",
    "rewrites": [
      {
        "source": "/api/**",
        "function": "apiProxy"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 🏗️ Build de Producción

### 1. Build del Frontend

```bash
# Build optimizado para producción
npm run build

# Verifica que se creó el directorio www/
ls -la www/
```

### 2. Build de Cloud Functions

```bash
cd functions
npm run build

# Verifica que se creó lib/
ls -la lib/
cd ..
```

## 🚀 Deployment a Firebase

### Deployment Completo

```bash
# Deploy hosting + functions
firebase deploy

# Con mensaje de deployment
firebase deploy -m "Release v1.2.3"
```

### Deployment Selectivo

```bash
# Solo hosting
firebase deploy --only hosting

# Solo functions
firebase deploy --only functions

# Function específica
firebase deploy --only functions:apiProxy
```

### Deployment con Preview

```bash
# Crear preview channel
firebase hosting:channel:deploy preview

# Deploy a un canal específico
firebase hosting:channel:deploy staging
```

## 🔐 Variables de Entorno

### Producción

Configura las variables en `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  opmanagerApiUrl: '/api', // Usa el proxy de Cloud Functions
};
```

### Development

`src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  opmanagerApiUrl: 'https://itview.intwo.cloud/api',
};
```

### Cloud Functions

Las Cloud Functions usan variables de entorno configuradas en el código:

```typescript
const API_BASE_URL = 'https://itview.intwo.cloud/api';
```

Para usar Firebase Config (opcional):

```bash
# Set config
firebase functions:config:set api.base_url="https://itview.intwo.cloud/api"

# Get config
firebase functions:config:get

# Deploy después de cambiar config
firebase deploy --only functions
```

## ☁️ Cloud Functions

### Configuración de Functions

En `functions/package.json`:

```json
{
  "engines": {
    "node": "20"
  }
}
```

### Logs de Functions

```bash
# Ver logs en tiempo real
firebase functions:log

# Logs de una función específica
firebase functions:log --only apiProxy

# Últimas 100 líneas
firebase functions:log --only apiProxy --lines 100
```

### Debugging Functions

```bash
# Ejecutar localmente con emulador
firebase emulators:start --only functions

# Test local
curl http://localhost:5001/opmanager-dashboard-app/us-central1/apiProxy/health
```

## ✅ Checklist de Producción

Antes de cada deployment, verifica:

### Pre-Deployment

- [ ] Tests E2E pasando: `npm run test:e2e`
- [ ] Tests unitarios pasando: `npm test`
- [ ] Build sin errores: `npm run build`
- [ ] Functions build sin errores: `cd functions && npm run build`
- [ ] Lint sin errores: `npm run lint`
- [ ] Variables de entorno correctas
- [ ] API Key de producción configurada (si aplica)

### Post-Deployment

- [ ] Verificar que el sitio carga: `https://opmanager-dashboard.web.app`
- [ ] Probar autenticación con API Key
- [ ] Verificar que los datos cargan correctamente
- [ ] Revisar logs de Cloud Functions: `firebase functions:log`
- [ ] Verificar que no hay errores en la consola del browser
- [ ] Probar en múltiples browsers (Chrome, Firefox, Safari)
- [ ] Probar en móvil

## 🔄 Rollback

### Rollback de Hosting

```bash
# Ver versiones anteriores
firebase hosting:releases:list

# Rollback a versión anterior
firebase hosting:rollback
```

### Rollback de Functions

Las functions no tienen rollback automático. Debes:

1. Revertir el código en git
2. Rebuild: `cd functions && npm run build`
3. Redeploy: `firebase deploy --only functions`

## 📊 Monitoreo

### Firebase Console

Accede a [Firebase Console](https://console.firebase.google.com/):

- **Hosting**: Métricas de tráfico y bandwidth
- **Functions**: Invocaciones, errores, latencia
- **Performance**: Tiempos de carga

### Logs

```bash
# Logs de hosting
firebase hosting:logs

# Logs de functions
firebase functions:log --only apiProxy

# Filtrar por severidad
firebase functions:log --only apiProxy --severity ERROR
```

### Alertas

Configura alertas en Firebase Console:

1. Ve a **Alerting** en el menú
2. Crea alertas para:
   - Errores en Cloud Functions
   - Uso excesivo de bandwidth
   - Latencia alta

## 🌍 Dominios Personalizados

### Agregar Dominio

```bash
# Agregar dominio
firebase hosting:sites:create my-custom-domain

# Conectar dominio
firebase hosting:channel:deploy production --site my-custom-domain
```

### Configurar DNS

En tu proveedor de DNS, agrega:

```
Type: A
Name: @
Value: <IP de Firebase>

Type: CNAME
Name: www
Value: opmanager-dashboard.web.app
```

## 🔒 Seguridad

### Headers de Seguridad

En `firebase.json`:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          }
        ]
      }
    ]
  }
}
```

### CORS en Cloud Functions

Ya configurado en `functions/src/index.ts`:

```typescript
res.set('Access-Control-Allow-Origin', '*');
res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, apiKey');
```

## 💰 Costos

### Hosting

- **Gratis**: 10 GB almacenamiento, 360 MB/día transferencia
- **Blaze**: $0.026/GB almacenamiento, $0.15/GB transferencia

### Cloud Functions

- **Gratis**: 2M invocaciones/mes, 400K GB-segundos
- **Blaze**: $0.40/millón invocaciones, $0.0000025/GB-segundo

### Optimización de Costos

1. **Caché en Functions**: Ya implementado (5 min TTL)
2. **Comprimir assets**: Gzip automático en Firebase Hosting
3. **Lazy loading**: Implementado en Angular
4. **CDN**: Automático con Firebase Hosting

## 🚨 Troubleshooting

### Error: "Deployment failed"

```bash
# Verificar permisos
firebase projects:list

# Re-login
firebase logout
firebase login

# Verificar build
npm run build
cd functions && npm run build
```

### Error: "Function deployment timeout"

```bash
# Aumentar timeout
firebase deploy --only functions --force
```

### Error: "Site not found"

```bash
# Verificar proyecto
firebase use --add

# Listar sitios
firebase hosting:sites:list
```

## 📚 Referencias

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Angular Deployment Guide](https://angular.io/guide/deployment)

## 🔗 URLs Útiles

- **Hosting**: https://opmanager-dashboard.web.app
- **Console**: https://console.firebase.google.com/project/opmanager-dashboard-app
- **Functions**: https://us-central1-opmanager-dashboard-app.cloudfunctions.net/apiProxy
