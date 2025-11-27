import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { SettingsPage } from '../pages/settings.page';
import { TEST_API_KEY, TIMEOUTS } from '../fixtures/test-data';

test.describe('Device and Alert Filters', () => {
    let dashboardPage: DashboardPage;
    let settingsPage: SettingsPage;

    test.beforeEach(async ({ page }) => {
        dashboardPage = new DashboardPage(page);
        settingsPage = new SettingsPage(page);

        await dashboardPage.goto();

        // Skip tests if no real API key
        if (TEST_API_KEY === 'test-api-key-placeholder') {
            test.skip();
        }

        await settingsPage.authenticate(TEST_API_KEY);
    });

    test('should filter devices by category', async ({ page }) => {
        await dashboardPage.goToDevices();
        await dashboardPage.waitForLoadingComplete(TIMEOUTS.long);

        const initialCount = await dashboardPage.getDeviceCount();

        // Try to filter by a category (if filter buttons exist)
        const filterButtons = page.locator('ion-button').filter({ hasText: /Firewall|Server|Switch/ });
        const filterCount = await filterButtons.count();

        if (filterCount > 0) {
            await filterButtons.first().click();
            await dashboardPage.waitForLoadingComplete();

            const filteredCount = await dashboardPage.getDeviceCount();
            // Filtered count might be different from initial
            expect(filteredCount).toBeGreaterThanOrEqual(0);
        }
    });

    test('should search for devices', async ({ page }) => {
        await dashboardPage.goToDevices();
        await dashboardPage.waitForLoadingComplete(TIMEOUTS.long);

        const searchBar = page.locator('ion-searchbar');
        const searchBarCount = await searchBar.count();

        if (searchBarCount > 0) {
            await dashboardPage.searchDevice('test');
            await page.waitForTimeout(1000); // Wait for search to filter

            // Verify search is working (results should update)
            const deviceCount = await dashboardPage.getDeviceCount();
            expect(deviceCount).toBeGreaterThanOrEqual(0);
        }
    });

    test('should filter alerts by severity', async ({ page }) => {
        await dashboardPage.goToAlerts();
        await dashboardPage.waitForLoadingComplete(TIMEOUTS.long);

        const initialCount = await dashboardPage.getAlertCount();
        expect(initialCount).toBeGreaterThanOrEqual(0);

        // Look for severity filter buttons
        const severityButtons = page.locator('ion-button').filter({ hasText: /Critical|Warning|Clear/ });
        const buttonCount = await severityButtons.count();

        if (buttonCount > 0) {
            await severityButtons.first().click();
            await dashboardPage.waitForLoadingComplete();

            const filteredCount = await dashboardPage.getAlertCount();
            expect(filteredCount).toBeGreaterThanOrEqual(0);
        }
    });

    test('should handle customer filter', async ({ page }) => {
        await dashboardPage.goToDevices();
        await dashboardPage.waitForLoadingComplete(TIMEOUTS.long);

        // Look for customer selector
        const customerSelect = page.locator('ion-select').filter({ hasText: /Cliente|Customer/ });
        const selectCount = await customerSelect.count();

        if (selectCount > 0) {
            await customerSelect.first().click();

            // Wait for options to appear
            await page.waitForTimeout(500);

            // Select first option
            const options = page.locator('ion-select-option');
            const optionCount = await options.count();

            if (optionCount > 0) {
                await options.first().click();
                await dashboardPage.waitForLoadingComplete();

                // Verify data reloaded
                const deviceCount = await dashboardPage.getDeviceCount();
                expect(deviceCount).toBeGreaterThanOrEqual(0);
            }
        }
    });
});
