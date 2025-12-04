# 🔑 Configurar Token en GitHub - Guía Simple

## ✅ ¡BUENAS NOTICIAS!

Ya tienes GitHub Actions configurado y funcionando. Solo necesitas agregar el token que copiaste de Azure.

---

## 📍 PASOS SIMPLES (5 minutos)

### Paso 1: Ve a tu repositorio en GitHub
Abre tu navegador y ve a:
```
https://github.com/qaandres206-source/opmanager-ionic-dashboard
```

### Paso 2: Haz clic en "Settings"
- Busca la pestaña **Settings** en la parte superior (al lado de "Insights")
- Haz clic en ella

### Paso 3: Ve a "Secrets and variables"
- En el menú lateral izquierdo, busca **Secrets and variables**
- Haz clic en **Actions**

### Paso 4: Agrega un nuevo secret
- Haz clic en el botón verde **"New repository secret"**

### Paso 5: Llena el formulario

**Name (Nombre del secret):**
```
AZURE_STATIC_WEB_APPS_API_TOKEN_GREEN_WAVE_016489610
```

**Secret (El token que copiaste de Azure):**
```
d6c6b86093836ec1a6251d631de83c98947a8efecdfb298b2365cd801a680903-a4eb23...
```
(Pega el token completo que copiaste de Azure Portal)

### Paso 6: Guarda
- Haz clic en **"Add secret"**

### Paso 7: Repite para el segundo token
Repite los pasos 4-6 con este nombre:

**Name:**
```
AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_PEBBLE_027A39D10
```

**Secret:**
```
(El mismo token de Azure o el token del segundo Static Web App si tienes dos)
```

---

## 🎯 ¿Dónde está cada cosa?

### Token de Azure (Ya lo tienes ✅)
- Lo encontraste en: **Azure Portal** → **Static Web Apps** → **dashboard-msp** → **Administrar token de implementación**
- Se ve así: `d6c6b86093836ec1a6251d631de83c98947a8efecdfb298b2365cd801a680903-a4eb23...`

### Dónde poner el token (Aquí es donde debes ir ahora 👇)
- **GitHub** → **Tu repositorio** → **Settings** → **Secrets and variables** → **Actions**
- Ahí agregas el secret con el nombre y valor indicados arriba

---

## 🚀 Después de agregar el token

1. **El workflow se ejecutará automáticamente** cuando hagas push a `main`
2. **Verifica el deployment**:
   - Ve a la pestaña **Actions** en tu repositorio de GitHub
   - Verás el workflow ejecutándose
   - Espera a que termine (toma 2-5 minutos)

3. **Verifica que funcionó**:
   - Si ves un ✅ verde, ¡funcionó!
   - Si ves un ❌ rojo, haz clic en el workflow para ver los logs

---

## 🆘 Si tienes problemas

### Error: "Secret not found"
**Solución**: Verifica que el nombre del secret sea exactamente:
```
AZURE_STATIC_WEB_APPS_API_TOKEN_GREEN_WAVE_016489610
```
(Debe ser EXACTAMENTE igual, con mayúsculas y guiones bajos)

### Error: "Invalid token"
**Solución**: 
1. Ve a Azure Portal
2. Regenera el token en **Administrar token de implementación**
3. Copia el nuevo token
4. Actualiza el secret en GitHub

### No veo la pestaña "Settings"
**Solución**: Necesitas tener permisos de administrador en el repositorio. Si no los tienes, pídele al dueño del repositorio que agregue el secret.

---

## 📊 Verificar que todo funciona

Después de agregar el token:

1. Ve a **Actions** en GitHub
2. Deberías ver un workflow ejecutándose
3. Espera a que termine
4. Si todo está bien, verás:
   - ✅ Build and Deploy Job: Success
   - Tu aplicación estará disponible en la URL de Azure Static Web Apps

---

## 🎉 ¡Listo!

Una vez que agregues el token, el deployment será automático cada vez que hagas push a `main`.

**URL de tu aplicación** (después del deployment):
- La encontrarás en Azure Portal → Static Web Apps → dashboard-msp → URL

---

## 📝 Resumen Visual

```
Azure Portal (Ya hiciste esto ✅)
    ↓
Copiar token de implementación
    ↓
GitHub → Settings → Secrets → Actions (Haz esto ahora 👇)
    ↓
New repository secret
    ↓
Name: AZURE_STATIC_WEB_APPS_API_TOKEN_GREEN_WAVE_016489610
Secret: [pega el token aquí]
    ↓
Add secret
    ↓
¡Listo! 🎉
```

---

**Última actualización**: 2025-12-04
**Tiempo estimado**: 5 minutos
**Dificultad**: ⭐ Fácil
