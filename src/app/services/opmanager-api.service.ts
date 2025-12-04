import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  OpManagerDevice,
  OpManagerAlert,
  OpManagerInterface,
  InterfaceSummary,
  InterfaceGraphData,
  DashboardData,
  HealthSummary,
  ListAlarmsParams,
  ListEventsParams
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class OpmanagerApiService {
  private readonly STORAGE_KEY = 'opmanagerApiKey';
  private baseUrl = '/api/opmanager-proxy'; // Use Azure Function proxy

  constructor(private http: HttpClient) {
    // Log environment info for debugging
    console.log('[OpManagerApiService] Initializing...', {
      production: environment.production,
      configuredUrl: (environment as any).opmanagerApiUrl,
      finalBaseUrl: this.baseUrl
    });

    // If a specific URL is configured in environment, use it (for custom deployments)
    if ((environment as any).opmanagerApiUrl) {
      this.baseUrl = (environment as any).opmanagerApiUrl;
      console.log('[OpManagerApiService] Using configured URL:', this.baseUrl);
    }
  }

  get apiKey(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  set apiKey(value: string | null) {
    if (value) {
      localStorage.setItem(this.STORAGE_KEY, value);
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  authenticate(): Observable<boolean> {
    if (!this.apiKey) {
      return of(false);
    }
    const params = this.buildParams();
    const url = `${this.baseUrl}/json/v2/device/listDevices`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, params, headers);
    return this.http.get<any>(url, {
      params,
      headers
    })
      .pipe(
        map((data) => {
          if (!data) {
            return false;
          }
          if (typeof data === 'object' && 'error' in data) {
            return false;
          }
          return true;
        })
      );
  }

  getDashboardData(extraParams?: Record<string, any>): Observable<DashboardData> {
    return this.getDevices(extraParams).pipe(
      map((devices) => {
        const total_devices = devices.length;
        const alerts: OpManagerAlert[] = []; // Alerts can be wired later or via getAlarms
        const active_alerts = alerts.filter(
          (a) => a.status === 'active' || a.severity === 'critical'
        ).length;

        const devices_by_status: Record<string, number> = {};
        devices.forEach((device) => {
          let status = String(device['statusStr'] ?? 'unknown').toLowerCase();
          if (status === 'clear') {
            status = 'healthy';
          } else if (['warning', 'minor'].includes(status)) {
            status = 'warning';
          } else if (['critical', 'major'].includes(status)) {
            status = 'critical';
          }
          devices_by_status[status] = (devices_by_status[status] ?? 0) + 1;
        });

        return {
          total_devices,
          active_alerts,
          devices_by_status,
          recent_alerts: alerts,
          devices,
        } as DashboardData;
      })
    );
  }

  getHealthSummary(): Observable<HealthSummary> {
    return this.getDevices().pipe(
      map((devices) => {
        const summary: HealthSummary = {
          healthy: 0,
          warning: 0,
          critical: 0,
          unknown: 0,
        };

        devices.forEach((device) => {
          const rawStatus = String(device['statusStr'] ?? 'unknown').toLowerCase();
          if (rawStatus === 'clear') {
            summary.healthy++;
          } else if (['warning', 'minor'].includes(rawStatus)) {
            summary.warning++;
          } else if (['critical', 'major'].includes(rawStatus)) {
            summary.critical++;
          } else {
            summary.unknown++;
          }
        });

        return summary;
      })
    );
  }

  getDevices(extraParams?: Record<string, any>): Observable<OpManagerDevice[]> {
    if (!this.apiKey) {
      return of([]);
    }
    const params = this.buildParams(extraParams);
    const url = `${this.baseUrl}/json/v2/device/listDevices`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, params, headers);
    return this.http.get<any>(url, {
      params,
      headers
    })
      .pipe(
        map((result) => {
          if (result && Array.isArray(result.rows)) {
            return result.rows;
          }
          if (Array.isArray(result)) {
            return result as OpManagerDevice[];
          }
          if (result && Array.isArray(result.devices)) {
            return result.devices as OpManagerDevice[];
          }
          return [];
        })
      );
  }

  /** Alarm endpoints **/
  getAlarms(params?: ListAlarmsParams & Record<string, any>): Observable<OpManagerAlert[]> {
    if (!this.apiKey) {
      return of([]);
    }
    const httpParams = this.buildParams(params ?? {});
    const url = `${this.baseUrl}/json/alarm/listAlarms`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, httpParams, headers);
    return this.http.get<any>(url, {
      params: httpParams,
      headers
    })
      .pipe(
        map((result) => {
          if (Array.isArray(result)) {
            return result as OpManagerAlert[];
          }
          if (result && Array.isArray(result.alarms)) {
            return result.alarms as OpManagerAlert[];
          }
          if (result && Array.isArray(result.alerts)) {
            return result.alerts as OpManagerAlert[];
          }
          if (result && Array.isArray(result.rows)) {
            return result.rows as OpManagerAlert[];
          }
          return [];
        })
      );
  }

  getTopDevicesByAlarms(eventType: string): Observable<any[]> {
    if (!this.apiKey) {
      return of([]);
    }
    const params = this.buildParams({ eventType });
    const url = `${this.baseUrl}/json/alarm/getTopDevicesByAlarms`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, params, headers);
    return this.http.get<any>(url, {
      params,
      headers
    })
      .pipe(
        map((result) => {
          if (Array.isArray(result)) {
            return result;
          }
          if (result && Array.isArray(result.devices)) {
            return result.devices;
          }
          return [];
        })
      );
  }

  /** Device monitor / performance endpoints **/
  getDeviceAssociatedMonitors(name: string): Observable<any[]> {
    if (!this.apiKey) {
      return of([]);
    }
    const params = this.buildParams({ name });
    const url = `${this.baseUrl}/json/device/getDeviceAssociatedMonitors`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, params, headers);
    return this.http.get<any>(url, {
      params,
      headers
    })
      .pipe(map((result) => (Array.isArray(result) ? result : result?.monitors ?? [])));
  }

  getPerformanceMonitors(deviceName: string, category?: string, type?: string): Observable<any[]> {
    if (!this.apiKey) {
      return of([]);
    }
    const params: Record<string, any> = { deviceName };
    if (category) params['category'] = category;
    if (type) params['type'] = type;
    const httpParams = this.buildParams(params);
    const url = `${this.baseUrl}/json/device/getPerformanceMonitors`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, httpParams, headers);
    return this.http.get<any>(url, {
      params: httpParams,
      headers
    })
      .pipe(map((result) => (Array.isArray(result) ? result : result?.monitors ?? [])));
  }

  /** Ping / trace endpoints (POST) **/
  postPingResponse(deviceName: string): Observable<any> {
    if (!this.apiKey) {
      return of(null);
    }
    const params = this.buildParams({ deviceName });
    const url = `${this.baseUrl}/json/device/getPingResponse`;
    const headers = this.buildHeaders();
    this.debugLogRequest('POST', url, params, headers);
    return this.http.post<any>(url, null, {
      params,
      headers
    });
  }

  postTraceResponse(deviceName: string): Observable<any> {
    if (!this.apiKey) {
      return of(null);
    }
    const params = this.buildParams({ deviceName });
    const url = `${this.baseUrl}/json/device/getTraceResponse`;
    const headers = this.buildHeaders();
    this.debugLogRequest('POST', url, params, headers);
    return this.http.post<any>(url, null, {
      params,
      headers
    });
  }

  /** Events endpoints **/
  getEvents(params?: ListEventsParams & Record<string, any>): Observable<any[]> {
    if (!this.apiKey) {
      return of([]);
    }
    const httpParams = this.buildParams(params ?? {});
    const url = `${this.baseUrl}/json/events/listEvents`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, httpParams, headers);
    return this.http.get<any>(url, {
      params: httpParams,
      headers
    })
      .pipe(
        map((result) => {
          if (Array.isArray(result)) {
            return result;
          }
          if (result && Array.isArray(result.events)) {
            return result.events;
          }
          if (result && Array.isArray(result.rows)) {
            return result.rows;
          }
          return [];
        })
      );
  }

  /** Interface endpoints **/
  listInterfaces(params?: Record<string, any>): Observable<OpManagerInterface[]> {
    if (!this.apiKey) {
      return of([]);
    }
    const httpParams = this.buildParams(params ?? {});
    const url = `${this.baseUrl}/json/device/listInterfaces`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, httpParams, headers);
    return this.http
      .get<any>(url, {
        params: httpParams,
        headers: headers,
      })
      .pipe(
        map((result) => {
          if (result && Array.isArray(result.rows)) {
            return result.rows as OpManagerInterface[];
          }
          if (result && Array.isArray(result.interfaces)) {
            return result.interfaces as OpManagerInterface[];
          }
          if (Array.isArray(result)) {
            return result as OpManagerInterface[];
          }
          return [];
        })
      );
  }

  /** SRE / discovery endpoints (based on Google Apps Script) **/
  updateInterfaces(deviceName: string, interfaceIDs: string[], regionId: string = '-1', selCustomerID?: string | number): Observable<boolean> {
    if (!this.apiKey) {
      return of(false);
    }
    const idsStr = JSON.stringify(interfaceIDs);
    // We build params manually here because the discovery endpoint expects specific query params
    const params: Record<string, any> = {
      deviceName,
      interfaceIDs: idsStr,
      update: 'true',
      selCustomerID: selCustomerID ?? '-1',
      regionID: regionId,
    };
    const httpParams = this.buildParams(params);
    const url = `${this.baseUrl}/json/discovery/updateInterfaces`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, httpParams, headers);
    return this.http
      .get<any>(url, {
        params: httpParams,
        headers,
      })
      .pipe(
        map((res) => {
          // Treat HTTP 200 with any body as success; you can refine based on real API response
          return !!res;
        }),
        catchError(() => of(false))
      );
  }

  getInterfaceSummary(interfaceName: string): Observable<InterfaceSummary> {
    if (!this.apiKey) {
      return of({});
    }
    const params = this.buildParams({ interfaceName });
    const url = `${this.baseUrl}/json/device/getInterfaceSummary`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, params, headers);
    return this.http
      .get<InterfaceSummary>(url, {
        params,
        headers
      })
      .pipe(
        map((result) => result ?? {}),
        catchError(() => of({}))
      );
  }

  getInterfaceGraphs(interfaceName: string, graphName: string = 'traffic', period: string = '6'): Observable<InterfaceGraphData> {
    if (!this.apiKey) {
      return of({});
    }
    const params = this.buildParams({ interfaceName, graphName, isFluidic: 'true', period });
    const url = `${this.baseUrl}/json/device/getInterfaceGraphs`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, params, headers);
    return this.http
      .get<InterfaceGraphData>(url, {
        params,
        headers
      })
      .pipe(
        map((result) => result ?? {}),
        catchError(() => of({}))
      );
  }

  getCustomers(): Observable<any[]> {
    if (!this.apiKey) {
      return of([]);
    }
    const params = this.buildParams();
    const url = `${this.baseUrl}/json/admin/listCustomerNames`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, params, headers);
    return this.http.get<any>(url, {
      params,
      headers
    })
      .pipe(
        map((result) => {
          if (Array.isArray(result)) {
            return result;
          }
          if (result && Array.isArray(result.customers)) {
            return result.customers;
          }
          return [];
        })
      );
  }

  getDeviceNotes(deviceName: string): Observable<any> {
    if (!this.apiKey) {
      return of(null);
    }
    const params = this.buildParams({ name: deviceName });
    const url = `${this.baseUrl}/json/device/getDeviceNotes`;
    const headers = this.buildHeaders();
    this.debugLogRequest('GET', url, params, headers);
    return this.http.get<any>(url, {
      params,
      headers
    })
      .pipe(
        map((result) => result ?? {})
      );
  }

  private buildParams(extraParams?: Record<string, any>): HttpParams {
    let params = new HttpParams()
      .set('selCustomerID', '-1')
      .set('regionID', '-1');

    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }

    return params;
  }

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (this.apiKey) {
      headers = headers.set('apiKey', this.apiKey);
    }
    return headers;
  }

  private debugLogRequest(method: string, url: string, params?: HttpParams, headers?: HttpHeaders) {
    try {
      const paramsStr = params?.toString() ?? '';
      const headerObj: Record<string, string | string[]> = {};
      headers?.keys().forEach((k) => {
        const vals = headers.getAll(k) ?? [];
        headerObj[k] = vals.length > 1 ? vals : vals[0] ?? '';
      });
      // eslint-disable-next-line no-console
      console.debug('[OpManager API] Request', { method, url, params: paramsStr, headers: headerObj });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.debug('[OpManager API] DebugLog failed', e);
    }
  }
}
