import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ConnectionStatus, DashboardStateService, StatsSummary } from '../services/dashboard-state.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {
  stats$: Observable<StatsSummary | null> = this.dashboard.stats$;
  connectionStatus$: Observable<ConnectionStatus> = this.dashboard.connectionStatus$;
  isDarkMode = false;

  constructor(private dashboard: DashboardStateService) {}

  ionViewWillEnter() {
    this.dashboard.refreshAll().subscribe();
  }

  onRefresh() {
    this.dashboard.refreshAll().subscribe();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
  }
}
