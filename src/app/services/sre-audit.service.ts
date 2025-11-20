import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, tap, map, catchError } from 'rxjs';
import { OpmanagerApiService, OpManagerDevice, OpManagerInterface } from './opmanager-api.service';

export type SreAuditMode = 'quick' | 'full';

export interface SreAuditConfig {
  selCustomerID: string;
  regionID: string;
  category: string;
  highlightUnmonitored: boolean;
  detectChanges: boolean;
  autoMonitorCritical: boolean;
  batchSize: number;
  skipUpdateInterfaces: boolean;
  delayBetweenRequestsMs: number;
}

export interface SreAuditLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface SreAuditResultSummary {
  devices: OpManagerDevice[];
  interfaces: OpManagerInterface[];
  totalInterfaces: number;
  totalUnmonitored: number;
  totalDown: number;
}

@Injectable({ providedIn: 'root' })
export class SreAuditService {
  // Default values based on the Apps Script CONFIG
  private readonly defaultConfig: SreAuditConfig = {
    selCustomerID: '901',
    regionID: '-1',
    category: 'Firewall',
    highlightUnmonitored: true,
    detectChanges: true,
    autoMonitorCritical: false,
    batchSize: 5,
    skipUpdateInterfaces: true,
    delayBetweenRequestsMs: 300,
  };

  readonly logs$ = new BehaviorSubject<SreAuditLogEntry[]>([]);
  readonly running$ = new BehaviorSubject<boolean>(false);
  readonly mode$ = new BehaviorSubject<SreAuditMode | null>(null);
  readonly error$ = new BehaviorSubject<string | null>(null);
  readonly summary$ = new BehaviorSubject<SreAuditResultSummary | null>(null);

  constructor(private api: OpmanagerApiService) {}

  clear() {
    this.logs$.next([]);
    this.error$.next(null);
    this.summary$.next(null);
    this.mode$.next(null);
  }

  startQuickMode(customConfig?: Partial<SreAuditConfig>): Observable<SreAuditResultSummary | null> {
    const config = { ...this.defaultConfig, ...customConfig };
    this.clear();
    this.mode$.next('quick');
    this.running$.next(true);
    this.log('info', '=== MODO RÁPIDO - SIN ACTUALIZACIÓN ===');

    return this.loadDevicesAndInterfaces(config).pipe(
      tap(({ devices, interfaces }) => {
        if (!devices.length) {
          this.log('warn', 'No se encontraron dispositivos para procesar.');
          this.running$.next(false);
          return;
        }

        const summary = this.buildSummary(devices, interfaces, config);
        this.summary$.next(summary);
        this.log('info', `Dispositivos: ${devices.length}`);
        this.log('info', `Interfaces: ${interfaces.length}`);
        this.log('info', 'Reporte SRE generado en memoria (puede visualizarse en la UI).');
        this.log('info', '=== COMPLETADO ===');
        this.running$.next(false);
      }),
      map(() => this.summary$.value),
      catchError((err) => {
        const msg = String(err?.message || err);
        this.error$.next(msg);
        this.log('error', `ERROR: ${msg}`);
        this.running$.next(false);
        return of(null);
      })
    );
  }

  startFullProcess(customConfig?: Partial<SreAuditConfig>): Observable<SreAuditResultSummary | null> {
    const config = { ...this.defaultConfig, ...customConfig };
    this.clear();
    this.mode$.next('full');
    this.running$.next(true);
    this.log('info', '=== INICIANDO PROCESO SRE ===');

    return this.loadDevices(config).pipe(
      switchMap((devices) => {
        if (!devices.length) {
          this.log('warn', 'No se encontraron dispositivos para procesar.');
          this.running$.next(false);
          return of<{ devices: OpManagerDevice[]; interfaces: OpManagerInterface[] }>({ devices: [], interfaces: [] });
        }
        this.log('info', `1. Dispositivos obtenidos: ${devices.length}`);
        this.log('info', '2. Obteniendo interfaces y estado de monitoreo...');

        return this.loadInterfaces(config).pipe(
          switchMap((interfaces) => {
            this.log('info', `   Total de interfaces obtenidas: ${interfaces.length}`);

            if (config.skipUpdateInterfaces) {
              this.log('info', '3. ⚡ MODO RÁPIDO: Saltando actualización de interfaces');
              return of({ devices, interfaces });
            }

            this.log('info', '3. Procesando y actualizando interfaces por dispositivo...');
            return this.processAndUpdateInterfaces(devices, interfaces, config).pipe(
              switchMap(() => {
                this.log('info', '4. Obteniendo interfaces actualizadas...');
                return this.loadInterfaces(config).pipe(
                  map((updatedInterfaces) => ({ devices, interfaces: updatedInterfaces }))
                );
              })
            );
          })
        );
      }),
      tap(({ devices, interfaces }) => {
        const summary = this.buildSummary(devices, interfaces, config);
        this.summary$.next(summary);
        this.log('info', '5. Generando reporte SRE (en memoria)...');
        this.log('info', '6. Generando resumen ejecutivo (en memoria)...');
        this.log('info', '=== PROCESO COMPLETADO EXITOSAMENTE ===');
        this.running$.next(false);
      }),
      map(() => this.summary$.value),
      catchError((err) => {
        const msg = String(err?.message || err);
        this.error$.next(msg);
        this.log('error', `ERROR: ${msg}`);
        this.running$.next(false);
        return of(null);
      })
    );
  }

