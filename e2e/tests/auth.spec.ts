import { test, expect } from '@playwright/test';
import { SettingsPage } from '../pages/settings.page';
import { TEST_API_KEY } from '../fixtures/test-data';

test.describe('Authentication Flow', () => {
    let settingsPage: SettingsPage;

    test.beforeEach(async ({ page }) => {
        settingsPage = new SettingsPage(page);
        await settingsPage.goto();

        // Clear localStorage before each test
        await page.evaluate(() => localStorage.clear());
    });

    test('should display settings page', async ({ page }) => {
        await settingsPage.navigate();

        await expect(settingsPage.apiKeyInput).toBeVisible();
        await expect(settingsPage.saveButton).toBeVisible();
        await expect(settingsPage.testConnectionButton).toBeVisible();
    });

    test('should save API key to localStorage', async ({ page }) => {
        await settingsPage.navigate();
        await settingsPage.setApiKey(TEST_API_KEY);
        await settingsPage.saveApiKey();

        // Verify API key is saved in localStorage
        const savedKey = await page.evaluate(() => localStorage.getItem('opmanagerApiKey'));
        expect(savedKey).toBe(TEST_API_KEY);
    });

    test('should test connection with valid API key', async ({ page }) => {
        // Skip if no real API key is provided
        if (TEST_API_KEY === 'test-api-key-placeholder') {
            test.skip();
        }

        await settingsPage.navigate();
        await settingsPage.setApiKey(TEST_API_KEY);
        await settingsPage.saveApiKey();
        await settingsPage.testConnection();

        // Wait for connection test to complete
        await settingsPage.waitForLoadingComplete();

        // Verify success message or navigation
        // This depends on your actual implementation
        const toast = page.locator('ion-toast');
        await expect(toast).toBeVisible({ timeout: 5000 });
    });

    test('should persist API key across page reloads', async ({ page }) => {
        await settingsPage.navigate();
        await settingsPage.setApiKey(TEST_API_KEY);
        await settingsPage.saveApiKey();

        // Reload the page
        await page.reload();
        await settingsPage.navigate();

        // Verify API key is still present
        const savedKey = await page.evaluate(() => localStorage.getItem('opmanagerApiKey'));
        expect(savedKey).toBe(TEST_API_KEY);
    });

    test('should handle empty API key', async ({ page }) => {
        await settingsPage.navigate();
        await settingsPage.setApiKey('');
        await settingsPage.saveApiKey();

        // Verify localStorage is cleared or empty
        const savedKey = await page.evaluate(() => localStorage.getItem('opmanagerApiKey'));
        expect(savedKey).toBeFalsy();
    });
});
