import { test, expect } from '@playwright/test';

/**
 * Tests para verificar el deployment en producción
 * 
 * Para ejecutar estos tests:
 * 1. Configura la API key como variable de entorno:
 *    export OPMANAGER_API_KEY="tu-api-key-aqui"
 * 
 * 2. Ejecuta los tests:
 *    npm run test:e2e -- production.spec.ts
 * 
 * 3. O en modo headed para ver el navegador:
 *    npm run test:e2e:headed -- production.spec.ts
 */

const PRODUCTION_URL = 'https://green-wave-016489610.3.azurestaticapps.net';
const API_KEY = process.env.OPMANAGER_API_KEY || '';

test.describe('Production Deployment Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(PRODUCTION_URL);
    });

    test('should load the application without errors', async ({ page }) => {
        // Verificar que la página carga
        await expect(page).toHaveTitle(/OpManager/);

        // Verificar que no hay errores críticos en la consola
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.waitForLoadState('networkidle');

        // Filtrar errores conocidos/esperados si los hay
        const criticalErrors = errors.filter(e =>
            !e.includes('favicon') && // Ignorar errores de favicon
            !e.includes('DevTools')   // Ignorar warnings de DevTools
        );

        expect(criticalErrors).toHaveLength(0);
    });

    test('should not have CORS errors', async ({ page }) => {
        const corsErrors: string[] = [];

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('CORS') || text.includes('Cross-Origin') || text.includes('Access-Control')) {
                corsErrors.push(text);
            }
        });

        // Navegar a diferentes páginas para generar peticiones API
        await page.click('text=Dispositivos');
        await page.waitForTimeout(2000);

        await page.click('text=Alarmas');
        await page.waitForTimeout(2000);

        // Verificar que no hay errores de CORS
        expect(corsErrors).toHaveLength(0);
    });

    test('should show settings page', async ({ page }) => {
        await page.click('text=Configuración');
        await expect(page.locator('text=API Key de OpManager')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('text=GUARDAR API KEY')).toBeVisible();
    });

    test.skip('should test API connection with valid key', async ({ page }) => {
        // Este test se salta por defecto porque requiere una API key válida
        // Para ejecutarlo, quita el .skip y configura OPMANAGER_API_KEY

        if (!API_KEY) {
            test.skip();
            return;
        }

        // Navegar a settings
        await page.click('text=Configuración');

        // Ingresar API key
        await page.fill('input[type="password"]', API_KEY);
        await page.click('text=GUARDAR API KEY');

        // Esperar confirmación
        await page.waitForTimeout(1000);

        // Probar conexión
        await page.click('text=PROBAR CONEXIÓN');

        // Verificar que la conexión es exitosa
        // Ajusta el selector según tu implementación
        await expect(page.locator('text=Conexión exitosa')).toBeVisible({ timeout: 10000 });
    });

    test('should verify API proxy is working', async ({ page, request }) => {
        // Verificar que el endpoint del proxy responde
        const response = await request.get(`${PRODUCTION_URL}/api/json/v2/device/listDevices`, {
            params: {
                selCustomerID: '-1',
                regionID: '-1'
            },
            headers: {
                'apiKey': API_KEY || 'test-key'
            },
            failOnStatusCode: false
        });

        // Debe responder (aunque sea con error de autenticación si no hay API key válida)
        expect(response.status()).not.toBe(404);

        // Si hay API key, debe ser 200
        if (API_KEY) {
            expect(response.status()).toBe(200);
        }
    });

    test('should navigate between pages', async ({ page }) => {
        // Verificar navegación básica
        const pages = [
            { name: 'Dispositivos', selector: 'text=Dispositivos' },
            { name: 'Alarmas', selector: 'text=Alarmas' },
            { name: 'Interfaces', selector: 'text=Interfaces' },
            { name: 'Reportes', selector: 'text=Reportes' },
            { name: 'Configuración', selector: 'text=Configuración' }
        ];

        for (const p of pages) {
            await page.click(p.selector);
            await page.waitForLoadState('networkidle');
            // Verificar que no hay errores 404
            const content = await page.content();
            expect(content).not.toContain('404');
            expect(content).not.toContain('Page not found');
        }
    });

    test('should have correct meta tags for SEO', async ({ page }) => {
        // Verificar meta tags importantes
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);

        // Verificar viewport meta tag
        const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(viewport).toContain('width=device-width');
    });

    test('should load static assets correctly', async ({ page }) => {
        const failedRequests: string[] = [];

        page.on('requestfailed', request => {
            failedRequests.push(request.url());
        });

        await page.waitForLoadState('networkidle');

        // Filtrar requests que sabemos que pueden fallar (como favicon)
        const criticalFailures = failedRequests.filter(url =>
            !url.includes('favicon') &&
            !url.includes('manifest.json') &&
            (url.includes('.js') || url.includes('.css') || url.includes('.png') || url.includes('.jpg'))
        );

        expect(criticalFailures).toHaveLength(0);
    });

    test('should be responsive on mobile', async ({ page }) => {
        // Simular viewport móvil
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

        // Verificar que el contenido es visible
        await expect(page.locator('ion-header')).toBeVisible();
        await expect(page.locator('ion-content')).toBeVisible();

        // Verificar navegación móvil
        await page.click('text=Dispositivos');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/dispositivos/);
    });

    test('should handle localStorage correctly', async ({ page }) => {
        // Verificar que localStorage funciona
        await page.click('text=Configuración');

        // Guardar un valor
        await page.fill('input[type="password"]', 'test-api-key-12345');
        await page.click('text=GUARDAR API KEY');

        // Recargar la página
        await page.reload();
        await page.click('text=Configuración');

        // Verificar que el valor persiste
        const value = await page.inputValue('input[type="password"]');
        expect(value).toBe('test-api-key-12345');
    });
});

test.describe('API Proxy Integration Tests', () => {
    test('should proxy requests correctly', async ({ request }) => {
        if (!API_KEY) {
            test.skip();
            return;
        }

        // Test listDevices endpoint
        const devicesResponse = await request.get(`${PRODUCTION_URL}/api/json/v2/device/listDevices`, {
            params: {
                selCustomerID: '-1',
                regionID: '-1'
            },
            headers: {
                'apiKey': API_KEY
            }
        });

        expect(devicesResponse.ok()).toBeTruthy();
        const devicesData = await devicesResponse.json();
        expect(devicesData).toBeDefined();
    });

    test('should handle authentication errors', async ({ request }) => {
        // Test con API key inválida
        const response = await request.get(`${PRODUCTION_URL}/api/json/v2/device/listDevices`, {
            params: {
                selCustomerID: '-1',
                regionID: '-1'
            },
            headers: {
                'apiKey': 'invalid-key'
            },
            failOnStatusCode: false
        });

        // Debe responder con error de autenticación (401 o 403)
        expect([401, 403, 500]).toContain(response.status());
    });
});

test.describe('Performance Tests', () => {
    test('should load within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto(PRODUCTION_URL);
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // La página debe cargar en menos de 5 segundos
        expect(loadTime).toBeLessThan(5000);
    });

    test('should have good Lighthouse scores', async ({ page }) => {
        // Este test requiere configuración adicional de Lighthouse
        // Por ahora solo verificamos que la página carga rápido
        await page.goto(PRODUCTION_URL);

        const performanceTiming = await page.evaluate(() => {
            const timing = performance.timing;
            return {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart
            };
        });

        // DOM debe estar listo en menos de 3 segundos
        expect(performanceTiming.domReady).toBeLessThan(3000);
    });
});
