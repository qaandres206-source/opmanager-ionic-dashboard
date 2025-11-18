import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OpmanagerApiService } from '../services/opmanager-api.service';

@Component({
  selector: 'app-api-explorer',
  templateUrl: './api-explorer.page.html',
  styleUrls: ['./api-explorer.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class ApiExplorerPage implements OnInit {
  id: string | null = null;
  loading = false;
  data: any = null;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private api: OpmanagerApiService) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.callEndpoint(this.id);
    }
  }

  callEndpoint(id: string) {
    this.loading = true;
    this.error = null;
    this.data = null;

    let obs$;

    switch (id) {
      case 'alarms-all':
        obs$ = this.api.getAlarms();
        break;
      case 'alarms-active':
        obs$ = this.api.getAlarms({ alertType: 'ActiveAlarms' });
        break;
      case 'alarms-severity-1':
        obs$ = this.api.getAlarms({ severity: 1 });
        break;
      case 'alarms-severity-4':
        obs$ = this.api.getAlarms({ severity: 4 });
        break;
      case 'devices-all':
        obs$ = this.api.getDevices();
        break;
      case 'devices-firewall':
        obs$ = this.api.getDevices({ selCustomerID: 902, category: 'Firewall' });
        break;
      case 'devices-server':
        obs$ = this.api.getDevices({ category: 'Server' });
        break;
      case 'devices-severity-7':
        obs$ = this.api.getDevices({ severity: 7 });
        break;
      case 'devices-severity-4':
        obs$ = this.api.getDevices({ severity: 4 });
        break;
      case 'devices-severity-1':
        obs$ = this.api.getDevices({ severity: 1 });
        break;
      case 'monitors-associated':
        obs$ = this.api.getDeviceAssociatedMonitors('10.47.5.5.130000000001');
        break;
      case 'monitors-performance':
        obs$ = this.api.getPerformanceMonitors('10.1.19.30.160000000001', 'Server', 'Linux');
        break;
      case 'top-devices-interface-down':
        obs$ = this.api.getTopDevicesByAlarms('Interface Down');
        break;
      case 'top-devices-device-down':
        obs$ = this.api.getTopDevicesByAlarms('Device Down');
        break;
      case 'ping-device':
        obs$ = this.api.postPingResponse('10.47.5.5.130000000001');
        break;
      case 'trace-device':
        obs$ = this.api.postTraceResponse('10.47.5.5.130000000001');
        break;
      case 'events-all':
        obs$ = this.api.getEvents();
        break;
      case 'events-device-down':
        obs$ = this.api.getEvents({ eventType: 'Device Down' });
        break;
      case 'events-interface-down':
        obs$ = this.api.getEvents({ eventType: 'Interface Down' });
        break;
      default:
        this.error = 'Endpoint no reconocido';
        this.loading = false;
        return;
    }

    obs$.subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = String(err);
        this.loading = false;
      },
    });
  }
}
