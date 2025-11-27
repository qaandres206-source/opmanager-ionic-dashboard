import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, of, switchMap, tap, Observable } from 'rxjs';
import { DashboardData, HealthSummary, OpManagerAlert, OpManagerDevice } from '../core/models';
import { OpmanagerApiService } from './opmanager-api.service';

export interface ConnectionStatus {
  text: string;
  color: 'success' | 'warning' | 'danger' | 'medium';
}

export interface StatsSummary {
  totalDevices: number;
  activeAlerts: number;
  healthyDevices: number;
  criticalDevices: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  readonly apiKey$ = new BehaviorSubject<string | null>(null);

  readonly connectionStatus$ = new BehaviorSubject<ConnectionStatus>({
    text: 'Sin API Key',
    color: 'warning',
  });

  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly lastUpdated$ = new BehaviorSubject<Date | null>(null);

  readonly devices$ = new BehaviorSubject<OpManagerDevice[]>([]);
  readonly alerts$ = new BehaviorSubject<OpManagerAlert[]>([]);
  readonly customers$ = new BehaviorSubject<any[]>([]);
  readonly selectedCustomer$ = new BehaviorSubject<string | number>('-1');
  readonly healthSummary$ = new BehaviorSubject<HealthSummary | null>(null);
  readonly stats$ = new BehaviorSubject<StatsSummary | null>(null);

  constructor(private api: OpmanagerApiService) {
    // Initialize API key from storage
    this.apiKey$.next(this.api.apiKey);
    this.updateConnectionStatus();
  }

  setApiKey(key: string | null) {
    this.api.apiKey = key;
    this.apiKey$.next(key);
    this.updateConnectionStatus();
  }

  authenticate() {
    this.loading$.next(true);
    return this.api.authenticate().pipe(
      tap((ok) => {
        if (!this.api.apiKey) {
          this.connectionStatus$.next({ text: 'Sin API Key', color: 'warning' });
        } else if (ok) {
          this.connectionStatus$.next({ text: 'Conectado', color: 'success' });
        } else {
          this.connectionStatus$.next({ text: 'Desconectado', color: 'danger' });
        }
        this.loading$.next(false);
      })
    );
  }

  refreshAll(): Observable<any> {
    const selCustomer = this.selectedCustomer$.getValue();
    if (!this.api.apiKey) {
      return of(null);
    }
    this.loading$.next(true);

    const params = {} as Record<string, any>;
    if (selCustomer && String(selCustomer) !== '-1') {
      params['selCustomerID'] = selCustomer;
    }
    const dashboard$ = this.api.getDashboardData(params);
    const health$ = this.api.getHealthSummary();
    const customers$ = this.api.getCustomers();
    const alerts$ = this.api.getAlarms(params);

    return combineLatest([dashboard$, health$, customers$, alerts$]).pipe(
      tap(([dashboard, health, customers, alerts]) => {
        this.devices$.next(dashboard.devices ?? []);
        this.alerts$.next(alerts ?? dashboard.recent_alerts ?? []);
        this.customers$.next(customers ?? []);
        this.healthSummary$.next(health);

        const stats: StatsSummary = {
          totalDevices: dashboard.total_devices ?? 0,
          activeAlerts: dashboard.active_alerts ?? 0,
          healthyDevices: health.healthy ?? 0,
          criticalDevices: health.critical ?? 0,
        };
        this.stats$.next(stats);

        this.lastUpdated$.next(new Date());
        this.loading$.next(false);
      })
    );
  }

  private updateConnectionStatus() {
    if (!this.api.apiKey) {
      this.connectionStatus$.next({ text: 'Sin API Key', color: 'warning' });
    } else {
      // Optimistically assume connected until authenticate() says otherwise
      this.connectionStatus$.next({ text: 'Desconocido', color: 'medium' });
    }
  }
}
