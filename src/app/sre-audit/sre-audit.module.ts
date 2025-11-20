import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SreAuditPage } from './sre-audit.page';

const routes: Routes = [
  {
    path: '',
    component: SreAuditPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes), SreAuditPage],
})
export class SreAuditPageModule {}
