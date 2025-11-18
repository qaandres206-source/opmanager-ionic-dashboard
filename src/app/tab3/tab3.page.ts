import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardStateService, StatsSummary } from '../services/dashboard-state.service';
import { HealthSummary } from '../services/opmanager-api.service';

@Component({
  selector: 'app-health',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  healthSummary$ = this.dashboard.healthSummary$;
  loading$ = this.dashboard.loading$;

  constructor(public dashboard: DashboardStateService) {}
}
