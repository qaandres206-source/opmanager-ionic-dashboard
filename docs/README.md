# 📚 Documentación del Proyecto

Bienvenido a la documentación completa del **OpManager Ionic Dashboard**.

## 📋 Índice de Documentos

### Arquitectura y Diseño

- **[ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)** - Guía completa de todos los diagramas de arquitectura
  - Diagrama de Arquitectura General
  - Diagrama de Flujo de Datos
  - Diagrama de Pipeline CI/CD
  - Diagrama de Infraestructura Detallada

- **[../AZURE_ARCHITECTURE.md](../AZURE_ARCHITECTURE.md)** - Documentación técnica detallada de la arquitectura Azure
  - Componentes principales
  - Flujo de datos
  - Seguridad
  - Escalabilidad
  - Configuración

### Guías de Inicio

- **[../README.md](../README.md)** - Guía principal del proyecto
  - Características
  - Instalación
  - Desarrollo local
  - Testing
  - Deployment

- **[../SETUP_GUIDE.md](../SETUP_GUIDE.md)** - Guía detallada de configuración
  - Requisitos previos
  - Configuración del entorno
  - Variables de entorno
  - Troubleshooting

### Testing y Calidad

- **[../TESTING.md](../TESTING.md)** - Guía completa de testing
  - Tests E2E con Playwright
  - Tests unitarios
  - Estrategias de testing
  - CI/CD testing

### Contribución y Desarrollo

- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** - Guía de contribución
  - Estándares de código
  - Proceso de desarrollo
  - Pull requests
  - Code review

### Documentación Técnica

- **[../TECHNICAL_DOCS.md](../TECHNICAL_DOCS.md)** - Documentación técnica
  - Estructura del código
  - Servicios Angular
  - API integration
  - State management

## 🎯 Guías Rápidas

### Para Desarrolladores Nuevos

1. Lee el [README.md](../README.md) para entender el proyecto
2. Sigue el [SETUP_GUIDE.md](../SETUP_GUIDE.md) para configurar tu entorno
3. Revisa [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) para entender la arquitectura
4. Consulta [CONTRIBUTING.md](../CONTRIBUTING.md) antes de hacer cambios

### Para DevOps/Infraestructura

1. Revisa [AZURE_ARCHITECTURE.md](../AZURE_ARCHITECTURE.md) para entender el deployment
2. Consulta [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) para ver el pipeline CI/CD
3. Verifica la configuración en `azure-pipelines.yml` y `staticwebapp.config.json`

### Para QA/Testing

1. Lee [TESTING.md](../TESTING.md) para entender la estrategia de testing
2. Ejecuta los tests E2E siguiendo las instrucciones
3. Reporta issues siguiendo [CONTRIBUTING.md](../CONTRIBUTING.md)

## 🏗️ Arquitectura en Resumen

### Stack Tecnológico

**Frontend:**
- Ionic 8
- Angular 19
- TypeScript
- RxJS

**Backend:**
- Azure Functions (Node.js 22)
- Express (desarrollo local)

**Infraestructura:**
- Azure Static Web Apps
- Azure Functions
- Azure DevOps (CI/CD)

**Testing:**
- Playwright (E2E)
- Jasmine/Karma (Unit)

### Flujo de Deployment

```
git push → Azure DevOps → Build → Test → Deploy → Production
```

## 📊 Diagramas Disponibles

Este proyecto incluye 5 diagramas de arquitectura:

1. **Arquitectura General** - Vista completa del sistema
2. **Flujo de Datos** - Secuencia de peticiones
3. **Pipeline CI/CD** - Proceso de deployment
4. **Infraestructura Detallada** - Recursos de Azure
5. **Resumen Simple** - Vista simplificada para presentaciones

Todos los diagramas están documentados en [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md).

## 🔗 Enlaces Útiles

### Recursos Externos

- [Ionic Framework Documentation](https://ionicframework.com/docs)
- [Angular Documentation](https://angular.io/docs)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Playwright Documentation](https://playwright.dev/)

### Recursos del Proyecto

- [Repositorio Git](#) - (Agregar URL)
- [Azure DevOps](#) - (Agregar URL)
- [Aplicación en Producción](#) - (Agregar URL)

## 🤝 Contribuir

¿Encontraste un error en la documentación? ¿Quieres agregar más información?

1. Lee [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Crea un branch: `git checkout -b docs/mejora-documentacion`
3. Haz tus cambios
4. Crea un Pull Request

## 📝 Mantenimiento de Documentación

### Responsabilidades

- **Desarrolladores**: Actualizar documentación técnica al hacer cambios
- **DevOps**: Mantener documentación de infraestructura actualizada
- **QA**: Actualizar guías de testing
- **Tech Lead**: Revisar y aprobar cambios en documentación

### Estándares

- Usar Markdown para todos los documentos
- Incluir ejemplos de código cuando sea relevante
- Mantener diagramas actualizados
- Usar lenguaje claro y conciso
- Incluir enlaces a recursos externos

## 🔄 Historial de Cambios

### v1.0 - Diciembre 2024
- ✅ Documentación inicial completa
- ✅ 5 diagramas de arquitectura
- ✅ Guías de setup y testing
- ✅ Documentación de Azure deployment

## 📞 Contacto

¿Preguntas sobre la documentación?

- Crea un issue en el repositorio
- Contacta al equipo de desarrollo
- Revisa las FAQs en cada documento

---

**Última actualización**: Diciembre 2025
**Mantenido por**: Andrés M.
