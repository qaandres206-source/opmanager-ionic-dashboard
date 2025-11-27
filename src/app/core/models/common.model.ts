export interface DashboardData {
    total_devices: number;
    active_alerts: number;
    devices_by_status: Record<string, number>;
    recent_alerts: any[];
    devices: any[];
}

export interface HealthSummary {
    healthy: number;
    warning: number;
    critical: number;
    unknown: number;
}

export interface ListAlarmsParams {
    alertType?: string;
    severity?: number | string;
    deviceName?: string;
    category?: string;
    period?: string | number;
}

export interface ListEventsParams {
    eventType?: string;
}
