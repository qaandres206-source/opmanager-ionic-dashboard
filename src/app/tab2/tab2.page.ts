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
  /** All alarms returned by the backend for the current filter */
  alerts: OpManagerAlert[] = [];
  /** Alarms after applying client-side filters (device, severityString, category, period) */
  filteredAlerts: OpManagerAlert[] = [];

  // local loading to avoid toggling global loading state
  localLoading$ = new BehaviorSubject<boolean>(false);

  // Pagination for table view
  pageSize = 100;
  currentPage = 1;

  // Filter state
  selectedDevice: string = 'all';
  selectedSeverity: string = 'all';
  selectedCategory: string = 'all';
  selectedPeriod: string = 'all';

  // Derived filter options
  deviceOptions: string[] = [];
  severityOptions: string[] = [];
  categoryOptions: string[] = [];

  private subs: Subscription[] = [];
  // UI state for errors (e.g., CORS)
  errorMessage: string | null = null;

  constructor(public dashboard: DashboardStateService, private api: OpmanagerApiService) {
    // Reload alarms whenever selected customer or any filter that goes to backend changes.
    const s1 = this.dashboard.selectedCustomer$
      .pipe(
        switchMap((sel) => {
          this.localLoading$.next(true);
          this.errorMessage = null;
          this.currentPage = 1;

          const params: Record<string, any> = {};
          if (sel && String(sel) !== '-1') {
            params['selCustomerID'] = sel;
          }

          // Backend filters: severity, category, period, deviceName (optional)
          if (this.selectedSeverity !== 'all') {
            params['severity'] = this.selectedSeverity;
          }
          if (this.selectedCategory !== 'all') {
            params['category'] = this.selectedCategory;
          }
          if (this.selectedPeriod !== 'all') {
            params['period'] = this.selectedPeriod;
          }
          if (this.selectedDevice !== 'all') {
            params['deviceName'] = this.selectedDevice;
          }

          return this.api.getAlarms(params);
        })
      )
      .subscribe({
        next: (rows) => {
          this.alerts = rows ?? [];
          this.buildFilterOptions();
          this.applyClientFilters();
          this.localLoading$.next(false);
        },
        error: (err) => {
          console.error('Error loading alarms page', err);
          this.errorMessage = this.detectCorsError(err)
            ? 'Error CORS: el servidor no permite solicitudes desde este origen. Usa un proxy en `ionic serve` o habilita CORS en el servidor.'
            : 'Error cargando alarmas';
          this.localLoading$.next(false);
        },
      });

    this.subs.push(s1 as Subscription);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  /** Total pages for current filtered results */
  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredAlerts.length / this.pageSize));
  }

  /** Current page slice for table */
  get pagedAlerts(): OpManagerAlert[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAlerts.slice(start, start + this.pageSize);
  }

  onDeviceChange(ev: CustomEvent) {
    this.selectedDevice = ev.detail.value ?? 'all';
    this.reloadFromBackend();
  }

  onSeverityChange(ev: CustomEvent) {
    this.selectedSeverity = ev.detail.value ?? 'all';
    this.reloadFromBackend();
  }

  onCategoryChange(ev: CustomEvent) {
    this.selectedCategory = ev.detail.value ?? 'all';
    this.reloadFromBackend();
  }

  onPeriodChange(ev: CustomEvent) {
    this.selectedPeriod = ev.detail.value ?? 'all';
    this.reloadFromBackend();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /** Build select options based on the alarms returned by the backend */
  private buildFilterOptions() {
    const devices = new Set<string>();
    const severities = new Set<string>();
    const categories = new Set<string>();

    this.alerts.forEach((a) => {
      const dName = (a.displayName || a.deviceName || '').trim();
      if (dName) {
        devices.add(dName);
      }
      const sev = (a.severityString || a.severity || '').toString().trim();
      if (sev) {
        severities.add(sev);
      }
      const cat = (a.category || '').toString().trim();
      if (cat) {
        categories.add(cat);
      }
    });

    this.deviceOptions = Array.from(devices).sort();
    this.severityOptions = Array.from(severities).sort();
    this.categoryOptions = Array.from(categories).sort();
  }

  /** Apply client side filters (status/severityString/category) over current alarms */
  private applyClientFilters() {
    this.filteredAlerts = this.alerts.filter((a) => {
      if (this.selectedDevice !== 'all') {
        const dName = (a.displayName || a.deviceName || '').trim();
        if (dName !== this.selectedDevice) {
          return false;
        }
      }

      if (this.selectedSeverity !== 'all') {
        const sev = (a.severityString || a.severity || '').toString().trim();
        if (sev !== this.selectedSeverity) {
          return false;
        }
      }

      if (this.selectedCategory !== 'all') {
        const cat = (a.category || '').toString().trim();
        if (cat !== this.selectedCategory) {
          return false;
        }
      }

      return true;
    });

    this.currentPage = 1;
  }

  private reloadFromBackend() {
    // Force a new emission by reusing the current selectedCustomer value
    const current = this.dashboard.selectedCustomer$.getValue();
    this.dashboard.selectedCustomer$.next(current);
  }

  private detectCorsError(err: any) {
    try {
      if (err && err.status === 0) return true;
    } catch (_) {}
    return false;
  }

  /** Export current filtered alarms to CSV so Excel can open it. */
  exportToCsv() {
    if (!this.filteredAlerts.length) {
      return;
    }

    const escape = (value: any): string => {
      const str = value == null ? '' : String(value);
      if (/[,;"\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows: string[] = [];

    // Header row
    rows.push('severityString;severity;displayName;deviceName;ipaddress;status;category;message');

    this.filteredAlerts.forEach((a) => {
      const ip = a.ipaddress || (a as any).ipAddress || '';
      rows.push([
        a.severityString ?? '',
        a.severity ?? '',
        a.displayName ?? '',
        a.deviceName ?? '',
        ip,
        a.status ?? '',
        a.category ?? '',
        a.message ?? '',
      ].map(escape).join(';'));
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'opmanager_alarms.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
