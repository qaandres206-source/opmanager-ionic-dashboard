# Documentación Técnica - OpManager Ionic Dashboard

## 1. Visión General del Proyecto
Este proyecto es un dashboard moderno construido con **Ionic** y **Angular** para monitorear y gestionar instancias de **ManageEngine OpManagerMSP**. La aplicación se despliega en **Azure Static Web Apps** y utiliza **Azure Functions** como un proxy seguro para interactuar con la API de OpManagerMSP, resolviendo problemas de CORS y seguridad.

## 2. Arquitectura
La solución sigue una arquitectura moderna de aplicación web estática con backend serverless:

*   **Frontend**: Ionic Framework v8 + Angular v19.
*   **Hosting**: Azure Static Web Apps.
*   **Backend / Proxy**: Azure Functions (Node.js v22) integrado en la Static Web App (`/api`).
*   **API Externa**: ManageEngine OpManagerMSP API.

### Diagrama de Flujo de Datos
Frontend (Ionic) <-> Azure Function Proxy (/api/opmanager-proxy) <-> OpManagerMSP API (itview.intwo.cloud)

## 3. Estructura del Proyecto

```
/
├── .github/workflows/   # Pipelines de CI/CD para Azure Static Web Apps
├── api/                 # Azure Functions (Backend Proxy)
│   ├── opmanager-proxy/ # Función principal del proxy
│   └── package.json     # Dependencias del backend (Node 22)
├── src/
│   ├── app/
│   │   ├── core/        # Modelos, Guards e Interceptores
│   │   ├── services/    # Servicios de lógica de negocio (API, State, Reports)
│   │   ├── tabs/        # Layout principal con navegación por pestañas
│   │   ├── devices/     # Módulo de Dispositivos
│   │   ├── alerts/      # Módulo de Alarmas
│   │   ├── health/      # Módulo de Resumen de Salud
│   │   ├── interfaces/  # Módulo de Interfaces
│   │   ├── reports/     # Módulo de Reportes
│   │   ├── sre-audit/   # Módulo de Auditoría SRE
│   │   └── settings/    # Configuración (API Key)
│   ├── environments/    # Variables de entorno (Prod/Dev)
│   └── theme/           # Variables globales de estilo (CSS)
├── staticwebapp.config.json # Configuración de rutas y seguridad de Azure
└── package.json         # Dependencias del frontend
```

## 4. Funcionalidades Clave

### 4.1. Configuración (Settings)
*   **Gestión de API Key**: Permite al usuario ingresar y guardar su API Key de OpManager localmente.
*   **Prueba de Conexión**: Valida la API Key contra el servidor mediante el proxy.
*   **Estado**: Muestra si la conexión es exitosa.

### 4.2. Dispositivos (Devices)
*   Listado de dispositivos monitoreados.
*   Detalles de estado, disponibilidad y métricas clave.

### 4.3. Alarmas (Alerts)
*   Visualización de alertas activas.
*   Filtrado por severidad y estado.

### 4.4. Salud (Health)
*   Resumen gráfico del estado de la infraestructura.
*   Métricas de rendimiento global.

### 4.5. Interfaces
*   Monitoreo de interfaces de red.
*   Estado de tráfico y errores.

### 4.6. Reportes (Reports)
*   Generación de reportes personalizados.
*   Exportación de datos.

### 4.7. Auditoría SRE (SRE Audit)
*   Herramientas para auditoría de fiabilidad del sitio.

## 5. Detalles Técnicos

### 5.1. Proxy de API (Azure Functions)
Ubicado en `api/opmanager-proxy/index.js`.
*   **Propósito**: Evitar errores de CORS y ocultar detalles de la API original si fuera necesario.
*   **Funcionamiento**: Intercepta las peticiones a `/api/opmanager-proxy/*`, añade los headers necesarios y reenvía la petición a la API real de OpManager.
*   **CORS**: Maneja explícitamente las peticiones `OPTIONS` para permitir el acceso desde el frontend.
*   **Seguridad**: Valida la presencia de la API Key antes de reenviar la petición.

### 5.2. Servicios Principales
*   **OpmanagerApiService**: Centraliza todas las llamadas HTTP. Utiliza la URL del proxy definida en `environment.prod.ts`.
*   **DashboardStateService**: Gestiona el estado de la aplicación y caché de datos para mejorar la respuesta.

### 5.3. Entorno de Ejecución
*   **Node.js**: Versión 22 (requerida tanto para desarrollo local como para el entorno de Azure).

## 6. Guía de Despliegue y Desarrollo

### 6.1. Requisitos Previos
*   Node.js v22 instalado.
*   Ionic CLI (`npm install -g @ionic/cli`).
*   Azure Functions Core Tools (opcional, para depurar la API localmente).

### 6.2. Ejecución Local
```bash
npm install
ionic serve
```
*Nota: Para probar la API localmente, se requiere correr también la Azure Function o configurar un proxy local.*

### 6.3. Despliegue (CI/CD)
El despliegue es automático mediante GitHub Actions al hacer push a la rama `main`.
*   **Workflow**: `.github/workflows/azure-static-web-apps-green-wave-016489610.yml`
*   **Build**: Compila la app de Ionic (`ionic build --prod`) y la API.
*   **Deploy**: Sube los artefactos a Azure Static Web Apps.

## 7. Mejoras Futuras Sugeridas
*   Implementación de caché más agresiva en el Service Worker.
*   Mejoras en la visualización de gráficos con librerías más avanzadas.
*   Notificaciones Push para alertas críticas.
