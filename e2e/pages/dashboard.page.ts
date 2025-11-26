import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Dashboard Page Object Model
 * Handles interactions with the main dashboard tabs
 */
export class DashboardPage extends BasePage {
    // Tab selectors
    readonly devicesTab: Locator;
    readonly alertsTab: Locator;
    readonly healthTab: Locator;

    // Device list elements
    readonly deviceList: Locator;
    readonly deviceItems: Locator;

    // Alert list elements
    readonly alertList: Locator;
    readonly alertItems: Locator;

    // Health summary elements
    readonly healthSummary: Locator;

    constructor(page: Page) {
        super(page);

        // Tabs
        this.devicesTab = this.getTab('tab1');
        this.alertsTab = this.getTab('tab2');
        this.healthTab = this.getTab('tab3');

        // Device list
        this.deviceList = page.locator('app-tab1');
        this.deviceItems = page.locator('ion-item').filter({ hasText: /IP:|Categoría:/ });

        // Alert list
        this.alertList = page.locator('app-tab2');
        this.alertItems = page.locator('cdk-virtual-scroll-viewport ion-item');

        // Health summary
        this.healthSummary = page.locator('app-tab3');
    }

    /**
     * Navigate to devices tab
     */
    async goToDevices() {
        await this.navigateToTab('tab1');
    }

    /**
     * Navigate to alerts tab
     */
    async goToAlerts() {
        await this.navigateToTab('tab2');
    }

    /**
     * Navigate to health tab
     */
    async goToHealth() {
        await this.navigateToTab('tab3');
    }

    /**
     * Get count of visible devices
     */
    async getDeviceCount(): Promise<number> {
        return await this.deviceItems.count();
    }

    /**
     * Get count of visible alerts
     */
    async getAlertCount(): Promise<number> {
        return await this.alertItems.count();
    }

    /**
     * Search for a device by name
     */
    async searchDevice(deviceName: string) {
        const searchInput = this.page.locator('ion-searchbar input');
        await searchInput.fill(deviceName);
    }

    /**
     * Filter devices by category
     */
    async filterByCategory(category: string) {
        const categoryFilter = this.page.locator(`ion-button:has-text("${category}")`);
        await categoryFilter.click();
    }
}
