// Report models for automated reporting system

export type ReportType = 'availability' | 'performance' | 'alert-trends' | 'custom';
export type ReportFormat = 'csv' | 'json' | 'pdf';
export type ReportFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export interface ReportConfig {
    id?: string;
    name: string;
    type: ReportType;
    description?: string;
    parameters: ReportParameters;
    schedule?: ReportSchedule;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ReportParameters {
    customerIds?: string[];
    deviceIds?: string[];
    dateRange: DateRange;
    includeGraphs?: boolean;
    groupBy?: 'customer' | 'device' | 'category' | 'none';
    filters?: Record<string, any>;
}

export interface DateRange {
    start: Date;
    end: Date;
    preset?: 'last-24h' | 'last-7d' | 'last-30d' | 'last-90d' | 'custom';
}

export interface ReportSchedule {
    enabled: boolean;
    frequency: ReportFrequency;
    time?: string; // HH:mm format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    recipients?: string[]; // email addresses
    format: ReportFormat;
}

export interface GeneratedReport {
    id: string;
    configId?: string;
    name: string;
    type: ReportType;
    generatedAt: Date;
    parameters: ReportParameters;
    data: AvailabilityReportData | PerformanceReportData | AlertTrendReportData | any;
    summary: ReportSummary;
}

export interface ReportSummary {
    totalDevices: number;
    totalAlerts?: number;
    criticalIssues?: number;
    warnings?: number;
    averageUptime?: number;
    averageResponseTime?: number;
    [key: string]: any;
}

// Availability Report Data
export interface AvailabilityReportData {
    period: DateRange;
    customers: CustomerAvailability[];
    overall: OverallAvailability;
}

export interface CustomerAvailability {
    customerId: string;
    customerName: string;
    devices: DeviceAvailability[];
    summary: {
        totalDevices: number;
        averageUptime: number;
        totalDowntime: number; // in minutes
        incidents: number;
        mttr: number; // Mean Time To Repair in minutes
    };
}

export interface DeviceAvailability {
    deviceId: string;
    deviceName: string;
    displayName?: string;
    ipAddress: string;
    category?: string;
    uptime: number; // percentage
    downtime: number; // in minutes
    incidents: AvailabilityIncident[];
    sla: {
        target: number; // percentage
        actual: number; // percentage
        met: boolean;
    };
}

export interface AvailabilityIncident {
    startTime: Date;
    endTime?: Date;
    duration: number; // in minutes
    reason?: string;
    severity: string;
}

export interface OverallAvailability {
    totalDevices: number;
    averageUptime: number;
    totalIncidents: number;
    averageMTTR: number;
    slaCompliance: number; // percentage of devices meeting SLA
}

// Performance Report Data
export interface PerformanceReportData {
    period: DateRange;
    devices: DevicePerformance[];
    summary: PerformanceSummary;
}

export interface DevicePerformance {
    deviceId: string;
    deviceName: string;
    displayName?: string;
    ipAddress: string;
    category?: string;
    metrics: {
        cpu?: MetricStats;
        memory?: MetricStats;
        disk?: MetricStats;
        responseTime?: MetricStats;
        packetLoss?: MetricStats;
        bandwidth?: BandwidthStats;
    };
    interfaces?: InterfacePerformance[];
    healthScore: number; // 0-100
    alerts: number;
}

export interface MetricStats {
    current: number;
    average: number;
    min: number;
    max: number;
    unit: string;
    threshold?: number;
    exceeded?: boolean;
}

export interface BandwidthStats {
    inbound: MetricStats;
    outbound: MetricStats;
    total: MetricStats;
}

export interface InterfacePerformance {
    interfaceName: string;
    status: string;
    utilization: MetricStats;
    errors: number;
    discards: number;
}

export interface PerformanceSummary {
    totalDevices: number;
    averageHealthScore: number;
    devicesAboveThreshold: number;
    topCpuDevices: DeviceMetric[];
    topMemoryDevices: DeviceMetric[];
    topBandwidthDevices: DeviceMetric[];
}

export interface DeviceMetric {
    deviceName: string;
    value: number;
    unit: string;
}

// Alert Trends Report Data
export interface AlertTrendReportData {
    period: DateRange;
    trends: AlertTrend[];
    distribution: AlertDistribution;
    topDevices: TopAlertDevice[];
    summary: AlertTrendSummary;
}

export interface AlertTrend {
    date: Date;
    total: number;
    bySeverity: {
        critical: number;
        major: number;
        minor: number;
        warning: number;
        info: number;
    };
    byCategory: Record<string, number>;
}

export interface AlertDistribution {
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    byCustomer: Record<string, number>;
    byDevice: Record<string, number>;
}

export interface TopAlertDevice {
    deviceId: string;
    deviceName: string;
    displayName?: string;
    alertCount: number;
    criticalCount: number;
    categories: string[];
}

export interface AlertTrendSummary {
    totalAlerts: number;
    averagePerDay: number;
    criticalAlerts: number;
    resolvedAlerts: number;
    averageResolutionTime: number; // in minutes
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number; // compared to previous period
}
