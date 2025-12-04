# 🔑 Configurar Token de Azure Static Web Apps en Azure DevOps

## ⚠️ IMPORTANTE: ¿Dónde está tu Pipeline?

Antes de continuar, necesitas identificar dónde está configurado tu pipeline:

### Opción 1: GitHub Actions (Recomendado para proyectos en GitHub)
Si tu proyecto está en GitHub, es **MÁS FÁCIL** usar GitHub Actions en lugar de Azure DevOps.

### Opción 2: Azure DevOps Pipelines
Si quieres usar Azure DevOps, necesitas tener un proyecto en Azure DevOps.

---

## 📍 PASO 1: Identifica dónde quieres ejecutar el pipeline

### ¿Estás usando GitHub Actions o Azure DevOps?

**Verifica si tienes GitHub Actions:**
```bash
ls -la .github/workflows/
```

Si ves archivos `.yml` ahí, ya tienes GitHub Actions configurado.

**Verifica si tienes Azure DevOps:**
- ¿Tienes un proyecto en https://dev.azure.com/?
- ¿Has configurado un pipeline allí?

---

## 🎯 SOLUCIÓN RECOMENDADA: Usar GitHub Actions

Como tu código está en GitHub, es **mucho más fácil** usar GitHub Actions. Aquí está cómo:

### Paso 1: Ve a tu repositorio en GitHub
```
https://github.com/qaandres206-source/opmanager-ionic-dashboard
```

### Paso 2: Ve a Settings → Secrets and variables → Actions

1. Haz clic en **Settings** (arriba a la derecha)
2. En el menú lateral izquierdo, busca **Secrets and variables**
3. Haz clic en **Actions**
4. Haz clic en **New repository secret**

### Paso 3: Agrega el token

- **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- **Secret**: Pega el token que copiaste de Azure Portal
  ```
  d6c6b86093836ec1a6251d631de83c98947a8efecdfb298b2365cd801a680903-a4eb23...
  ```
- Haz clic en **Add secret**

### Paso 4: Crea el archivo de GitHub Actions

Crea el archivo `.github/workflows/azure-static-web-apps.yml` con el siguiente contenido:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Ionic and Angular CLI
        run: npm install -g @ionic/cli @angular/cli

      - name: Build with Ionic
        run: ionic build --prod

      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: "api"
          output_location: "www"
          skip_app_build: true

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

---

## 🔧 ALTERNATIVA: Si prefieres usar Azure DevOps

Si realmente quieres usar Azure DevOps en lugar de GitHub Actions:

### Paso 1: Ve a Azure DevOps
```
https://dev.azure.com/
```

### Paso 2: Crea o selecciona tu proyecto

Si no tienes un proyecto, créalo:
1. Haz clic en **+ New project**
2. Dale un nombre (ej: "opmanager-dashboard")
3. Haz clic en **Create**

### Paso 3: Importa tu repositorio de GitHub

1. Ve a **Repos** → **Files**
2. Haz clic en **Import repository**
3. Selecciona **Git**
4. URL: `https://github.com/qaandres206-source/opmanager-ionic-dashboard.git`
5. Haz clic en **Import**

### Paso 4: Configura el Pipeline

1. Ve a **Pipelines** → **Pipelines**
2. Haz clic en **New pipeline**
3. Selecciona **Azure Repos Git** (si importaste) o **GitHub** (si quieres conectar directamente)
4. Selecciona tu repositorio
5. Selecciona **Existing Azure Pipelines YAML file**
6. Selecciona `/azure-pipelines.yml`
7. Haz clic en **Continue**

### Paso 5: Agrega el token como variable secreta

1. Antes de ejecutar el pipeline, haz clic en **Variables** (arriba a la derecha)
2. Haz clic en **+ New variable**
3. Configura:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - **Value**: Pega el token que copiaste
   - ✅ Marca **Keep this value secret**
4. Haz clic en **OK**
5. Haz clic en **Save**

### Paso 6: Ejecuta el pipeline

1. Haz clic en **Run**
2. Monitorea la ejecución

---

## ✅ Verificación

Después de configurar el token y ejecutar el pipeline:

1. **GitHub Actions**: Ve a la pestaña **Actions** en tu repositorio
2. **Azure DevOps**: Ve a **Pipelines** → **Pipelines** y selecciona tu pipeline

Deberías ver:
- ✅ Build exitoso
- ✅ Deploy exitoso
- ✅ URL de tu aplicación en los logs

---

## 🆘 ¿Cuál debo usar?

| Característica | GitHub Actions | Azure DevOps |
|----------------|----------------|--------------|
| **Facilidad** | ⭐⭐⭐⭐⭐ Muy fácil | ⭐⭐⭐ Moderado |
| **Configuración** | Mínima | Requiere proyecto en Azure DevOps |
| **Integración con GitHub** | Nativa | Requiere importar repo |
| **Costo** | Gratis para repos públicos | Gratis hasta 1800 min/mes |
| **Recomendado para ti** | ✅ **SÍ** | Solo si ya usas Azure DevOps |

---

## 🎯 MI RECOMENDACIÓN

**Usa GitHub Actions** porque:
1. Tu código ya está en GitHub
2. Es más fácil de configurar
3. No necesitas crear un proyecto en Azure DevOps
4. La integración es nativa
5. Los secrets se manejan directamente en GitHub

---

## 📞 ¿Necesitas ayuda?

Si prefieres que te ayude a configurar GitHub Actions en lugar de Azure DevOps, solo dime y creo los archivos necesarios automáticamente.
