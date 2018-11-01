import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RoomsListPage } from './rooms-list';

@NgModule({
  declarations: [
    RoomsListPage,
  ],
  imports: [
    IonicPageModule.forChild(RoomsListPage),
  ],
})
export class RoomsListPageModule {}
