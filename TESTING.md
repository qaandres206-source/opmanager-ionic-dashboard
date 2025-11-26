# Testing Guide - OpManager MSP Dashboard

Esta guía cubre todas las estrategias de testing para el OpManager MSP Dashboard.

## 📋 Tabla de Contenidos

- [Testing E2E con Playwright](#testing-e2e-con-playwright)
- [Testing Unitario con Jasmine/Karma](#testing-unitario-con-jasminkarma)
- [Mejores Prácticas](#mejores-prácticas)
- [CI/CD Integration](#cicd-integration)

## 🎭 Testing E2E con Playwright

### Configuración Inicial

```bash
# Instalar Playwright
npm install -D @playwright/test

# Instalar browsers
npx playwright install
```

### Ejecutar Tests

```bash
# Todos los tests
npm run test:e2e

# Con UI interactiva (recomendado para desarrollo)
npm run test:e2e:ui

# En modo headed (ver el browser)
npm run test:e2e:headed

# Modo debug (paso a paso)
npm run test:e2e:debug

# Solo un archivo específico
npx playwright test e2e/tests/auth.spec.ts

# Solo un test específico
npx playwright test -g "should save API key"
```

### Ver Reportes

```bash
# Abrir reporte HTML
npm run test:e2e:report

# Abrir trace viewer (para debugging)
npx playwright show-trace trace.zip
```

### Estructura de Tests

```
e2e/
├── fixtures/
│   └── test-data.ts          # Datos de prueba y constantes
├── pages/
│   ├── base.page.ts          # Page Object base
│   ├── settings.page.ts      # Page Object de configuración
│   └── dashboard.page.ts     # Page Object del dashboard
└── tests/
    ├── auth.spec.ts          # Tests de autenticación
    ├── dashboard.spec.ts     # Tests de navegación
    └── filters.spec.ts       # Tests de filtros
```

### Page Object Model (POM)

Los tests usan el patrón Page Object Model para mejor mantenibilidad:

```typescript
// Ejemplo de uso
import { SettingsPage } from '../pages/settings.page';

test('should authenticate', async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  await settingsPage.navigate();
  await settingsPage.authenticate('my-api-key');
});
```

### Configuración de API Key para Tests

Para tests con datos reales, configura la variable de entorno:

```bash
# Linux/Mac
export TEST_API_KEY="your-real-api-key"

# Windows
set TEST_API_KEY=your-real-api-key

# O en un archivo .env
echo "TEST_API_KEY=your-api-key" > .env
```

### Tests Disponibles

#### 1. Authentication Tests (`auth.spec.ts`)
- ✅ Guardar API key en localStorage
- ✅ Probar conexión con API key válida
- ✅ Persistencia de API key tras reload
- ✅ Manejo de API key vacía

#### 2. Dashboard Tests (`dashboard.spec.ts`)
- ✅ Navegación entre tabs
- ✅ Carga de dispositivos
- ✅ Carga de alertas
- ✅ Visualización de resumen de salud
- ✅ Loading spinners

#### 3. Filter Tests (`filters.spec.ts`)
- ✅ Filtros por categoría de dispositivo
- ✅ Búsqueda de dispositivos
- ✅ Filtros por severidad de alertas
- ✅ Selector de cliente

### Configuración Avanzada

#### Ejecutar en Múltiples Browsers

```bash
# Solo Chrome
npx playwright test --project=chromium

# Solo Firefox
npx playwright test --project=firefox

# Solo Safari
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"
```

#### Configurar Timeouts

En `playwright.config.ts`:

```typescript
export default defineConfig({
  timeout: 30000,        // Timeout por test
  expect: {
    timeout: 5000        // Timeout para assertions
  },
});
```

#### Screenshots y Videos

```typescript
// En playwright.config.ts
use: {
  screenshot: 'only-on-failure',  // 'on', 'off', 'only-on-failure'
  video: 'retain-on-failure',     // 'on', 'off', 'retain-on-failure'
}
```

## 🧪 Testing Unitario con Jasmine/Karma

### Ejecutar Tests Unitarios

```bash
# Ejecutar todos los tests
npm test

# Ejecutar en modo watch
npm run test -- --watch

# Ejecutar con coverage
npm run test -- --code-coverage
```

### Estructura de Tests Unitarios

```typescript
describe('OpmanagerApiService', () => {
  let service: OpmanagerApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OpmanagerApiService]
    });
    service = TestBed.inject(OpmanagerApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch devices', () => {
    const mockDevices = [{ name: 'Device1' }];
    
    service.getDevices().subscribe(devices => {
      expect(devices).toEqual(mockDevices);
    });

    const req = httpMock.expectOne('/api/json/v2/device/listDevices');
    expect(req.request.method).toBe('GET');
    req.flush({ rows: mockDevices });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
```

## ✅ Mejores Prácticas

### 1. Organización de Tests

- **Un test, una responsabilidad**: Cada test debe verificar una sola cosa
- **Nombres descriptivos**: `should load devices when API key is valid`
- **Arrange-Act-Assert**: Estructura clara en cada test

```typescript
test('should filter devices by category', async ({ page }) => {
  // Arrange
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goToDevices();
  
  // Act
  await dashboardPage.filterByCategory('Firewall');
  
  // Assert
  const count = await dashboardPage.getDeviceCount();
  expect(count).toBeGreaterThan(0);
});
```

### 2. Uso de Fixtures

Centraliza datos de prueba:

```typescript
// e2e/fixtures/test-data.ts
export const MOCK_DEVICE = {
  displayName: 'Test Device',
  ipaddress: '192.168.1.1',
};
```

### 3. Manejo de Esperas

```typescript
// ❌ Evitar
await page.waitForTimeout(5000);

// ✅ Mejor
await page.waitForSelector('ion-item');
await page.waitForLoadState('networkidle');
```

### 4. Selectores Robustos

```typescript
// ❌ Frágil
page.locator('div > button:nth-child(3)');

// ✅ Robusto
page.locator('ion-button[data-testid="save-button"]');
page.locator('ion-button:has-text("Guardar")');
```

### 5. Limpieza de Estado

```typescript
test.beforeEach(async ({ page }) => {
  // Limpiar localStorage antes de cada test
  await page.evaluate(() => localStorage.clear());
});
```

## 🔄 CI/CD Integration

### GitHub Actions

Ejemplo de workflow (`.github/workflows/test.yml`):

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_API_KEY: ${{ secrets.TEST_API_KEY }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Variables de Entorno en CI

Configura secrets en tu repositorio:
- `TEST_API_KEY`: API key para tests

## 📊 Coverage

### Generar Reporte de Coverage

```bash
# Tests unitarios con coverage
npm run test -- --code-coverage

# Ver reporte
open coverage/index.html
```

### Objetivos de Coverage

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## 🐛 Debugging

### Playwright

```bash
# Modo debug interactivo
npm run test:e2e:debug

# Ver trace de un test fallido
npx playwright show-trace trace.zip
```

### Jasmine/Karma

```bash
# Debug en Chrome
npm test -- --browsers=Chrome --watch
```

## 📝 Escribir Nuevos Tests

### Template para Test E2E

```typescript
import { test, expect } from '@playwright/test';
import { MyPage } from '../pages/my.page';

test.describe('Feature Name', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    myPage = new MyPage(page);
    await myPage.goto();
  });

  test('should do something', async ({ page }) => {
    // Arrange
    
    // Act
    
    // Assert
    expect(true).toBe(true);
  });
});
```

### Template para Test Unitario

```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

## 🔗 Referencias

- [Playwright Documentation](https://playwright.dev/)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Ionic Testing Guide](https://ionicframework.com/docs/angular/testing)
