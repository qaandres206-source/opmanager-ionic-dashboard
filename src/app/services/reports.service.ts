import { Injectable } from '@angular/core';
import { Observable, of, forkJoin, map } from 'rxjs';
import { OpmanagerApiService } from './opmanager-api.service';
import {
    ReportConfig,
    GeneratedReport,
    ReportType,
    AvailabilityReportData,
    PerformanceReportData,
    AlertTrendReportData,
    CustomerAvailability,
    DeviceAvailability,
    DevicePerformance,
    AlertTrend,
    ReportFormat,
    AvailabilityIncident,
    MetricStats,
    AlertDistribution,
    TopAlertDevice,
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
    private readonly STORAGE_KEY = 'opmanager_reports';
    private readonly CONFIG_STORAGE_KEY = 'opmanager_report_configs';

    constructor(private api: OpmanagerApiService) { }

    /**
     * Generate a report based on configuration
     */
    generateReport(config: ReportConfig): Observable<GeneratedReport> {
        switch (config.type) {
            case 'availability':
                return this.generateAvailabilityReport(config);
            case 'performance':
                return this.generatePerformanceReport(config);
            case 'alert-trends':
                return this.generateAlertTrendReport(config);
            default:
                return of(this.createEmptyReport(config));
        }
    }

    /**
     * Generate availability report
     */
    private generateAvailabilityReport(config: ReportConfig): Observable<GeneratedReport> {
        const params: Record<string, any> = {};
        if (config.parameters.customerIds?.length) {
            params['selCustomerID'] = config.parameters.customerIds[0];
        }

        return forkJoin({
            devices: this.api.getDevices(params),
            alarms: this.api.getAlarms(params),
            customers: this.api.getCustomers(),
        }).pipe(
            map(({ devices, alarms, customers }) => {
                const customerMap = new Map(customers.map((c) => [c['customerId'] || c['id'], c['customerName'] || c['name']]));

                // Group devices by customer
                const devicesByCustomer = new Map<string, any[]>();
                devices.forEach((device) => {
                    const custId = device['customerId'] || device['customerID'] || 'unknown';
                    if (!devicesByCustomer.has(custId)) {
                        devicesByCustomer.set(custId, []);
                    }
                    devicesByCustomer.get(custId)!.push(device);
                });

                const customerAvailabilities: CustomerAvailability[] = [];
                let totalUptime = 0;
                let totalDevices = 0;
                let totalIncidents = 0;
                let totalDowntime = 0;

                devicesByCustomer.forEach((custDevices, custId) => {
                    const deviceAvailabilities: DeviceAvailability[] = custDevices.map((device) => {
                        // Calculate uptime based on device status
                        const status = String(device.statusStr || '').toLowerCase();
                        const uptime = status === 'clear' || status === 'up' ? 99.9 : status === 'down' ? 0 : 95.0;

                        // Get incidents from alarms for this device
                        const deviceAlarms = alarms.filter(
                            (a) => a.deviceName === device.deviceName || a.displayName === device.displayName
                        );

                        const incidents: AvailabilityIncident[] = deviceAlarms.map((alarm) => ({
                            startTime: new Date(alarm['createdTime'] || alarm['time'] || Date.now()),
                            endTime: alarm['clearedTime'] ? new Date(alarm['clearedTime']) : undefined,
                            duration: alarm['duration'] || 0,
                            reason: alarm.message || alarm.category,
                            severity: String(alarm.severityString || alarm.severity || 'unknown'),
                        }));

                        const downtime = incidents.reduce((sum, inc) => sum + inc.duration, 0);

                        return {
                            deviceId: device['deviceId'] || device['id'],
                            deviceName: device.deviceName || '',
                            displayName: device.displayName,
                            ipAddress: device.ipaddress || device.ip,
                            category: device.category,
                            uptime,
                            downtime,
                            incidents,
                            sla: {
                                target: 99.5,
                                actual: uptime,
                                met: uptime >= 99.5,
                            },
                        };
                    });

                    const avgUptime = deviceAvailabilities.reduce((sum, d) => sum + d.uptime, 0) / deviceAvailabilities.length || 0;
                    const totalCustDowntime = deviceAvailabilities.reduce((sum, d) => sum + d.downtime, 0);
                    const totalCustIncidents = deviceAvailabilities.reduce((sum, d) => sum + d.incidents.length, 0);
                    const mttr = totalCustIncidents > 0 ? totalCustDowntime / totalCustIncidents : 0;

                    customerAvailabilities.push({
                        customerId: custId,
                        customerName: customerMap.get(custId) || custId,
                        devices: deviceAvailabilities,
                        summary: {
                            totalDevices: deviceAvailabilities.length,
                            averageUptime: avgUptime,
                            totalDowntime: totalCustDowntime,
                            incidents: totalCustIncidents,
                            mttr,
                        },
                    });

                    totalUptime += avgUptime * deviceAvailabilities.length;
                    totalDevices += deviceAvailabilities.length;
                    totalIncidents += totalCustIncidents;
                    totalDowntime += totalCustDowntime;
                });

                const data: AvailabilityReportData = {
                    period: config.parameters.dateRange,
                    customers: customerAvailabilities,
                    overall: {
                        totalDevices,
                        averageUptime: totalDevices > 0 ? totalUptime / totalDevices : 0,
                        totalIncidents,
                        averageMTTR: totalIncidents > 0 ? totalDowntime / totalIncidents : 0,
                        slaCompliance: customerAvailabilities.reduce(
                            (sum, c) => sum + c.devices.filter((d) => d.sla.met).length,
                            0
                        ) / totalDevices * 100 || 0,
                    },
                };

                return {
                    id: this.generateId(),
                    configId: config.id,
                    name: config.name,
                    type: 'availability',
                    generatedAt: new Date(),
                    parameters: config.parameters,
                    data,
                    summary: {
                        totalDevices,
                        averageUptime: data.overall.averageUptime,
                        criticalIssues: alarms.filter((a) => a.severityString === 'Critical').length,
                        warnings: alarms.filter((a) => a.severityString === 'Warning').length,
                    },
                };
            })
        );
    }

    /**
     * Generate performance report
     */
    private generatePerformanceReport(config: ReportConfig): Observable<GeneratedReport> {
        const params: Record<string, any> = {};
        if (config.parameters.customerIds?.length) {
            params['selCustomerID'] = config.parameters.customerIds[0];
        }

        return forkJoin({
            devices: this.api.getDevices(params),
            alarms: this.api.getAlarms(params),
        }).pipe(
            map(({ devices, alarms }) => {
                const devicePerformances: DevicePerformance[] = devices.map((device) => {
                    // Calculate health score based on status and alerts
                    const status = String(device.statusStr || '').toLowerCase();
                    const deviceAlarms = alarms.filter(
                        (a) => a.deviceName === device.deviceName || a.displayName === device.displayName
                    );

                    let healthScore = 100;
                    if (status === 'critical' || status === 'down') healthScore = 20;
                    else if (status === 'warning' || status === 'minor') healthScore = 60;
                    else if (status === 'clear' || status === 'up') healthScore = 95;

                    // Reduce health score based on alarms
                    healthScore -= Math.min(deviceAlarms.length * 5, 30);
                    healthScore = Math.max(0, Math.min(100, healthScore));

                    // Mock metrics (in real scenario, fetch from monitors)
                    const metrics = {
                        cpu: this.createMockMetric(45, 80, '%'),
                        memory: this.createMockMetric(62, 85, '%'),
                        responseTime: this.createMockMetric(25, 100, 'ms'),
                    };

                    return {
                        deviceId: device['deviceId'] || device['id'] || '',
                        deviceName: device.deviceName || 'Unknown',
                        displayName: device.displayName,
                        ipAddress: device.ipaddress || device.ip || '',
                        category: device.category,
                        metrics,
                        healthScore,
                        alerts: deviceAlarms.length,
                    };
                });

                // Sort by health score to get top devices
                const sortedByCpu = [...devicePerformances].sort((a, b) => (b.metrics.cpu?.current || 0) - (a.metrics.cpu?.current || 0));
                const sortedByMemory = [...devicePerformances].sort((a, b) => (b.metrics.memory?.current || 0) - (a.metrics.memory?.current || 0));

                const data: PerformanceReportData = {
                    period: config.parameters.dateRange,
                    devices: devicePerformances,
                    summary: {
                        totalDevices: devicePerformances.length,
                        averageHealthScore: devicePerformances.reduce((sum, d) => sum + d.healthScore, 0) / devicePerformances.length || 0,
                        devicesAboveThreshold: devicePerformances.filter((d) => d.healthScore < 70).length,
                        topCpuDevices: sortedByCpu.slice(0, 5).map((d) => ({
                            deviceName: d.displayName || d.deviceName,
                            value: d.metrics.cpu?.current || 0,
                            unit: '%',
                        })),
                        topMemoryDevices: sortedByMemory.slice(0, 5).map((d) => ({
                            deviceName: d.displayName || d.deviceName,
                            value: d.metrics.memory?.current || 0,
                            unit: '%',
                        })),
                        topBandwidthDevices: [],
                    },
                };

                return {
                    id: this.generateId(),
                    configId: config.id,
                    name: config.name,
                    type: 'performance',
                    generatedAt: new Date(),
                    parameters: config.parameters,
                    data,
                    summary: {
                        totalDevices: devicePerformances.length,
                        averageResponseTime: 25,
                        criticalIssues: devicePerformances.filter((d) => d.healthScore < 50).length,
                        warnings: devicePerformances.filter((d) => d.healthScore >= 50 && d.healthScore < 70).length,
                    },
                };
            })
        );
    }

    /**
     * Generate alert trend report
     */
    private generateAlertTrendReport(config: ReportConfig): Observable<GeneratedReport> {
        const params: Record<string, any> = {};
        if (config.parameters.customerIds?.length) {
            params['selCustomerID'] = config.parameters.customerIds[0];
        }

        return this.api.getAlarms(params).pipe(
            map((alarms) => {
                // Group alarms by date
                const alarmsByDate = new Map<string, any[]>();
                const severityCount: Record<string, number> = {};
                const categoryCount: Record<string, number> = {};
                const deviceCount: Record<string, number> = {};

                alarms.forEach((alarm) => {
                    const date = new Date(alarm['createdTime'] || alarm['time'] || Date.now());
                    const dateKey = date.toISOString().split('T')[0];

                    if (!alarmsByDate.has(dateKey)) {
                        alarmsByDate.set(dateKey, []);
                    }
                    alarmsByDate.get(dateKey)!.push(alarm);

                    // Count by severity
                    const severity = String(alarm.severityString || alarm.severity || 'unknown').toLowerCase();
                    severityCount[severity] = (severityCount[severity] || 0) + 1;

                    // Count by category
                    const category = String(alarm.category || 'unknown');
                    categoryCount[category] = (categoryCount[category] || 0) + 1;

                    // Count by device
                    const deviceName = alarm.displayName || alarm.deviceName || 'unknown';
                    deviceCount[deviceName] = (deviceCount[deviceName] || 0) + 1;
                });

                // Create trends
                const trends: AlertTrend[] = [];
                alarmsByDate.forEach((dayAlarms, dateKey) => {
                    const bySeverity = {
                        critical: dayAlarms.filter((a) => String(a.severityString || '').toLowerCase() === 'critical').length,
                        major: dayAlarms.filter((a) => String(a.severityString || '').toLowerCase() === 'major').length,
                        minor: dayAlarms.filter((a) => String(a.severityString || '').toLowerCase() === 'minor').length,
                        warning: dayAlarms.filter((a) => String(a.severityString || '').toLowerCase() === 'warning').length,
                        info: dayAlarms.filter((a) => String(a.severityString || '').toLowerCase() === 'info').length,
                    };

                    const byCategory: Record<string, number> = {};
                    dayAlarms.forEach((a) => {
                        const cat = String(a.category || 'unknown');
                        byCategory[cat] = (byCategory[cat] || 0) + 1;
                    });

                    trends.push({
                        date: new Date(dateKey),
                        total: dayAlarms.length,
                        bySeverity,
                        byCategory,
                    });
                });

                // Get top devices by alert count
                const topDevices: TopAlertDevice[] = Object.entries(deviceCount)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([deviceName, count]) => {
                        const deviceAlarms = alarms.filter((a) => (a.displayName || a.deviceName) === deviceName);
                        return {
                            deviceId: deviceAlarms[0]?.['deviceId'] || '',
                            deviceName,
                            displayName: deviceName,
                            alertCount: count,
                            criticalCount: deviceAlarms.filter((a) => String(a.severityString || '').toLowerCase() === 'critical').length,
                            categories: [...new Set(deviceAlarms.map((a) => a.category || 'unknown'))],
                        };
                    });

                const distribution: AlertDistribution = {
                    bySeverity: severityCount,
                    byCategory: categoryCount,
                    byCustomer: {},
                    byDevice: deviceCount,
                };

                const totalAlerts = alarms.length;
                const criticalAlerts = severityCount['critical'] || 0;
                const daysInPeriod = Math.max(1, alarmsByDate.size);

                const data: AlertTrendReportData = {
                    period: config.parameters.dateRange,
                    trends: trends.sort((a, b) => a.date.getTime() - b.date.getTime()),
                    distribution,
                    topDevices,
                    summary: {
                        totalAlerts,
                        averagePerDay: totalAlerts / daysInPeriod,
                        criticalAlerts,
                        resolvedAlerts: alarms.filter((a) => a.status === 'cleared' || a['clearedTime']).length,
                        averageResolutionTime: 45, // Mock value
                        trendDirection: 'stable',
                        percentageChange: 0,
                    },
                };

                return {
                    id: this.generateId(),
                    configId: config.id,
                    name: config.name,
                    type: 'alert-trends',
                    generatedAt: new Date(),
                    parameters: config.parameters,
                    data,
                    summary: {
                        totalDevices: topDevices.length,
                        totalAlerts,
                        criticalIssues: criticalAlerts,
                        warnings: severityCount['warning'] || 0,
                    },
                };
            })
        );
    }

    /**
     * Export report to specified format
     */
    exportReport(report: GeneratedReport, format: ReportFormat): void {
        switch (format) {
            case 'csv':
                this.exportToCsv(report);
                break;
            case 'json':
                this.exportToJson(report);
                break;
            case 'pdf':
                // PDF export would require jspdf library
                console.warn('PDF export not yet implemented');
                break;
        }
    }

    /**
     * Export report to CSV
     */
    private exportToCsv(report: GeneratedReport): void {
        const escape = (value: any): string => {
            const str = value == null ? '' : String(value);
            if (/[,;"\\n]/.test(str)) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        const rows: string[] = [];

        // Header
        rows.push(`Reporte: ${report.name}`);
        rows.push(`Tipo: ${report.type}`);
        rows.push(`Generado: ${report.generatedAt.toLocaleString()}`);
        rows.push('');

        // Summary
        rows.push('Resumen');
        Object.entries(report.summary).forEach(([key, value]) => {
            rows.push(`${key};${escape(value)}`);
        });
        rows.push('');

        // Type-specific data
        if (report.type === 'availability') {
            const data = report.data as AvailabilityReportData;
            rows.push('Disponibilidad por Cliente');
            rows.push('Cliente;Dispositivos;Uptime Promedio;Downtime Total;Incidentes;MTTR');
            data.customers.forEach((c) => {
                rows.push([
                    c.customerName,
                    c.summary.totalDevices,
                    c.summary.averageUptime.toFixed(2) + '%',
                    c.summary.totalDowntime + ' min',
                    c.summary.incidents,
                    c.summary.mttr.toFixed(2) + ' min',
                ].map(escape).join(';'));
            });
        } else if (report.type === 'performance') {
            const data = report.data as PerformanceReportData;
            rows.push('Performance de Dispositivos');
            rows.push('Dispositivo;IP;Categoría;Health Score;CPU;Memoria;Alertas');
            data.devices.forEach((d) => {
                rows.push([
                    d.displayName || d.deviceName,
                    d.ipAddress,
                    d.category || '',
                    d.healthScore.toFixed(1),
                    d.metrics.cpu ? d.metrics.cpu.current.toFixed(1) + '%' : 'N/A',
                    d.metrics.memory ? d.metrics.memory.current.toFixed(1) + '%' : 'N/A',
                    d.alerts,
                ].map(escape).join(';'));
            });
        } else if (report.type === 'alert-trends') {
            const data = report.data as AlertTrendReportData;
            rows.push('Top Dispositivos por Alertas');
            rows.push('Dispositivo;Total Alertas;Alertas Críticas;Categorías');
            data.topDevices.forEach((d) => {
                rows.push([
                    d.displayName || d.deviceName,
                    d.alertCount,
                    d.criticalCount,
                    d.categories.join(', '),
                ].map(escape).join(';'));
            });
        }

        const csvContent = rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${report.name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export report to JSON
     */
    private exportToJson(report: GeneratedReport): void {
        const jsonContent = JSON.stringify(report, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${report.name.replace(/\s+/g, '_')}_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Save report configuration
     */
    saveReportConfig(config: ReportConfig): void {
        const configs = this.getReportConfigs();
        if (!config.id) {
            config.id = this.generateId();
            config.createdAt = new Date();
        }
        config.updatedAt = new Date();

        const index = configs.findIndex((c) => c.id === config.id);
        if (index >= 0) {
            configs[index] = config;
        } else {
            configs.push(config);
        }

        localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(configs));
    }

    /**
     * Get all saved report configurations
     */
    getReportConfigs(): ReportConfig[] {
        const stored = localStorage.getItem(this.CONFIG_STORAGE_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    }

    /**
     * Delete report configuration
     */
    deleteReportConfig(id: string): void {
        const configs = this.getReportConfigs().filter((c) => c.id !== id);
        localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(configs));
    }

    /**
     * Save generated report to history
     */
    saveGeneratedReport(report: GeneratedReport): void {
        const reports = this.getGeneratedReports();
        reports.unshift(report);
        // Keep only last 50 reports
        const trimmed = reports.slice(0, 50);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    }

    /**
     * Get report history
     */
    getGeneratedReports(): GeneratedReport[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return [];
        try {
            const reports = JSON.parse(stored);
            // Convert date strings back to Date objects
            return reports.map((r: any) => ({
                ...r,
                generatedAt: new Date(r.generatedAt),
                parameters: {
                    ...r.parameters,
                    dateRange: {
                        ...r.parameters.dateRange,
                        start: new Date(r.parameters.dateRange.start),
                        end: new Date(r.parameters.dateRange.end),
                    },
                },
            }));
        } catch {
            return [];
        }
    }

    /**
     * Clear report history
     */
    clearReportHistory(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    // Helper methods
    private createEmptyReport(config: ReportConfig): GeneratedReport {
        return {
            id: this.generateId(),
            configId: config.id,
            name: config.name,
            type: config.type,
            generatedAt: new Date(),
            parameters: config.parameters,
            data: {},
            summary: {
                totalDevices: 0,
            },
        };
    }

    private createMockMetric(current: number, threshold: number, unit: string): MetricStats {
        const variance = current * 0.2;
        return {
            current,
            average: current * 0.9,
            min: Math.max(0, current - variance),
            max: current + variance,
            unit,
            threshold,
            exceeded: current > threshold,
        };
    }

    private generateId(): string {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
