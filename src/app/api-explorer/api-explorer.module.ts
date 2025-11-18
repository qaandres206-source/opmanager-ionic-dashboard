import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ApiExplorerPage } from './api-explorer.page';

const routes: Routes = [
  {
    path: '',
    component: ApiExplorerPage,
  },
];

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
})
export class ApiExplorerPageModule {}
