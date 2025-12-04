# Azure Static Web Apps - Guía de Deployment

## 📋 Resumen de Cambios Realizados

### 1. **Azure Pipeline (`azure-pipelines.yml`)**
Se han realizado las siguientes mejoras:

- ✅ **Instalación de Ionic CLI**: `npm install -g @ionic/cli`
- ✅ **Instalación de Angular CLI**: `npm install -g @angular/cli`
- ✅ **Comando de build correcto**: `ionic build --prod` (en lugar de `npm run build:prod`)
- ✅ **Node.js 22.x**: Configurado para usar la versión correcta
- ✅ **Cache de npm**: Optimización para builds más rápidos
- ✅ **Artifacts correctos**: Publica la carpeta `www` generada por Ionic

### 2. **Configuración de Azure Static Web Apps (`staticwebapp.config.json`)**
- ✅ **Node.js runtime actualizado**: De `node:18` a `node:22`
- ✅ **Routing configurado**: SPA routing con fallback a `/index.html`
- ✅ **API routes**: Configuradas para `/api/*`
- ✅ **Security headers**: Headers de seguridad implementados

## 🔧 Configuración Requerida en Azure DevOps

### Variables de Pipeline
Asegúrate de tener configurada la siguiente variable secreta en Azure DevOps:

1. Ve a tu proyecto en Azure DevOps
2. Navega a **Pipelines** → **Library** → **Variable groups**
3. Crea o edita un grupo de variables con:

| Variable | Valor | Tipo |
|----------|-------|------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Tu token de Azure Static Web Apps | Secret |

### Cómo obtener el token de Azure Static Web Apps:

1. Ve al [Azure Portal](https://portal.azure.com)
2. Navega a tu **Static Web App**
3. En el menú lateral, selecciona **Manage deployment token**
4. Copia el token
5. Pégalo en Azure DevOps como variable secreta

## 📦 Estructura del Build

El pipeline ejecuta los siguientes pasos:

```yaml
1. Install Node.js 22.x
2. Cache npm packages (optimización)
3. npm ci (instalación limpia de dependencias)
4. npm install -g @ionic/cli @angular/cli (CLIs globales)
5. ionic build --prod (build de producción)
6. Publish artifacts (carpeta www/)
7. Deploy to Azure Static Web Apps
```

## 🌐 Variables de Entorno para la Aplicación

Si tu aplicación necesita variables de entorno (como `API_BASE_URL`), configúralas en Azure:

1. Ve a tu **Static Web App** en Azure Portal
2. Selecciona **Configuration** en el menú lateral
3. Agrega las variables necesarias:

```
API_BASE_URL=https://tu-api.com
NODE_ENV=production
```

## 🔍 Verificación del Deployment

### Checklist Post-Deployment:

- [ ] El pipeline se ejecuta sin errores
- [ ] La etapa de Build completa exitosamente
- [ ] Los artifacts se publican correctamente
- [ ] La etapa de Deploy completa exitosamente
- [ ] La aplicación es accesible en la URL de Azure Static Web Apps
- [ ] El routing funciona correctamente (navegación entre páginas)
- [ ] Las llamadas a la API funcionan
- [ ] Los assets (imágenes, CSS, JS) se cargan correctamente

### Comandos de Verificación Local:

Antes de hacer push, verifica que el build funcione localmente:

```bash
# Instalar dependencias
npm ci

# Build de producción
ionic build --prod

# Verificar que la carpeta www/ se generó correctamente
ls -la www/

# Opcional: Servir el build localmente
npx http-server www/ -p 8080
```

## 🐛 Troubleshooting

### Error: "ionic: command not found"
**Solución**: El pipeline ahora instala Ionic CLI automáticamente. Si persiste, verifica que el paso de instalación se ejecute correctamente.

### Error: "ng: command not found"
**Solución**: El pipeline ahora instala Angular CLI automáticamente junto con Ionic CLI.

### Error: "Build failed - Cannot find module"
**Solución**: 
1. Verifica que `package.json` y `package-lock.json` estén sincronizados
2. Asegúrate de que todas las dependencias estén en `dependencies` (no solo en `devDependencies`)
3. Ejecuta `npm ci` localmente para verificar

### Error: "404 on page refresh"
**Solución**: Ya está configurado en `staticwebapp.config.json` con:
```json
"navigationFallback": {
    "rewrite": "/index.html"
}
```

### Error: "API calls failing"
**Solución**: 
1. Verifica que las APIs estén en la carpeta `api/`
2. Asegúrate de que `api_location: 'api'` esté configurado en el pipeline
3. Verifica las variables de entorno en Azure Portal

### Error: "Static files not loading"
**Solución**: Verifica que los paths en `staticwebapp.config.json` excluyan correctamente los assets:
```json
"exclude": [
    "/images/*.{png,jpg,gif,svg}",
    "/css/*",
    "/assets/*",
    "/api/*"
]
```

## 📊 Monitoreo y Logs

### Ver logs del pipeline:
1. Ve a **Pipelines** en Azure DevOps
2. Selecciona tu pipeline
3. Haz clic en la ejecución más reciente
4. Revisa cada paso para ver logs detallados

### Ver logs de la aplicación en Azure:
1. Ve a tu **Static Web App** en Azure Portal
2. Selecciona **Application Insights** (si está habilitado)
3. O usa **Log stream** para ver logs en tiempo real

## 🚀 Próximos Pasos

1. **Haz commit y push** de los cambios:
   ```bash
   git add azure-pipelines.yml staticwebapp.config.json
   git commit -m "feat: configure Azure pipeline for Ionic deployment"
   git push origin main
   ```

2. **Monitorea el pipeline** en Azure DevOps

3. **Verifica el deployment** en la URL de tu Static Web App

4. **Configura un custom domain** (opcional):
   - Ve a **Custom domains** en Azure Portal
   - Agrega tu dominio personalizado
   - Configura los registros DNS

## 📚 Recursos Adicionales

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Ionic Build Documentation](https://ionicframework.com/docs/cli/commands/build)
- [Angular CLI Documentation](https://angular.io/cli)
- [Azure DevOps Pipelines](https://docs.microsoft.com/azure/devops/pipelines/)

## ⚙️ Configuración Avanzada

### Environments (Staging/Production)

Para configurar múltiples environments:

```yaml
# En azure-pipelines.yml
- stage: DeployStaging
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/develop')
  # ... deployment a staging

- stage: DeployProduction
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
  # ... deployment a production
```

### Build Optimization

Para builds más rápidos, considera:

1. **Usar cache de node_modules** (ya configurado)
2. **Parallel jobs** si tienes tests
3. **Incremental builds** de Angular

---

**Última actualización**: 2025-12-04
**Versión de Node.js**: 22.x
**Versión de Ionic**: Latest (instalada globalmente en el pipeline)
**Versión de Angular**: Latest (instalada globalmente en el pipeline)
