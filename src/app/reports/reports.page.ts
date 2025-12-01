import { Component, OnInit } from '@angular/core';
import { ReportsService } from '../services/reports.service';
import { DashboardStateService } from '../services/dashboard-state.service';
import {
  ReportConfig,
  ReportType,
  ReportFormat,
  GeneratedReport,
  DateRange,
} from '../core/models';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: false,
})
export class ReportsPage implements OnInit {
  // Report configuration
  reportName: string = '';
  selectedReportType: ReportType = 'availability';
  selectedCustomers: string[] = [];
  selectedDatePreset: string = 'last-7d';
  customStartDate: string = '';
  customEndDate: string = '';
  includeGraphs: boolean = false;
  groupBy: 'customer' | 'device' | 'category' | 'none' = 'customer';

  // UI state
  generating$ = new BehaviorSubject<boolean>(false);
  currentReport$ = new BehaviorSubject<GeneratedReport | null>(null);
  savedConfigs: ReportConfig[] = [];
  reportHistory: GeneratedReport[] = [];

  // Available options
  customers$ = this.dashboard.customers$;
  reportTypes: { value: ReportType; label: string; description: string }[] = [
    {
      value: 'availability',
      label: 'Disponibilidad',
      description: 'Uptime, downtime, SLA y MTTR por cliente y dispositivo',
    },
    {
      value: 'performance',
      label: 'Performance',
      description: 'CPU, memoria, health score y métricas de rendimiento',
    },
    {
      value: 'alert-trends',
      label: 'Tendencias de Alertas',
      description: 'Distribución, tendencias y top dispositivos por alertas',
    },
  ];

  datePresets: { value: string; label: string }[] = [
    { value: 'last-24h', label: 'Últimas 24 horas' },
    { value: 'last-7d', label: 'Últimos 7 días' },
    { value: 'last-30d', label: 'Últimos 30 días' },
    { value: 'last-90d', label: 'Últimos 90 días' },
    { value: 'custom', label: 'Personalizado' },
  ];

  constructor(
    private reportsService: ReportsService,
    private dashboard: DashboardStateService
  ) { }

  ngOnInit() {
    this.loadSavedConfigs();
    this.loadReportHistory();
    this.setDefaultDates();
  }

  /**
   * Generate report based on current configuration
   */
  generateReport() {
    if (!this.reportName.trim()) {
      this.reportName = `Reporte ${this.getReportTypeLabel(this.selectedReportType)} - ${new Date().toLocaleDateString()}`;
    }

    const config: ReportConfig = {
      name: this.reportName,
      type: this.selectedReportType,
      parameters: {
        customerIds: this.selectedCustomers.length > 0 ? this.selectedCustomers : undefined,
        dateRange: this.getDateRange(),
        includeGraphs: this.includeGraphs,
        groupBy: this.groupBy,
      },
    };

    this.generating$.next(true);
    this.reportsService.generateReport(config).subscribe({
      next: (report) => {
        this.currentReport$.next(report);
        this.reportsService.saveGeneratedReport(report);
        this.loadReportHistory();
        this.generating$.next(false);
      },
      error: (err) => {
        console.error('Error generating report:', err);
        this.generating$.next(false);
      },
    });
  }

  /**
   * Export current report
   */
  exportReport(format: ReportFormat) {
    const report = this.currentReport$.value;
    if (!report) return;
    this.reportsService.exportReport(report, format);
  }

  /**
   * Save current configuration
   */
  saveConfiguration() {
    const config: ReportConfig = {
      name: this.reportName || `Config ${this.selectedReportType}`,
      type: this.selectedReportType,
      parameters: {
        customerIds: this.selectedCustomers,
        dateRange: this.getDateRange(),
        includeGraphs: this.includeGraphs,
        groupBy: this.groupBy,
      },
    };

    this.reportsService.saveReportConfig(config);
    this.loadSavedConfigs();
  }

  /**
   * Load a saved configuration
   */
  loadConfiguration(config: ReportConfig) {
    this.reportName = config.name;
    this.selectedReportType = config.type;
    this.selectedCustomers = config.parameters.customerIds || [];
    this.includeGraphs = config.parameters.includeGraphs || false;
    this.groupBy = config.parameters.groupBy || 'customer';

    // Set dates from config
    if (config.parameters.dateRange.preset) {
      this.selectedDatePreset = config.parameters.dateRange.preset;
    } else {
      this.selectedDatePreset = 'custom';
      this.customStartDate = this.formatDateForInput(config.parameters.dateRange.start);
      this.customEndDate = this.formatDateForInput(config.parameters.dateRange.end);
    }
  }

  /**
   * Delete a saved configuration
   */
  deleteConfiguration(config: ReportConfig) {
    if (config.id) {
      this.reportsService.deleteReportConfig(config.id);
      this.loadSavedConfigs();
    }
  }

  /**
   * Load a report from history
   */
  loadHistoryReport(report: GeneratedReport) {
    this.currentReport$.next(report);
  }

  /**
   * Clear report history
   */
  clearHistory() {
    this.reportsService.clearReportHistory();
    this.loadReportHistory();
  }

  // Helper methods
  private loadSavedConfigs() {
    this.savedConfigs = this.reportsService.getReportConfigs();
  }

  private loadReportHistory() {
    this.reportHistory = this.reportsService.getGeneratedReports();
  }

  private getDateRange(): DateRange {
    if (this.selectedDatePreset === 'custom') {
      return {
        start: new Date(this.customStartDate),
        end: new Date(this.customEndDate),
        preset: 'custom',
      };
    }

    const end = new Date();
    let start = new Date();

    switch (this.selectedDatePreset) {
      case 'last-24h':
        start.setHours(start.getHours() - 24);
        break;
      case 'last-7d':
        start.setDate(start.getDate() - 7);
        break;
      case 'last-30d':
        start.setDate(start.getDate() - 30);
        break;
      case 'last-90d':
        start.setDate(start.getDate() - 90);
        break;
    }

    return {
      start,
      end,
      preset: this.selectedDatePreset as any,
    };
  }

  private setDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    this.customStartDate = this.formatDateForInput(start);
    this.customEndDate = this.formatDateForInput(end);
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getReportTypeLabel(type: ReportType): string {
    const found = this.reportTypes.find((t) => t.value === type);
    return found?.label || type;
  }

  get currentReportTypeDescription(): string {
    const found = this.reportTypes.find((t) => t.value === this.selectedReportType);
    return found?.description || '';
  }

  get isCustomDateRange(): boolean {
    return this.selectedDatePreset === 'custom';
  }

  get canGenerate(): boolean {
    if (this.isCustomDateRange) {
      return !!this.customStartDate && !!this.customEndDate;
    }
    return true;
  }
}
