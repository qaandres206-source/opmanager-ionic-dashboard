import { Component } from '@angular/core';
import { DashboardStateService } from '../services/dashboard-state.service';
import { OpmanagerApiService } from '../services/opmanager-api.service';
import { OpManagerDevice } from '../core/models';

@Component({
  selector: 'app-devices',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  devices: OpManagerDevice[] = [];
  filteredDevices: OpManagerDevice[] = [];
  // Pagination state for devices
  pageSize = 50;
  currentPage = 1;
  loading = false;

  selectedCustomer: string = 'all';
  selectedType: string = 'all';
  selectedStatus: string = 'all';

  // Input values for copy-paste functionality
  typeInputValue: string = '';
  statusInputValue: string = '';

  constructor(public dashboard: DashboardStateService, private api: OpmanagerApiService) {
    this.dashboard.devices$.subscribe((devices) => {
      this.devices = devices;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredDevices = this.devices.filter((d) => {
      const type = this.selectedType;
      const status = this.selectedStatus;

      // Nota: el filtrado por cliente se hace desde el backend usando selCustomerID,
      // así que aquí solo filtramos por tipo y estado para no descartar resultados válidos.
      if (type !== 'all') {
        const cat = String(d['category'] ?? '').toLowerCase();
        if (cat !== type.toLowerCase()) return false;
      }
      if (status !== 'all') {
        const st = String(d['statusStr'] ?? '').toLowerCase();
        if (st !== status.toLowerCase()) return false;
      }
      return true;
    });
    // reset page when filters change
    this.currentPage = 1;
  }

  onCustomerChange(ev: CustomEvent) {
    // Normalizamos siempre a string para que los filtros y las comparaciones funcionen bien
    this.selectedCustomer = String(ev.detail.value ?? 'all');

    // Actualizar filtro global de cliente y refrescar datos
    const cid = this.selectedCustomer === 'all' ? '-1' : this.selectedCustomer;
    this.dashboard.selectedCustomer$.next(cid);
    this.loading = true;

    this.dashboard.refreshAll().subscribe({
      next: () => (this.loading = false),
      error: () => (this.loading = false),
    });
  }

  onTypeChange(ev: CustomEvent) {
    this.selectedType = ev.detail.value;
    this.typeInputValue = this.selectedType === 'all' ? '' : this.selectedType;
    this.applyFilters();
  }

  onTypeInputChange(ev: any) {
    const value = ev.detail.value?.trim() || '';
    this.typeInputValue = value;
    if (value === '') {
      this.selectedType = 'all';
    } else {
      this.selectedType = value;
    }
    this.applyFilters();
  }

  onStatusChange(ev: CustomEvent) {
    this.selectedStatus = ev.detail.value;
    this.statusInputValue = this.selectedStatus === 'all' ? '' : this.selectedStatus;
    this.applyFilters();
  }

  onStatusInputChange(ev: any) {
    const value = ev.detail.value?.trim() || '';
    this.statusInputValue = value;
    if (value === '') {
      this.selectedStatus = 'all';
    } else {
      this.selectedStatus = value;
    }
    this.applyFilters();
  }

  exportToCsv() {
    if (!this.filteredDevices.length) {
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
    rows.push('Nombre;IP;Estado;Salud;Tipo;Última Actualización');

    this.filteredDevices.forEach((d) => {
      rows.push([
        d.displayName || d.deviceName || d['name'] || '',
        d.ipaddress || d['ip'] || '',
        d.statusStr || '',
        d.statusStr || '',
        d.category || d.type || '',
        d.prettyTime || d.addedTime || '',
      ].map(escape).join(';'));
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'opmanager_devices.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Pagination helpers
  get totalDevicePages() {
    return Math.max(1, Math.ceil(this.filteredDevices.length / this.pageSize));
  }

  get pagedDevices() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDevices.slice(start, start + this.pageSize).map(d => ({ ...d }));
  }

  nextDevicePage() {
    if (this.currentPage < this.totalDevicePages) this.currentPage++;
  }

  prevDevicePage() {
    if (this.currentPage > 1) this.currentPage--;
  }
}
