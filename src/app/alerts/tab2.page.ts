import { Component, OnDestroy } from '@angular/core';
import { DashboardStateService } from '../services/dashboard-state.service';
import { OpmanagerApiService } from '../services/opmanager-api.service';
import { OpManagerAlert } from '../core/models';
import { BehaviorSubject, Subscription, switchMap } from 'rxjs';
import { MenuController } from '@ionic/angular';

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

  // Input values for copy-paste functionality
  deviceInputValue: string = '';
  severityInputValue: string = '';
  categoryInputValue: string = '';

  // Derived filter options
  deviceOptions: string[] = [];
  severityOptions: string[] = [];
  categoryOptions: string[] = [];

  private subs: Subscription[] = [];
  // UI state for errors (e.g., CORS)
  errorMessage: string | null = null;
  
  // Expanded rows for text truncation
  expandedRows: Set<number> = new Set();

  constructor(public dashboard: DashboardStateService, private api: OpmanagerApiService, private menuCtrl: MenuController) {
    // Reload alarms whenever selected customer changes.
    // We now fetch ALL alarms for the customer and filter client-side.
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

          // Fetch ALL alarms for this customer (no backend filtering)
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

  async openFiltersMenu() {
    await this.menuCtrl.open('alerts-filters-menu');
  }

  async closeFiltersMenu() {
    await this.menuCtrl.close('alerts-filters-menu');
  }

  // Text truncation helpers
  isExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  toggleExpand(index: number) {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  hasLongContent(alert: OpManagerAlert): boolean {
    const name = (alert.displayName || alert.deviceName || '').toString();
    const message = (alert.message || '').toString();
    return name.length > 20 || message.length > 40;
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
    this.deviceInputValue = this.selectedDevice === 'all' ? '' : this.selectedDevice;
    this.applyClientFilters();
  }

  onDeviceInputChange(ev: any) {
    const value = ev.detail.value?.trim() || '';
    this.deviceInputValue = value;
    if (value === '') {
      this.selectedDevice = 'all';
    } else {
      this.selectedDevice = value;
    }
    this.applyClientFilters();
  }

  onSeverityChange(ev: CustomEvent) {
    this.selectedSeverity = ev.detail.value ?? 'all';
    this.severityInputValue = this.selectedSeverity === 'all' ? '' : this.selectedSeverity;
    this.applyClientFilters();
  }

  onSeverityInputChange(ev: any) {
    const value = ev.detail.value?.trim() || '';
    this.severityInputValue = value;
    if (value === '') {
      this.selectedSeverity = 'all';
    } else {
      this.selectedSeverity = value;
    }
    this.applyClientFilters();
  }

  onCategoryChange(ev: CustomEvent) {
    this.selectedCategory = ev.detail.value ?? 'all';
    this.categoryInputValue = this.selectedCategory === 'all' ? '' : this.selectedCategory;
    this.applyClientFilters();
  }

  onCategoryInputChange(ev: any) {
    const value = ev.detail.value?.trim() || '';
    this.categoryInputValue = value;
    if (value === '') {
      this.selectedCategory = 'all';
    } else {
      this.selectedCategory = value;
    }
    this.applyClientFilters();
  }

  onPeriodChange(ev: CustomEvent) {
    this.selectedPeriod = ev.detail.value ?? 'all';
    this.applyClientFilters();
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

  /** Build select options based on ALL alarms returned by the backend */
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

  /** Apply client side filters (status/severityString/category/period) over current alarms */
  private applyClientFilters() {
    this.filteredAlerts = this.alerts.filter((a) => {
      // Device Filter
      if (this.selectedDevice !== 'all') {
        const dName = (a.displayName || a.deviceName || '').trim().toLowerCase();
        const filterValue = this.selectedDevice.toLowerCase();

        // Partial match (contains)
        if (!dName.includes(filterValue)) {
          return false;
        }
      }

      // Severity Filter
      if (this.selectedSeverity !== 'all') {
        const sev = (a.severityString || a.severity || '').toString().trim().toLowerCase();
        const filterValue = this.selectedSeverity.toLowerCase();

        if (!sev.includes(filterValue)) {
          return false;
        }
      }

      // Category Filter
      if (this.selectedCategory !== 'all') {
        const cat = (a.category || '').toString().trim().toLowerCase();
        const filterValue = this.selectedCategory.toLowerCase();

        if (!cat.includes(filterValue)) {
          return false;
        }
      }

      // Period filter: filter by timestamp
      if (this.selectedPeriod !== 'all') {
        const hoursAgo = parseInt(this.selectedPeriod, 10);
        if (!isNaN(hoursAgo)) {
          const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
          // Try to get timestamp from various possible fields
          const timestamp = a['timestamp'] || a['time'] || a['createdTime'] || a['modifiedTime'];
          if (timestamp) {
            const alertTime = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
            if (alertTime < cutoffTime) {
              return false;
            }
          }
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
    } catch (_) { }
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
