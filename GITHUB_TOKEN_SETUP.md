# 🔑 CONFIGURACIÓN FINAL - Tokens de Azure en GitHub

## 🎯 SITUACIÓN ACTUAL

Tienes **1 Static Web App** en Azure llamada `dashboard-msp`, pero tienes **2 workflows** en GitHub que intentan desplegar a diferentes apps.

---

## ✅ SOLUCIÓN: Configura solo UNO de los workflows

### Opción 1: Usar solo el workflow "green-wave" (RECOMENDADO)

1. **Obtén el token de tu Static Web App en Azure**:
   - Ve a Azure Portal → Static Web Apps → `dashboard-msp`
   - Haz clic en "Administrar token de implementación" (Manage deployment token)
   - Copia el token completo

2. **Agrega el token en GitHub**:
   - Ve a: https://github.com/qaandres206-source/opmanager-ionic-dashboard/settings/secrets/actions
   - Haz clic en "New repository secret"
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN_GREEN_WAVE_016489610`
   - **Secret**: Pega el token que copiaste
   - Haz clic en "Add secret"

3. **Desactiva el otro workflow**:
   - Renombra el archivo para que no se ejecute:
   ```bash
   mv .github/workflows/azure-static-web-apps-victorious-pebble-027a39d10.yml \
      .github/workflows/azure-static-web-apps-victorious-pebble-027a39d10.yml.disabled
   ```

### Opción 2: Eliminar el workflow "victorious-pebble"

Si no necesitas el segundo workflow, simplemente elimínalo:

```bash
rm .github/workflows/azure-static-web-apps-victorious-pebble-027a39d10.yml
```

---

## 🔍 ¿Cómo saber cuál workflow usar?

Verifica en Azure Portal cuál es el nombre de tu Static Web App:

1. Ve a Azure Portal
2. Busca "Static Web Apps"
3. Verás tu app (probablemente `dashboard-msp`)
4. El token de esa app es el que debes usar

**Si solo tienes UNA Static Web App**, solo necesitas UN workflow.

---

## 📝 PASOS FINALES

### 1. Decide qué workflow usar

Mira en Azure Portal:
- Si tu Static Web App se llama algo con "green-wave" → Usa el workflow `azure-static-web-apps-green-wave-016489610.yml`
- Si se llama algo con "victorious-pebble" → Usa el workflow `azure-static-web-apps-victorious-pebble-027a39d10.yml`
- Si se llama `dashboard-msp` → Usa cualquiera de los dos (recomiendo green-wave)

### 2. Obtén el token

```
Azure Portal → Static Web Apps → [tu-app] → Administrar token de implementación
```

Copia el token completo (es largo, como 100+ caracteres).

### 3. Agrega el token en GitHub

Ve a: https://github.com/qaandres206-source/opmanager-ionic-dashboard/settings/secrets/actions

Agrega el secret con el nombre que corresponda:
- Para green-wave: `AZURE_STATIC_WEB_APPS_API_TOKEN_GREEN_WAVE_016489610`
- Para victorious-pebble: `AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_PEBBLE_027A39D10`

### 4. Elimina o desactiva el otro workflow

Si solo tienes una Static Web App, elimina el workflow que no uses.

---

## 🚀 DESPUÉS DE CONFIGURAR EL TOKEN

1. Haz push de los cambios:
   ```bash
   git push origin main
   ```

2. Ve a GitHub Actions:
   ```
   https://github.com/qaandres206-source/opmanager-ionic-dashboard/actions
   ```

3. Verás el workflow ejecutándose

4. Espera a que termine (2-5 minutos)

5. Si todo está bien, verás:
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Install Ionic and Angular CLI
   - ✅ Build with Ionic
   - ✅ Build And Deploy

---

## ⚠️ ERRORES COMUNES

### Error: "deployment_token was not provided"
**Causa**: No agregaste el token en GitHub Secrets
**Solución**: Sigue el paso 3 arriba

### Error: "Failed to find a default file"
**Causa**: La configuración de `app_location` estaba mal
**Solución**: ✅ Ya lo arreglé en el último commit

### Error: "Invalid token"
**Causa**: El token es incorrecto o expiró
**Solución**: Regenera el token en Azure Portal y actualiza el secret en GitHub

---

## 🎯 RESUMEN ULTRA CORTO

1. ✅ **Ya arreglé** la configuración de los workflows (app_location apunta a www)
2. 👉 **TÚ necesitas**: Agregar el token en GitHub Secrets
3. 🗑️ **Opcional**: Eliminar el workflow que no uses
4. 🚀 **Después**: Hacer push y ver el deployment en Actions

---

## 📞 ¿Cuál workflow debo usar?

**Respuesta simple**: Usa `azure-static-web-apps-green-wave-016489610.yml` y elimina el otro.

**¿Por qué?**: Porque probablemente solo tienes una Static Web App en Azure, no necesitas dos workflows.

---

## 🔧 COMANDOS RÁPIDOS

```bash
# 1. Eliminar el workflow que no uses (opcional pero recomendado)
rm .github/workflows/azure-static-web-apps-victorious-pebble-027a39d10.yml

# 2. Hacer commit
git add .
git commit -m "chore: remove unused workflow"

# 3. Hacer push (DESPUÉS de agregar el token en GitHub)
git push origin main
```

---

**Última actualización**: 2025-12-04
**Estado**: ✅ Workflows corregidos, falta agregar token en GitHub
