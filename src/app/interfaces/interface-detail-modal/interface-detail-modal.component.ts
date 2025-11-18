import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, startWith, switchMap, catchError } from 'rxjs/operators';
import { OpmanagerApiService, OpManagerInterface, InterfaceSummary, InterfaceGraphData } from '../../services/opmanager-api.service';

@Component({
  selector: 'app-interface-detail-modal',
  templateUrl: 'interface-detail-modal.component.html',
  styleUrls: ['interface-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class InterfaceDetailModalComponent implements OnInit {
  @Input() interface: OpManagerInterface | undefined;

  public loading$ = new BehaviorSubject<boolean>(true);
  public summary$: Observable<InterfaceSummary> = of({});
  public graphTraffic$: Observable<InterfaceGraphData> = of({});
  public graphUtilization$: Observable<InterfaceGraphData> = of({});
  public selectedGraphPeriod$ = new BehaviorSubject<string>('6');

  public graphPeriods = [
    { value: '6', name: 'Today' },
    { value: '7', name: 'Yesterday' },
    { value: '4', name: 'Last 7 Days' },
    { value: '5', name: 'Last 30 Days' }
  ];

  constructor(
    private modalCtrl: ModalController,
    private opmanagerApi: OpmanagerApiService
  ) {}

  ngOnInit() {
    if (!this.interface) {
      this.dismiss();
      return;
    }

    const interfaceName = (this.interface['interfaceName'] || this.interface['ifName'] || '');

    // Summary
    this.summary$ = this.opmanagerApi.getInterfaceSummary(interfaceName).pipe(
      tap(() => this.loading$.next(false)),
      catchError(() => {
        this.loading$.next(false);
        return of({});
      })
    );

    // Traffic graph
    this.graphTraffic$ = this.selectedGraphPeriod$.pipe(
      switchMap(period =>
        this.opmanagerApi.getInterfaceGraphs(interfaceName, 'traffic', period).pipe(
          catchError(() => of({}))
        )
      ),
      startWith({})
    );

    // Utilization graph
    this.graphUtilization$ = this.selectedGraphPeriod$.pipe(
      switchMap(period =>
        this.opmanagerApi.getInterfaceGraphs(interfaceName, 'utilization', period).pipe(
          catchError(() => of({}))
        )
      ),
      startWith({})
    );
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  onGraphPeriodChange(period: string) {
    this.selectedGraphPeriod$.next(period);
  }

  getStatusColor(statusStr: string): string {
    const status = (statusStr || '').toLowerCase();
    if (status.includes('critical')) return 'danger';
    if (status.includes('trouble')) return 'medium';
    if (status.includes('attention')) return 'warning';
    if (status.includes('down')) return 'danger';
    if (status.includes('clear')) return 'success';
    return 'light';
  }
}
