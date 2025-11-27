import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'api/:id',
    loadChildren: () => import('./api-explorer/api-explorer.module').then(m => m.ApiExplorerPageModule),
  },
  {
    path: 'sre-audit',
    loadChildren: () => import('./sre-audit/sre-audit.module').then(m => m.SreAuditPageModule),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
