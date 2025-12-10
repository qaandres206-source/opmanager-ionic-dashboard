import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DashboardStateService } from '../services/dashboard-state.service';
import { OpmanagerApiService } from '../services/opmanager-api.service';
import { HealthSummary, OpManagerDevice } from '../core/models';
import { Logger } from '../core/utils/logger';

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
  ) { }

  ping(device: OpManagerDevice) {
    const name = (device.displayName || device.deviceName || device.name || '').trim();
    if (!name) {
      return;
    }
    this.api.postPingResponse(name).subscribe({
      next: (res) => {
        Logger.debug('Ping response for', name, res);
      },
      error: (err) => {
        Logger.error('Ping error for', name, err);
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
        Logger.debug('Trace response for', name, res);
      },
      error: (err) => {
        Logger.error('Trace error for', name, err);
      },
    });
  }

  exportToCsv() {
    const escape = (value: any): string => {
      const str = value == null ? '' : String(value);
      if (/[,;"\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows: string[] = [];

    // Export health summary
    this.healthSummary$.subscribe((health) => {
      if (health) {
        rows.push('Resumen de Salud');
        rows.push('Saludables;Advertencia;Críticos;Desconocidos');
        rows.push([
          health.healthy,
          health.warning,
          health.critical,
          health.unknown,
        ].map(escape).join(';'));
        rows.push('');
      }
    }).unsubscribe();

    // Export critical devices
    this.criticalDevices$.subscribe((devices) => {
      rows.push('Dispositivos Críticos');
      rows.push('Nombre;IP;Estado');
      devices.forEach((d) => {
        rows.push([
          d.displayName || d.deviceName || d.name || '',
          d.ipaddress || d['ip'] || '',
          d.statusStr || '',
        ].map(escape).join(';'));
      });
    }).unsubscribe();

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'opmanager_health_summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
