import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
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
  saving = false;
  testing = false;

  constructor(
    private dashboard: DashboardStateService,
    private api: OpmanagerApiService,
    private toastCtrl: ToastController
  ) {
    this.apiKey = this.api.apiKey ?? '';
  }

  async onSaveApiKey() {
    this.saving = true;
    try {
      const key = this.apiKey.trim();
      this.dashboard.setApiKey(key || null);

      // Simulate a small delay for better UX or immediately test connection
      await new Promise(resolve => setTimeout(resolve, 500));

      const toast = await this.toastCtrl.create({
        message: 'API Key guardada correctamente',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } finally {
      this.saving = false;
    }
  }

  async onTestConnection() {
    this.testing = true;
    this.dashboard.authenticate().subscribe({
      next: async (success) => {
        this.testing = false;
        const toast = await this.toastCtrl.create({
          message: success ? 'Conexión exitosa' : 'Error al conectar. Verifica la API Key.',
          duration: 2000,
          color: success ? 'success' : 'danger',
          position: 'bottom'
        });
        await toast.present();
      },
      error: async () => {
        this.testing = false;
        const toast = await this.toastCtrl.create({
          message: 'Error de red al intentar conectar',
          duration: 2000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }

  onSaveSettings() {
    // For now we just keep refreshIntervalSeconds in the component; you can wire auto-refresh later.
  }
}
