import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DashboardStateService } from '../services/dashboard-state.service';
import { HealthSummary, OpManagerDevice, OpmanagerApiService } from '../services/opmanager-api.service';

@Component({
  selector: 'app-health',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  healthSummary$ = this.dashboard.healthSummary$;
  loading$ = this.dashboard.loading$;
  criticalDevices$: Observable<OpManagerDevice[]> = this.dashboard.devices$.pipe(
    map((devices) =>
      devices.filter((d) => String(d['statusStr'] ?? '').toLowerCase() === 'critical')
    )
  );

  constructor(
    public dashboard: DashboardStateService,
    private api: OpmanagerApiService
  ) {}

  ping(device: OpManagerDevice) {
    const name = (device.displayName || device.deviceName || device.name || '').trim();
    if (!name) {
      return;
    }
    this.api.postPingResponse(name).subscribe({
      next: (res) => {
        // Por ahora solo registramos en consola; se puede cambiar a un toast más adelante.
        // eslint-disable-next-line no-console
        console.log('Ping response for', name, res);
      },
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error('Ping error for', name, err);
      },
    });
  }

  trace(device: OpManagerDevice) {
    const name = (device.displayName || device.deviceName || device.name || '').trim();
    if (!name) {
      return;
    }
    this.api.postTraceResponse(name).subscribe({
      next: (res) => {
        // eslint-disable-next-line no-console
        console.log('Trace response for', name, res);
      },
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error('Trace error for', name, err);
      },
    });
  }
}
