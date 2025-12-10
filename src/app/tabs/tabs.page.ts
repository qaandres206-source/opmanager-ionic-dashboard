import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ConnectionStatus, DashboardStateService, StatsSummary } from '../services/dashboard-state.service';

import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit {
  stats$: Observable<StatsSummary | null> = this.dashboard.stats$;
  connectionStatus$: Observable<ConnectionStatus> = this.dashboard.connectionStatus$;
  customers$ = this.dashboard.customers$;
  selectedCustomer$ = this.dashboard.selectedCustomer$;
  lastUpdated$ = this.dashboard.lastUpdated$;
  loading$ = this.dashboard.loading$;
  isDarkMode = false;
  showStats = true;

  constructor(
    private dashboard: DashboardStateService,
    private router: Router,
    private menuCtrl: MenuController
  ) { }

  async navigate(path: string) {
    await this.router.navigate([path]);
    await this.menuCtrl.close(); // Close explicitly or rely on ion-menu-toggle
  }

  ngOnInit() {
    // Detectar preferencia del sistema o localStorage
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = prefersDark.matches;
    }

    this.applyTheme();
  }

  ionViewWillEnter() {
    // Solo refrescar si hay API Key configurada
    if (this.dashboard.apiKey$.getValue()) {
      this.dashboard.refreshAll().subscribe();
    }
  }

  onRefresh() {
    // Solo refrescar si hay API Key configurada
    if (this.dashboard.apiKey$.getValue()) {
      this.dashboard.refreshAll().subscribe();
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  toggleStats() {
    this.showStats = !this.showStats;
  }

  onCustomerFilterChange(event: any) {
    const customerId = event.detail.value;
    this.dashboard.selectedCustomer$.next(customerId);
    // Refrescar datos con el nuevo filtro
    if (this.dashboard.apiKey$.getValue()) {
      this.dashboard.refreshAll().subscribe();
    }
  }

  clearAllFilters() {
    // Resetear el filtro de cliente a "Todos"
    this.dashboard.selectedCustomer$.next('-1');

    // Limpiar los datos actuales para forzar una búsqueda desde cero
    this.dashboard.devices$.next([]);
    this.dashboard.alerts$.next([]);
    this.dashboard.stats$.next(null);

    // Refrescar con todos los clientes
    if (this.dashboard.apiKey$.getValue()) {
      this.dashboard.refreshAll().subscribe();
    }
  }

  private applyTheme() {
    document.body.classList.toggle('dark', this.isDarkMode);
    // También aplicar a la etiqueta html para mejor compatibilidad
    document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode);
  }
}
