# Deployment Guide - Render

Esta guía cubre el deployment del OpManager MSP Dashboard en Render.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Configuración Inicial](#configuración-inicial)
- [Deployment a Render](#deployment-a-render)
- [Variables de Entorno](#variables-de-entorno)
- [Monitoreo](#monitoreo)
- [Troubleshooting](#troubleshooting)
- [Comparación con Firebase](#comparación-con-firebase)

## 🔧 Requisitos Previos

- Node.js v20.18.1+
- Cuenta en [Render](https://render.com)
- Repositorio Git (GitHub, GitLab, o Bitbucket)
- Código pusheado al repositorio

### Crear Cuenta en Render

1. Ve a [render.com](https://render.com)
2. Crea una cuenta (puedes usar GitHub/GitLab)
3. Verifica tu email

## ⚙️ Configuración Inicial

### 1. Preparar el Proyecto

El proyecto ya está configurado con:
- ✅ `render.yaml` - Configuración de Render
- ✅ `server/index.js` - Servidor Express
- ✅ `.nvmrc` - Versión de Node.js
- ✅ Scripts npm actualizados

### 2. Verificar Configuración Local

```bash
# Verificar versión de Node.js
node --version  # Debe ser v20.18.1

# Instalar dependencias
npm install

# Build de producción
npm run build:prod

# Probar servidor localmente
npm run server
# Visitar http://localhost:3000
```

## 🚀 Deployment a Render

### Opción 1: Usando render.yaml (Recomendado)

1. **Push del código a Git**:
   ```bash
   git add .
   git commit -m "Configure Render deployment"
   git push origin main
   ```

2. **Crear Web Service en Render**:
   - Ve a [Render Dashboard](https://dashboard.render.com)
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio Git
   - Render detectará automáticamente `render.yaml`
   - Click en "Apply"

3. **Render configurará automáticamente**:
   - Build Command: `npm install && npm run build:prod`
   - Start Command: `npm run server`
   - Environment: Node
   - Node Version: 20.18.1

### Opción 2: Configuración Manual

1. **Crear Web Service**:
   - Dashboard → "New +" → "Web Service"
   - Conecta repositorio

2. **Configurar manualmente**:
   - **Name**: `opmanager-dashboard`
   - **Environment**: `Node`
   - **Region**: `Oregon (US West)` o el más cercano
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build:prod`
   - **Start Command**: `npm run server`

3. **Agregar Variables de Entorno** (ver sección siguiente)

4. **Click en "Create Web Service"**

## 🔐 Variables de Entorno

**⚠️ IMPORTANTE**: Sí, **DEBES configurar variables de entorno** en Render para que tu aplicación funcione correctamente.

### ¿Por qué son necesarias?

Tu aplicación usa un servidor Express (en `server/index.js`) que actúa como proxy para las peticiones API. Este servidor necesita saber:
- A qué URL del backend de OpManager debe redirigir las peticiones
- En qué entorno está corriendo (producción vs desarrollo)
- Qué versión de Node.js usar

### Variables Requeridas

Estas variables **DEBEN** ser configuradas en Render:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_VERSION` | `20.18.1` | Versión de Node.js (debe coincidir con `.nvmrc`) |
| `API_BASE_URL` | `https://itview.intwo.cloud/api` | URL del backend de OpManager |
| `NODE_ENV` | `production` | Entorno de ejecución |

### Variables Opcionales

Estas variables son opcionales (Render las maneja automáticamente):

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `PORT` | `10000` (asignado por Render) | Puerto donde corre el servidor |

### 📝 Cómo Configurar en Render

#### Paso 1: Acceder a Environment Variables

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu Web Service (`opmanager-ionic-dashboard`)
3. En el menú lateral izquierdo, click en **"Environment"**

#### Paso 2: Agregar Variables

Para cada variable requerida:

1. Click en **"Add Environment Variable"**
2. En **Key**: ingresa el nombre de la variable (ej: `NODE_VERSION`)
3. En **Value**: ingresa el valor (ej: `20.18.1`)
4. Click en **"Add"** o presiona Enter

#### Paso 3: Guardar Cambios

1. Una vez agregadas todas las variables, click en **"Save Changes"**
2. Render automáticamente **redeployará** tu aplicación con las nuevas variables

#### Referencia Visual

Así se ve la configuración de variables de entorno en Render:

![Configuración de Variables de Entorno en Render](/Users/andresm/.gemini/antigravity/brain/529da86a-0584-43e6-b667-3b5c8be789f8/render_environment_variables_1764600153082.png)


### ✅ Variables Configuradas Correctamente

Deberías tener estas 3 variables:

```bash
NODE_VERSION=20.18.1
API_BASE_URL=https://itview.intwo.cloud/api
NODE_ENV=production
```

### 🔍 Verificar Configuración

Después de configurar las variables:

1. Ve a **Logs** en tu servicio
2. Deberías ver algo como:
   ```
   🚀 Server running on port 10000
   📡 API proxy: /api/* -> https://itview.intwo.cloud/api/*
   📁 Serving static files from: /opt/render/project/src/www
   ```

### ⚠️ Errores Comunes

**Error**: `API_BASE_URL is undefined`
- **Causa**: No configuraste la variable `API_BASE_URL`
- **Solución**: Agrega la variable en Environment

**Error**: `Cannot find module`
- **Causa**: `NODE_VERSION` incorrecta o no configurada
- **Solución**: Verifica que `NODE_VERSION=20.18.1`

**Error**: `502 Bad Gateway`
- **Causa**: El servidor no puede conectarse al backend
- **Solución**: Verifica que `API_BASE_URL` sea correcta

## 📊 Monitoreo

### Logs en Tiempo Real

1. Ve a tu Web Service en Render
2. Click en "Logs" en el menú lateral
3. Verás logs en tiempo real del servidor

### Métricas

Render proporciona:
- **CPU Usage**: Uso de CPU
- **Memory Usage**: Uso de memoria
- **Request Count**: Número de requests
- **Response Time**: Tiempo de respuesta

Accede a métricas en: Dashboard → Tu servicio → Metrics

### Health Checks

Render automáticamente hace health checks a tu aplicación:
- Verifica que el servidor responda en el puerto asignado
- Si falla, reinicia automáticamente el servicio

## 🚨 Troubleshooting

### Error: "Build failed"

**Causa**: Problemas durante `npm install` o `npm run build:prod`

**Solución**:
```bash
# Verificar localmente
npm install
npm run build:prod

# Revisar logs en Render
# Dashboard → Tu servicio → Logs
```

### Error: "Application failed to start"

**Causa**: El servidor no inicia correctamente

**Solución**:
1. Verificar que `server/index.js` existe
2. Verificar Start Command: `npm run server`
3. Revisar logs para errores específicos

### Error: "API requests failing"

**Causa**: Variable `API_BASE_URL` incorrecta o proxy no funciona

**Solución**:
1. Verificar variable de entorno `API_BASE_URL`
2. Verificar que requests van a `/api/*`
3. Revisar logs del servidor para errores de proxy

### Error: "404 on refresh"

**Causa**: SPA routing no configurado correctamente

**Solución**:
El servidor ya está configurado para manejar esto:
```javascript
// En server/index.js
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../www/index.html'));
});
```

### Deployment Lento

**Causa**: Build de Angular puede tomar tiempo

**Solución**:
- Es normal que tome 2-5 minutos
- Render cachea `node_modules` para builds subsecuentes
- Considera usar plan pagado para builds más rápidos

## 🔄 Redeploy

### Automatic Deploys

Por defecto, Render redeploya automáticamente cuando:
- Haces push a la rama configurada (ej: `main`)
- Cambias variables de entorno

### Manual Deploy

1. Dashboard → Tu servicio
2. Click en "Manual Deploy" → "Deploy latest commit"

### Rollback

1. Dashboard → Tu servicio → "Events"
2. Encuentra el deploy anterior exitoso
3. Click en "Rollback to this deploy"

## 💰 Costos

### Free Tier

Render ofrece un free tier con:
- ✅ 750 horas/mes (suficiente para 1 servicio 24/7)
- ✅ Automatic deploys
- ✅ SSL gratis
- ⚠️ El servicio se "duerme" después de 15 min de inactividad
- ⚠️ Tarda ~30 segundos en "despertar"

### Starter Plan ($7/mes)

- ✅ Sin "sleep" - siempre activo
- ✅ Más recursos (512 MB RAM)
- ✅ Builds más rápidos

## 🌍 Dominio Personalizado

### Agregar Dominio

1. Dashboard → Tu servicio → "Settings"
2. Scroll a "Custom Domain"
3. Click en "Add Custom Domain"
4. Ingresa tu dominio (ej: `dashboard.tudominio.com`)

### Configurar DNS

En tu proveedor de DNS:

```
Type: CNAME
Name: dashboard (o el subdominio que quieras)
Value: [tu-servicio].onrender.com
```

Render automáticamente provee SSL con Let's Encrypt.

