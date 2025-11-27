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

### Variables Requeridas

En Render Dashboard → Tu servicio → Environment:

```bash
NODE_VERSION=20.18.1
API_BASE_URL=https://itview.intwo.cloud/api
NODE_ENV=production
```

### Variables Opcionales

```bash
PORT=3000  # Render asigna automáticamente
```

### Configurar en Render

1. Ve a tu Web Service
2. Click en "Environment" en el menú lateral
3. Click en "Add Environment Variable"
4. Agrega cada variable
5. Click en "Save Changes"

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

## 📚 Comparación con Firebase

| Feature | Firebase Hosting | Render |
|---------|-----------------|--------|
| **Costo Free Tier** | 10 GB storage, 360 MB/día | 750 horas/mes |
| **SSL** | ✅ Gratis | ✅ Gratis |
| **Auto Deploy** | ✅ Con CLI | ✅ Con Git |
| **Servidor Custom** | ❌ Solo Cloud Functions | ✅ Full Node.js |
| **Variables de Entorno** | Via Functions Config | ✅ UI amigable |
| **Cold Start** | ~1s (Functions) | ~30s (Free tier) |
| **Logs** | Via CLI | ✅ UI en tiempo real |
| **Rollback** | ✅ Via CLI | ✅ Via UI |

## 🔗 URLs Útiles

- **Dashboard**: https://dashboard.render.com
- **Documentación**: https://render.com/docs
- **Status**: https://status.render.com
- **Comunidad**: https://community.render.com

## 📝 Comandos Útiles

```bash
# Build local
npm run build:prod

# Servidor local
npm run server

# Servidor con auto-reload (desarrollo)
npm run server:dev

# Ver logs (requiere Render CLI)
render logs -s opmanager-dashboard

# SSH al servicio (requiere Render CLI y plan pagado)
render ssh opmanager-dashboard
```

## ✅ Checklist de Deployment

Antes de cada deployment:

- [ ] Tests pasando localmente
- [ ] Build exitoso: `npm run build:prod`
- [ ] Servidor funciona localmente: `npm run server`
- [ ] Variables de entorno configuradas en Render
- [ ] Código pusheado a Git
- [ ] Deployment iniciado en Render
- [ ] Verificar logs durante deployment
- [ ] Probar aplicación en URL de Render
- [ ] Verificar que API proxy funciona
- [ ] Probar en múltiples navegadores

## 🎯 Próximos Pasos

1. ✅ Deployment inicial completado
2. Configurar dominio personalizado (opcional)
3. Configurar alertas de uptime (ej: UptimeRobot)
4. Implementar CI/CD con tests automáticos
5. Considerar upgrade a plan pagado si necesitas 24/7 uptime
