import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { catchError, switchMap, tap, map, startWith } from 'rxjs/operators';
import { OpmanagerApiService, OpManagerInterface } from '../services/opmanager-api.service';
import { DashboardStateService } from '../services/dashboard-state.service';
import { InterfaceDetailModalComponent } from './interface-detail-modal/interface-detail-modal.component';

interface SortConfig {
  sortByColumn: string;
  sortByType: 'asc' | 'desc';
}

@Component({
  selector: 'app-interfaces',
  templateUrl: 'interfaces.page.html',
  styleUrls: ['interfaces.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ScrollingModule],
})
export class InterfacesPage implements OnInit {
  public interfaces$: Observable<OpManagerInterface[]> = of([]);
  public loading$ = new BehaviorSubject<boolean>(true);
  public errorMessage: string | null = null;

  public interfaceTypes$: Observable<string[]> = of([]);

  private filters$ = new BehaviorSubject<{ severity?: string; type?: string }>({});
  public sort$ = new BehaviorSubject<SortConfig>({ sortByColumn: 'statusNum', sortByType: 'desc' });
  public viewMode$ = new BehaviorSubject<'table' | 'heatmap'>('table');

  // Input values for copy-paste functionality
  severityInputValue: string = '';
  typeInputValue: string = '';

  // Hardcoded based on API documentation
  public readonly severityOptions = [
    { value: '1', name: 'Critical' },
    { value: '2', name: 'Trouble' },
    { value: '3', name: 'Attention' },
    { value: '4', name: 'Service Down' },
    { value: '5', name: 'Clear' },
    { value: '7', name: 'Unmanaged' }
  ];

  constructor(
    private opmanagerApi: OpmanagerApiService,
    private dashboard: DashboardStateService,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    const trigger$ = combineLatest([
      this.dashboard.selectedCustomer$.pipe(startWith(null)),
      this.filters$,
      this.sort$
    ]);

    this.interfaces$ = trigger$.pipe(
      tap(() => {
        this.loading$.next(true);
        this.errorMessage = null;
      }),
      switchMap(([customer, filters, sort]) => {
        const params: Record<string, any> = {
          selCustomerID: customer ? (customer as any).value : '-1',
          sortByColumn: sort.sortByColumn,
          sortByType: sort.sortByType,
        };
        if (filters.severity) {
          params['severity'] = filters.severity;
        }
        if (filters.type) {
          params['type'] = filters.type;
        }

        return this.opmanagerApi.listInterfaces(params).pipe(
          catchError(err => {
            console.error('Error fetching interfaces:', err);
            this.errorMessage = 'Error al cargar las interfaces. Verifique la conexión y la API Key.';
            return of([]);
          })
        );
      }),
      tap(() => this.loading$.next(false))
    );

    // Derive interface types from the main data stream for the filter
    this.interfaceTypes$ = this.interfaces$.pipe(
      map(interfaces => {
        const types = new Set(interfaces.map(i => i['type']).filter(Boolean) as string[]);
        return Array.from(types).sort();
      })
    );
  }

  public onFilterChanged(filterName: 'severity' | 'type', value: any) {
    const currentFilters = this.filters$.value;
    this.filters$.next({
      ...currentFilters,
      [filterName]: value
    });
    // Update input values when select changes
    if (filterName === 'severity') {
      this.severityInputValue = value || '';
    } else if (filterName === 'type') {
      this.typeInputValue = value || '';
    }
  }

  public onSeverityInputChange(ev: any) {
    const value = ev.detail.value?.trim() || '';
    this.severityInputValue = value;
    const currentFilters = this.filters$.value;
    this.filters$.next({
      ...currentFilters,
      severity: value
    });
  }

  public onTypeInputChange(ev: any) {
    const value = ev.detail.value?.trim() || '';
    this.typeInputValue = value;
    const currentFilters = this.filters$.value;
    this.filters$.next({
      ...currentFilters,
      type: value
    });
  }

  public sort(column: string) {
    const currentSort = this.sort$.value;
    let nextSortType: 'asc' | 'desc' = 'asc';

    if (currentSort.sortByColumn === column && currentSort.sortByType === 'asc') {
      nextSortType = 'desc';
    }

    this.sort$.next({
      sortByColumn: column,
      sortByType: nextSortType,
    });
  }

  public getStatusClass(item: OpManagerInterface): string {
    const status = (item['statusStr'] || '').toLowerCase();
    if (status.includes('critical')) return 'status-critical';
    if (status.includes('trouble')) return 'status-trouble';
    if (status.includes('attention')) return 'status-attention';
    if (status.includes('down')) return 'status-down';
    if (status.includes('clear')) return 'status-clear';
    return 'status-unknown';
  }

  public toggleViewMode() {
    const current = this.viewMode$.value;
    this.viewMode$.next(current === 'table' ? 'heatmap' : 'table');
  }

  public getHeatmapStatusClass(item: OpManagerInterface): string {
    const status = (item['statusStr'] || '').toLowerCase();
    if (status.includes('critical')) return 'heatmap-critical';
    if (status.includes('trouble')) return 'heatmap-trouble';
    if (status.includes('attention')) return 'heatmap-attention';
    if (status.includes('down')) return 'heatmap-down';
    if (status.includes('clear')) return 'heatmap-clear';
    return 'heatmap-unknown';
  }

  public async openInterfaceDetails(item: OpManagerInterface) {
    const modal = await this.modalCtrl.create({
      component: InterfaceDetailModalComponent,
      componentProps: {
        interface: item
      }
    });
    await modal.present();
  }

  public exportToCsv() {
    // Get current interfaces from the observable
    this.interfaces$.pipe(
      map(interfaces => {
        if (!interfaces.length) {
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
        rows.push('Nombre;Alias;Descripción;Velocidad;Estado');

        interfaces.forEach((i) => {
          rows.push([
            i['ifName'] || i['displayName'] || '',
            i['ifAlias'] || '',
            i['ifDesc'] || '',
            i['inSpeed'] || '',
            i['statusStr'] || '',
          ].map(escape).join(';'));
        });

        const csvContent = rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'opmanager_interfaces.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
    ).subscribe();
  }
}
