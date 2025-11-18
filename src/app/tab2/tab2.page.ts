import { Component, OnDestroy } from '@angular/core';
import { DashboardStateService } from '../services/dashboard-state.service';
import { OpManagerAlert, OpmanagerApiService } from '../services/opmanager-api.service';
import { BehaviorSubject, Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-alerts',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnDestroy {
  alerts: OpManagerAlert[] = [];
  // local loading to avoid toggling global loading state
  localLoading$ = new BehaviorSubject<boolean>(false);
  pageSize = 100;
  currentPage = 1;
  private subs: Subscription[] = [];
  // UI state for errors (e.g., CORS)
  errorMessage: string | null = null;

  constructor(public dashboard: DashboardStateService, private api: OpmanagerApiService) {
    // When selected customer changes, load alarms once (no paging params sent)
    const s1 = this.dashboard.selectedCustomer$
      // implement switchMap-like behavior using RxJS to cancel previous in-flight
      .pipe(switchMap((sel) => {
        this.localLoading$.next(true);
        this.errorMessage = null;
        this.currentPage = 1;
        const params: Record<string, any> = {};
        if (sel && String(sel) !== '-1') params['selCustomerID'] = sel;
        return this.api.getAlarms(params);
      }))
      .subscribe({
        next: (rows) => {
          this.alerts = rows ?? [];
          this.localLoading$.next(false);
        },
        error: (err) => {
          console.error('Error loading alarms page', err);
          this.errorMessage = this.detectCorsError(err) ?
            'Error CORS: el servidor no permite solicitudes desde este origen. Usa un proxy en `ionic serve` o habilita CORS en el servidor.' :
            'Error cargando alertas';
          this.localLoading$.next(false);
        }
      });

    this.subs.push(s1 as Subscription);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.alerts.length / this.pageSize));
  }

  private detectCorsError(err: any) {
    try {
      if (err && err.status === 0) return true;
    } catch (_) {}
    return false;
  }

  // kept for compatibility; does nothing with virtual scroll
  loadMore() {
    // no-op
  }
}
