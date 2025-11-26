# Contributing to OpManager MSP Dashboard

¡Gracias por tu interés en contribuir al OpManager MSP Dashboard! Este documento proporciona guías y mejores prácticas para contribuir al proyecto.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Proceso de Development](#proceso-de-development)
- [Estándares de Código](#estándares-de-código)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)

## 🤝 Código de Conducta

Este proyecto se adhiere a un código de conducta profesional. Al participar, se espera que mantengas este código:

- Sé respetuoso y profesional
- Acepta críticas constructivas
- Enfócate en lo mejor para el proyecto
- Muestra empatía hacia otros contribuidores

## 🚀 Cómo Contribuir

### Reportar Bugs

Antes de crear un issue:

1. Verifica que el bug no haya sido reportado
2. Incluye pasos para reproducir
3. Describe el comportamiento esperado vs actual
4. Incluye screenshots si es relevante
5. Especifica tu entorno (OS, browser, versión)

**Template de Bug Report:**

```markdown
**Descripción del Bug**
Descripción clara del problema.

**Pasos para Reproducir**
1. Ve a '...'
2. Haz click en '...'
3. Observa el error

**Comportamiento Esperado**
Qué debería suceder.

**Screenshots**
Si aplica, agrega screenshots.

**Entorno**
- OS: [e.g. macOS 14.0]
- Browser: [e.g. Chrome 120]
- Versión: [e.g. 1.2.3]
```

### Sugerir Features

Para sugerir nuevas funcionalidades:

1. Verifica que no exista un issue similar
2. Describe claramente el feature
3. Explica por qué sería útil
4. Proporciona ejemplos de uso

## 💻 Proceso de Development

### 1. Setup Inicial

```bash
# Fork el repositorio
git clone https://github.com/your-username/opmanager-ionic-dashboard.git
cd opmanager-ionic-dashboard

# Instalar dependencias
npm install

# Instalar Playwright
npx playwright install

# Configurar upstream
git remote add upstream https://github.com/original/opmanager-ionic-dashboard.git
```

### 2. Crear Branch

```bash
# Actualizar main
git checkout main
git pull upstream main

# Crear feature branch
git checkout -b feature/my-new-feature

# O para bugfix
git checkout -b fix/bug-description
```

### 3. Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run start:proxy

# En otra terminal, ejecutar tests en watch mode
npm run test:e2e:ui
```

### 4. Commit Changes

```bash
# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: add device search functionality"
```

## 📝 Estándares de Código

### TypeScript/Angular

#### Naming Conventions

```typescript
// Classes: PascalCase
export class DeviceService { }

// Interfaces: PascalCase con prefijo I (opcional)
export interface Device { }

// Variables y funciones: camelCase
const deviceCount = 10;
function getDevices() { }

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Archivos: kebab-case
// device-list.component.ts
// opmanager-api.service.ts
```

#### Code Style

```typescript
// ✅ Bueno
export class DeviceListComponent implements OnInit {
  devices: Device[] = [];
  
  constructor(
    private apiService: OpmanagerApiService,
    private stateService: DashboardStateService
  ) {}
  
  ngOnInit(): void {
    this.loadDevices();
  }
  
  private loadDevices(): void {
    this.apiService.getDevices().subscribe({
      next: (devices) => this.devices = devices,
      error: (error) => console.error('Error loading devices:', error)
    });
  }
}

// ❌ Evitar
export class DeviceListComponent {
  public devices;
  
  constructor(private apiService, private stateService) {}
  
  ngOnInit() {
    this.apiService.getDevices().subscribe(devices => {
      this.devices = devices;
    });
  }
}
```

### HTML/Templates

```html
<!-- ✅ Bueno: Indentación clara, atributos organizados -->
<ion-item
  *ngFor="let device of devices"
  [class.critical]="device.severity === 'Critical'"
  (click)="selectDevice(device)"
>
  <ion-label>
    <h2>{{ device.displayName }}</h2>
    <p>{{ device.ipaddress }}</p>
  </ion-label>
</ion-item>

<!-- ❌ Evitar: Todo en una línea, difícil de leer -->
<ion-item *ngFor="let device of devices" [class.critical]="device.severity === 'Critical'" (click)="selectDevice(device)"><ion-label><h2>{{ device.displayName }}</h2><p>{{ device.ipaddress }}</p></ion-label></ion-item>
```

### CSS/SCSS

```scss
// ✅ Bueno: BEM naming, organizado
.device-list {
  &__item {
    padding: 16px;
    
    &--critical {
      background-color: var(--ion-color-danger);
    }
  }
  
  &__label {
    font-size: 14px;
  }
}

// ❌ Evitar: Selectores genéricos, anidación excesiva
.list {
  .item {
    .label {
      .title {
        font-size: 14px;
      }
    }
  }
}
```

### Comentarios

```typescript
/**
 * Fetches devices from OpManager API
 * @param params Optional query parameters
 * @returns Observable of Device array
 */
getDevices(params?: DeviceQueryParams): Observable<Device[]> {
  // Build HTTP params
  const httpParams = this.buildParams(params);
  
  // Make request
  return this.http.get<DeviceResponse>(this.apiUrl, { params: httpParams })
    .pipe(
      map(response => response.devices),
      catchError(this.handleError)
    );
}
```

## 🔀 Git Workflow

### Commit Messages

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Nueva funcionalidad
- `fix`: Bug fix
- `docs`: Cambios en documentación
- `style`: Formateo, punto y coma faltante, etc.
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Mantenimiento, dependencias, etc.

**Ejemplos:**

```bash
# Feature
git commit -m "feat(devices): add search functionality"

# Bug fix
git commit -m "fix(api): handle null response from listDevices endpoint"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api)!: change authentication to use OAuth

BREAKING CHANGE: API key authentication is no longer supported"
```

### Branch Naming

```bash
# Features
feature/device-search
feature/export-to-excel

# Bug fixes
fix/null-pointer-in-device-list
fix/cors-error-on-production

# Documentation
docs/update-readme
docs/add-api-guide

# Refactoring
refactor/simplify-api-service
refactor/extract-common-components
```

## 🔍 Pull Request Process

### 1. Antes de Crear PR

- [ ] Código sigue los estándares del proyecto
- [ ] Tests pasan: `npm run test:e2e`
- [ ] Lint pasa: `npm run lint`
- [ ] Build exitoso: `npm run build`
- [ ] Documentación actualizada si es necesario
- [ ] Commits siguen Conventional Commits

### 2. Crear Pull Request

**Template de PR:**

```markdown
## Descripción
Breve descripción de los cambios.

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## Checklist
- [ ] Tests agregados/actualizados
- [ ] Documentación actualizada
- [ ] Lint pasa
- [ ] Build exitoso
- [ ] Probado localmente

## Screenshots
Si aplica, agrega screenshots.

## Issues Relacionados
Closes #123
```

### 3. Code Review

- Responde a comentarios de manera constructiva
- Haz cambios solicitados en commits separados
- No hagas force push después de review
- Marca conversaciones como resueltas cuando aplique

### 4. Merge

- Squash commits si hay muchos commits pequeños
- Asegúrate de que CI pase
- Espera aprobación de al menos un reviewer

## ✅ Testing Requirements

### Tests Requeridos

Para cada PR que agregue funcionalidad:

1. **E2E Tests**: Para flujos de usuario
2. **Unit Tests**: Para servicios y lógica de negocio
3. **Component Tests**: Para componentes complejos

### Ejemplo de Test Coverage

```typescript
// device.service.spec.ts
describe('DeviceService', () => {
  it('should fetch devices', () => {
    // Test implementation
  });
  
  it('should handle errors', () => {
    // Test implementation
  });
  
  it('should cache results', () => {
    // Test implementation
  });
});
```

### Running Tests

```bash
# Antes de commit
npm run test:e2e
npm test

# Durante development
npm run test:e2e:ui
npm test -- --watch
```

## 📚 Recursos

- [Angular Style Guide](https://angular.io/guide/styleguide)
- [Ionic Documentation](https://ionicframework.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ❓ Preguntas

Si tienes preguntas sobre cómo contribuir:

1. Revisa la documentación existente
2. Busca en issues cerrados
3. Crea un nuevo issue con la etiqueta `question`

## 🙏 Agradecimientos

¡Gracias por contribuir al OpManager MSP Dashboard!
