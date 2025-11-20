import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SreAuditService, SreAuditLogEntry } from '../services/sre-audit.service';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-sre-audit',
  templateUrl: './sre-audit.page.html',
  styleUrls: ['./sre-audit.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, AsyncPipe, NgForOf, NgIf],
})
export class SreAuditPage {
  logs$ = this.audit.logs$;
  running$ = this.audit.running$;
  summary$ = this.audit.summary$;
  error$ = this.audit.error$;
  mode$ = this.audit.mode$;

  constructor(private audit: SreAuditService) {}

  runQuick() {
    this.audit.startQuickMode().subscribe();
  }

  runFull() {
    this.audit.startFullProcess().subscribe();
  }

  exportToCsv() {
    const summary = this.audit.summary$.value;
    if (!summary) {
      // Nothing to export yet
      return;
    }

    const escape = (value: any): string => {
      const str = value == null ? '' : String(value);
      // Surround with quotes if it contains separators or quotes
      if (/[,;"\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows: string[] = [];

    // Executive summary section
    rows.push('Resumen Ejecutivo');
    rows.push('Total dispositivos;Total interfaces;Sin monitoreo;Interfaces DOWN');
    rows.push([
      summary.devices.length,
      summary.totalInterfaces,
      summary.totalUnmonitored,
      summary.totalDown,
    ].map(escape).join(';'));
    rows.push('');

    // Devices section
    rows.push('Dispositivos');
    rows.push('displayName;deviceName;ipaddress;statusStr;category;type');
    summary.devices.forEach((d) => {
      rows.push([
        d.displayName || d.deviceName || d['name'] || '',
        d.deviceName || '',
        d.ipaddress || d['ip'] || '',
        d.statusStr || '',
        d.category || '',
        d.type || '',
      ].map(escape).join(';'));
    });
    rows.push('');

    // Interfaces section
    rows.push('Interfaces');
    rows.push('deviceName;interfaceName;ipaddress;type;status;managed');
    summary.interfaces.forEach((i: any) => {
      const isManaged =
        i.managed === 'true' || i.managed === true ||
        i.isManaged === 'true' || i.isManaged === true ||
        i.monitor === 'true' || i.monitor === true;
      rows.push([
        i.deviceName || i.displayName || '',
        i.interfaceDisplayName || i.name || '',
        i.ipAddress || i.ipaddress || '',
        i.type || i.interfaceType || '',
        i.status || i.operStatus || '',
        isManaged ? 'Yes' : 'No',
      ].map(escape).join(';'));
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'opmanager_sre_audit.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  trackLog(_index: number, item: SreAuditLogEntry) {
    return item.timestamp?.toISOString?.() + item.message;
  }
}
