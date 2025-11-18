import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { DashboardStateService } from '../services/dashboard-state.service';
import { OpmanagerApiService } from '../services/opmanager-api.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class SettingsPage {
  apiKey: string = '';
  refreshIntervalSeconds = 30;

  constructor(private dashboard: DashboardStateService, private api: OpmanagerApiService) {
    this.apiKey = this.api.apiKey ?? '';
  }

  onSaveApiKey() {
    const key = this.apiKey.trim();
    this.dashboard.setApiKey(key || null);
  }

  onTestConnection() {
    this.dashboard.authenticate().subscribe();
  }

  onSaveSettings() {
    // For now we just keep refreshIntervalSeconds in the component; you can wire auto-refresh later.
  }
}
