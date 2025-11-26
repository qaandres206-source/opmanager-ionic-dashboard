# OpManager MSP Dashboard

[![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange)](https://firebase.google.com/)
[![Ionic](https://img.shields.io/badge/Ionic-8.0-blue)](https://ionicframework.com/)
[![Angular](https://img.shields.io/badge/Angular-20.0-red)](https://angular.io/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-green)](https://playwright.dev/)

Dashboard web moderno para monitoreo y gestión de dispositivos OpManager MSP, construido con Ionic/Angular y desplegado en Firebase Hosting.

## 🚀 Características

- **Dashboard en Tiempo Real**: Visualización de dispositivos, alertas y estado de salud
- **Gestión de Dispositivos**: Lista paginada con filtros por categoría y estado
- **Monitoreo de Alertas**: Virtual scroll para manejar miles de alertas eficientemente
- **Resumen de Salud**: Vista consolidada del estado de la infraestructura
- **Responsive Design**: Optimizado para desktop y móvil
- **API Proxy**: Cloud Functions para evitar CORS y cachear respuestas
- **Testing E2E**: Suite completa de tests con Playwright

## 📋 Requisitos Previos

- Node.js v22+ (recomendado usar [nvm](https://github.com/nvm-sh/nvm))
- npm o yarn
- API Key válida de OpManager MSP
- Firebase CLI (para deployment)

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd opmanager-ionic-dashboard

# Instalar dependencias
npm install

# Instalar Playwright browsers (para testing)
npx playwright install
```

## 🏃 Desarrollo Local

### Iniciar servidor de desarrollo

```bash
# Con proxy para evitar CORS
npm run start:proxy

# Sin proxy (requiere configuración de CORS en backend)
npm start
```

La aplicación estará disponible en `http://localhost:8100`

### Configurar API Key

1. Navega a la pestaña **Configuración** (Settings)
2. Ingresa tu API Key de OpManager MSP
3. Haz clic en **GUARDAR API KEY**
4. Prueba la conexión con **PROBAR CONEXIÓN**

La API Key se guarda en `localStorage` del navegador.

## 🧪 Testing

### Tests E2E con Playwright

```bash
# Ejecutar todos los tests
npm run test:e2e

# Ejecutar con UI interactiva
npm run test:e2e:ui

# Ejecutar en modo headed (ver el browser)
npm run test:e2e:headed

# Modo debug
npm run test:e2e:debug

# Ver reporte de tests
npm run test:e2e:report
```

### Tests Unitarios

```bash
npm test
```

Para más detalles sobre testing, consulta [TESTING.md](./TESTING.md)

## 🚢 Deployment

### Firebase Hosting

```bash
# Build de producción
npm run build

# Deploy completo (hosting + functions)
firebase deploy

# Solo hosting
firebase deploy --only hosting

# Solo functions
firebase deploy --only functions
```

Para guía detallada de deployment, consulta [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📁 Estructura del Proyecto

```
opmanager-ionic-dashboard/
├── e2e/                          # Tests E2E con Playwright
│   ├── fixtures/                 # Test data y fixtures
│   ├── pages/                    # Page Object Models
│   └── tests/                    # Test specs
├── functions/                    # Firebase Cloud Functions
│   └── src/
│       └── index.ts              # API Proxy con caché
├── src/
│   ├── app/
│   │   ├── services/             # Servicios Angular
│   │   │   ├── opmanager-api.service.ts
│   │   │   └── dashboard-state.service.ts
│   │   ├── tab1/                 # Dispositivos
│   │   ├── tab2/                 # Alertas
│   │   ├── tab3/                 # Resumen de Salud
│   │   └── settings/             # Configuración
│   └── environments/             # Configuración de entornos
├── firebase.json                 # Configuración Firebase
├── playwright.config.ts          # Configuración Playwright
└── proxy.conf.json              # Proxy de desarrollo
```

## 🔧 Configuración

### Variables de Entorno

Para testing, puedes configurar:

```bash
export TEST_API_KEY="your-api-key-here"
```

### Proxy de Desarrollo

El archivo `proxy.conf.json` redirige las llamadas `/api` a `https://itview.intwo.cloud/api`:

```json
{
  "/api": {
    "target": "https://itview.intwo.cloud/api",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": { "^/api": "" }
  }
}
```

## 📚 Documentación Adicional

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Guía detallada de configuración
- [TESTING.md](./TESTING.md) - Guía de testing
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de deployment
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guía de contribución

## 🏗️ Arquitectura

### Frontend (Ionic/Angular)
- **Ionic 8**: Framework UI con componentes móviles
- **Angular 20**: Framework de aplicación
- **RxJS**: Programación reactiva
- **CDK Virtual Scroll**: Renderizado eficiente de listas grandes

### Backend (Firebase)
- **Cloud Functions**: API Proxy con caché en memoria
- **Hosting**: Servicio de archivos estáticos
- **Node.js 20**: Runtime para functions

### API Integration
- Integración con OpManager MSP REST API
- Autenticación vía API Key en headers
- Soporte para múltiples clientes y regiones

## 🔍 Troubleshooting

### Error CORS
- Asegúrate de usar `npm run start:proxy`
- Verifica que el proxy esté configurado correctamente

### Datos no cargan
- Verifica que la API Key sea válida
- Revisa la consola del navegador (F12)
- Verifica el Network tab para errores HTTP

### Tests fallan
- Asegúrate de que el servidor de desarrollo esté corriendo
- Verifica que Playwright browsers estén instalados: `npx playwright install`
- Configura `TEST_API_KEY` si necesitas tests con datos reales

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor lee [CONTRIBUTING.md](./CONTRIBUTING.md) para detalles sobre el proceso.

## 📄 Licencia

Este proyecto es privado y propietario.

## 👥 Autores

- Equipo de Desarrollo OpManager MSP

## 🙏 Agradecimientos

- [Ionic Framework](https://ionicframework.com/)
- [Angular](https://angular.io/)
- [Firebase](https://firebase.google.com/)
- [Playwright](https://playwright.dev/)
