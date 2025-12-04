# 🎯 GUÍA FINAL - 3 PASOS SIMPLES

## ✅ LO QUE YA ESTÁ HECHO

- ✅ Workflows de GitHub Actions corregidos
- ✅ Ionic y Angular CLI se instalan automáticamente
- ✅ Build configurado correctamente (`ionic build --prod`)
- ✅ Deployment apunta a la carpeta `www` correcta
- ✅ Workflow innecesario eliminado

---

## 🔑 LO QUE FALTA (SOLO 3 PASOS)

### PASO 1: Copia el token de Azure

1. Ve a Azure Portal: https://portal.azure.com
2. Busca "Static Web Apps" en la barra de búsqueda
3. Haz clic en tu app `dashboard-msp`
4. En el panel derecho, haz clic en **"Administrar token de implementación"**
5. Copia el token completo (es un texto largo)

**El token se ve así:**
```
d6c6b86093836ec1a6251d631de83c98947a8efecdfb298b2365cd801a680903-a4eb23...
```

---

### PASO 2: Agrega el token en GitHub

1. Ve a tu repositorio: https://github.com/qaandres206-source/opmanager-ionic-dashboard
2. Haz clic en **Settings** (arriba a la derecha)
3. En el menú izquierdo: **Secrets and variables** → **Actions**
4. Haz clic en **"New repository secret"**
5. Llena el formulario:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN_GREEN_WAVE_016489610`
   - **Secret**: Pega el token que copiaste en el Paso 1
6. Haz clic en **"Add secret"**

---

### PASO 3: Haz push y espera

```bash
git push origin main
```

Luego:
1. Ve a: https://github.com/qaandres206-source/opmanager-ionic-dashboard/actions
2. Verás el workflow ejecutándose
3. Espera 2-5 minutos
4. ¡Listo! Tu app estará desplegada

---

## 🎉 VERIFICAR QUE FUNCIONÓ

En GitHub Actions deberías ver:

```
✅ Setup Node.js
✅ Install dependencies
✅ Install Ionic and Angular CLI
✅ Build with Ionic
✅ Build And Deploy
```

Si ves todos los ✅ verdes, ¡funcionó!

---

## 🌐 VER TU APLICACIÓN

Después del deployment exitoso:

1. Ve a Azure Portal → Static Web Apps → dashboard-msp
2. Verás la **URL** de tu aplicación
3. Haz clic en ella para ver tu app en vivo

---

## ⚠️ SI ALGO FALLA

### Error: "deployment_token was not provided"
- **Causa**: No agregaste el token en GitHub (Paso 2)
- **Solución**: Completa el Paso 2

### Error: "Invalid token"
- **Causa**: El token es incorrecto
- **Solución**: Verifica que copiaste el token completo sin espacios

### Error: "Failed to find index.html"
- **Causa**: El build falló
- **Solución**: Revisa los logs del paso "Build with Ionic"

---

## 📊 RESUMEN VISUAL

```
┌─────────────────────────────────────┐
│  PASO 1: Azure Portal               │
│  Copiar token de deployment         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PASO 2: GitHub Settings            │
│  Secrets → New secret               │
│  Name: AZURE_STATIC_WEB_APPS_...    │
│  Secret: [pega el token]            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PASO 3: Terminal                   │
│  git push origin main               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  GitHub Actions                     │
│  Workflow ejecutándose...           │
│  ✅ Build                           │
│  ✅ Deploy                          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  🎉 ¡APP DESPLEGADA!                │
│  Visita la URL en Azure Portal      │
└─────────────────────────────────────┘
```

---

## 🚀 COMANDO RÁPIDO PARA EL PASO 3

```bash
# Hacer push de todos los cambios
git push origin main

# Ver el estado del workflow
# Ve a: https://github.com/qaandres206-source/opmanager-ionic-dashboard/actions
```

---

## 📝 CHECKLIST

- [ ] Copié el token de Azure Portal
- [ ] Agregué el token en GitHub Secrets
- [ ] El nombre del secret es exactamente: `AZURE_STATIC_WEB_APPS_API_TOKEN_GREEN_WAVE_016489610`
- [ ] Hice `git push origin main`
- [ ] Vi el workflow ejecutándose en GitHub Actions
- [ ] El workflow terminó con ✅
- [ ] Mi app está disponible en la URL de Azure

---

**Tiempo total**: 5-10 minutos
**Dificultad**: ⭐ Muy fácil
**Última actualización**: 2025-12-04
