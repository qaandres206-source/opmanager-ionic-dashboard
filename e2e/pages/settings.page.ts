import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Settings Page Object Model
 * Handles interactions with the Settings/Configuration page
 */
export class SettingsPage extends BasePage {
    readonly apiKeyInput: Locator;
    readonly saveButton: Locator;
    readonly testConnectionButton: Locator;

    constructor(page: Page) {
        super(page);
        this.apiKeyInput = page.locator('ion-input[placeholder*="API Key"]');
        this.saveButton = page.locator('ion-button:has-text("GUARDAR API KEY")');
        this.testConnectionButton = page.locator('ion-button:has-text("PROBAR CONEXIÓN")');
    }

    /**
     * Navigate to settings page
     */
    async navigate() {
        await this.navigateToTab('settings');
    }

    /**
     * Set API key
     */
    async setApiKey(apiKey: string) {
        await this.apiKeyInput.fill(apiKey);
    }

    /**
     * Save API key
     */
    async saveApiKey() {
        await this.saveButton.click();
    }

    /**
     * Test connection with current API key
     */
    async testConnection() {
        await this.testConnectionButton.click();
    }

    /**
     * Complete authentication flow
     */
    async authenticate(apiKey: string) {
        await this.navigate();
        await this.setApiKey(apiKey);
        await this.saveApiKey();
        await this.waitForLoadingComplete();
    }
}