  private loadDevices(config: SreAuditConfig): Observable<OpManagerDevice[]> {
    const params: Record<string, any> = {
      selCustomerID: config.selCustomerID,
      regionID: config.regionID,
      category: config.category,
    };
    this.log('info', '1. Obteniendo dispositivos...');
    return this.api.getDevices(params).pipe(
      tap((devices) => this.log('info', `   Dispositivos obtenidos: ${devices.length}`))
    );
  }

  private loadInterfaces(config: SreAuditConfig): Observable<OpManagerInterface[]> {
    const params: Record<string, any> = {
      selCustomerID: config.selCustomerID,
      regionID: config.regionID,
    };
    this.log('info', '2. Obteniendo interfaces y estado de monitoreo...');
    return this.api.listInterfaces(params).pipe(
      tap((interfaces) => this.log('info', `   Total de interfaces obtenidas: ${interfaces.length}`))
    );
  }

  private loadDevicesAndInterfaces(config: SreAuditConfig): Observable<{ devices: OpManagerDevice[]; interfaces: OpManagerInterface[] }> {
    return this.loadDevices(config).pipe(
      switchMap((devices) =>
        this.loadInterfaces(config).pipe(
          map((interfaces) => ({ devices, interfaces }))
        )
      )
    );
  }

  private processAndUpdateInterfaces(
    devices: OpManagerDevice[],
    interfaces: OpManagerInterface[],
    config: SreAuditConfig
  ): Observable<void> {
    if (!devices.length || !interfaces.length) {
      return of(void 0);
    }

    const batches: OpManagerDevice[][] = [];
    for (let i = 0; i < devices.length; i += config.batchSize) {
      batches.push(devices.slice(i, i + config.batchSize));
    }

    const runBatch = (batchIndex: number): Observable<void> => {
      if (batchIndex >= batches.length) {
        return of(void 0);
      }
      const batch = batches[batchIndex];

      const updates$ = batch.map((device, idx) => {
        const display = (device.displayName || device.deviceName || '').toString();
        this.log('info', `   [${batchIndex * config.batchSize + idx + 1}/${devices.length}] Procesando: ${display}`);
        const deviceName = (device.deviceName || device['name']) as string;
        if (!deviceName) {
          this.log('warn', '      Dispositivo sin deviceName, se omite.');
          return of(false);
        }

        const ifaceForDevice = interfaces.filter((itf) =>
          String(itf['deviceName'] ?? itf['displayName'] ?? '').toLowerCase() === deviceName.toLowerCase()
        );

        if (!ifaceForDevice.length) {
          this.log('info', '      Sin interfaces para este dispositivo, se omite actualización.');
          return of(false);
        }

        const ids = Array.from({ length: ifaceForDevice.length }, (_, i) => String(i + 1));
        return this.api.updateInterfaces(deviceName, ids, config.regionID, config.selCustomerID).pipe(
          tap((ok) => {
            if (ok) {
              this.log('info', `      Actualizado: ${ifaceForDevice.length} interfaces`);
            } else {
              this.log('warn', '      Falló la actualización de interfaces.');
            }
          })
        );
      });

      // Execute sequentially inside batch to keep logs ordered
      return updates$.reduce(
        (acc: Observable<void>, obs) =>
          acc.pipe(
            switchMap(() => obs),
            switchMap(() => this.delay(config.delayBetweenRequestsMs))
          ),
        of(void 0) as Observable<void>
      ).pipe(
        switchMap(() => runBatch(batchIndex + 1))
      );
    };

    return runBatch(0);
  }

  private buildSummary(
    devices: OpManagerDevice[],
    interfaces: OpManagerInterface[],
    config: SreAuditConfig
  ): SreAuditResultSummary {
    let totalUnmonitored = 0;
    let totalDown = 0;

    interfaces.forEach((itf) => {
      const isMonitored =
        itf['managed'] === 'true' || itf['managed'] === true ||
        itf['isManaged'] === 'true' || itf['isManaged'] === true ||
        itf['monitor'] === 'true' || itf['monitor'] === true;
      const status = String(itf['status'] ?? itf['operStatus'] ?? '').toLowerCase();

      if (!isMonitored) {
        totalUnmonitored++;
      }
      if (status === 'down') {
        totalDown++;
      }
    });

    return {
      devices,
      interfaces,
      totalInterfaces: interfaces.length,
      totalUnmonitored,
      totalDown,
    };
  }

  private delay(ms: number): Observable<void> {
    return new Observable<void>((observer) => {
      const handle = setTimeout(() => {
        observer.next();
        observer.complete();
      }, ms);
      return () => clearTimeout(handle);
    });
  }

  private log(level: 'info' | 'warn' | 'error', message: string) {
    const next: SreAuditLogEntry = {
      timestamp: new Date(),
      level,
      message,
    };
    const current = this.logs$.value;
    this.logs$.next([...current, next]);
    // Also mirror to console for debugging
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log']('[SRE]', message);
  }
}
