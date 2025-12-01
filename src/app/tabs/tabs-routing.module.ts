import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'devices',
        loadChildren: () => import('../devices/tab1.module').then(m => m.Tab1PageModule)
      },
      {
        path: 'alerts',
        loadChildren: () => import('../alerts/tab2.module').then(m => m.Tab2PageModule)
      },
      {
        path: 'health',
        loadChildren: () => import('../health/tab3.module').then(m => m.Tab3PageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('../settings/settings.module').then(m => m.SettingsPageModule)
      },
      {
        path: 'tab3',
        loadChildren: () => import('../health/tab3.module').then(m => m.Tab3PageModule)
      },
      {
        path: 'interfaces',
        loadChildren: () => import('../interfaces/interfaces.module').then(m => m.InterfacesPageModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('../reports/reports.module').then(m => m.ReportsPageModule)
      },
      {
        path: 'sre-audit',
        loadChildren: () => import('../sre-audit/sre-audit.module').then(m => m.SreAuditPageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/settings',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/settings',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule { }
