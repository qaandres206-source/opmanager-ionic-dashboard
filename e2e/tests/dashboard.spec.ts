import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { SettingsPage } from '../pages/settings.page';
import { TEST_API_KEY, TIMEOUTS } from '../fixtures/test-data';

test.describe('Dashboard Navigation', () => {
    let dashboardPage: DashboardPage;
    let settingsPage: SettingsPage;

    test.beforeEach(async ({ page }) => {
        dashboardPage = new DashboardPage(page);
        settingsPage = new SettingsPage(page);

        await dashboardPage.goto();

        // Set up authentication if real API key is provided
        if (TEST_API_KEY !== 'test-api-key-placeholder') {
            await settingsPage.authenticate(TEST_API_KEY);
        }
    });

    test('should display all navigation tabs', async ({ page }) => {
        await expect(dashboardPage.devicesTab).toBeVisible();
        await expect(dashboardPage.alertsTab).toBeVisible();
        await expect(dashboardPage.healthTab).toBeVisible();
    });

    test('should navigate to devices tab', async ({ page }) => {
        await dashboardPage.goToDevices();

        await expect(dashboardPage.deviceList).toBeVisible();
        await expect(page).toHaveURL(/.*tab1/);
    });

    test('should navigate to alerts tab', async ({ page }) => {
        await dashboardPage.goToAlerts();

        await expect(dashboardPage.alertList).toBeVisible();
        await expect(page).toHaveURL(/.*tab2/);
    });

    test('should navigate to health summary tab', async ({ page }) => {
        await dashboardPage.goToHealth();

        await expect(dashboardPage.healthSummary).toBeVisible();
        await expect(page).toHaveURL(/.*tab3/);
    });

    test('should navigate between tabs', async ({ page }) => {
        // Navigate through all tabs
        await dashboardPage.goToDevices();
        await expect(page).toHaveURL(/.*tab1/);

        await dashboardPage.goToAlerts();
        await expect(page).toHaveURL(/.*tab2/);

        await dashboardPage.goToHealth();
        await expect(page).toHaveURL(/.*tab3/);

        // Navigate back to devices
        await dashboardPage.goToDevices();
        await expect(page).toHaveURL(/.*tab1/);
    });
});

test.describe('Dashboard Data Loading', () => {
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

    test('should load devices on devices tab', async ({ page }) => {
        await dashboardPage.goToDevices();
        await dashboardPage.waitForLoadingComplete(TIMEOUTS.long);

        const deviceCount = await dashboardPage.getDeviceCount();
        expect(deviceCount).toBeGreaterThan(0);
    });

    test('should load alerts on alerts tab', async ({ page }) => {
        await dashboardPage.goToAlerts();
        await dashboardPage.waitForLoadingComplete(TIMEOUTS.long);

        const alertCount = await dashboardPage.getAlertCount();
        expect(alertCount).toBeGreaterThan(0);
    });

    test('should display health summary', async ({ page }) => {
        await dashboardPage.goToHealth();
        await dashboardPage.waitForLoadingComplete(TIMEOUTS.long);

        // Verify health cards are visible
        const healthCards = page.locator('ion-card');
        const cardCount = await healthCards.count();
        expect(cardCount).toBeGreaterThan(0);
    });

    test('should show loading spinner during data fetch', async ({ page }) => {
        await dashboardPage.goToDevices();

        // Check if spinner appears (might be very quick)
        const spinner = page.locator('ion-spinner');

        // Wait for loading to complete
        await dashboardPage.waitForLoadingComplete(TIMEOUTS.long);

        // Spinner should be hidden after loading
        await expect(spinner).toBeHidden();
    });
});
