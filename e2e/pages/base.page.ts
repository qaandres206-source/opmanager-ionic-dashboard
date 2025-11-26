import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object Model
 * Contains common functionality shared across all pages
 */
export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Navigate to a specific path
     */
    async goto(path: string = '/') {
        await this.page.goto(path);
    }

    /**
     * Wait for the page to be fully loaded
     */
    async waitForLoad() {
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Get tab by name
     */
    getTab(tabName: string): Locator {
        return this.page.locator(`ion-tab-button[tab="${tabName}"]`);
    }

    /**
     * Navigate to a specific tab
     */
    async navigateToTab(tabName: string) {
        await this.getTab(tabName).click();
        await this.waitForLoad();
    }

    /**
     * Check if loading spinner is visible
     */
    async isLoading(): Promise<boolean> {
        const spinner = this.page.locator('ion-spinner');
        return await spinner.isVisible();
    }

    /**
     * Wait for loading to complete
     */
    async waitForLoadingComplete(timeout: number = 30000) {
        await this.page.waitForSelector('ion-spinner', { state: 'hidden', timeout });
    }
}
