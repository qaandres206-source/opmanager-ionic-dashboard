import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InterfacesPage } from './interfaces.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { InterfacesPageRoutingModule } from './interfaces-routing.module';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    InterfacesPageRoutingModule,
    ScrollingModule,
    InterfacesPage,
  ],
})
export class InterfacesPageModule {}
