import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  name = '';

  constructor(public navCtrl: NavController, private socket: Socket) {

  }

  setName() {
    this.socket.connect();
    this.socket.emit('set-nickname', this.name);
    this.navCtrl.push('RoomsListPage', { name: this.name })
  }
}
