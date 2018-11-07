import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Socket } from 'ng-socket-io';

/**
 * Generated class for the RoomsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-rooms-list',
  templateUrl: 'rooms-list.html',
})
export class RoomsListPage {
  rooms = [];
  nickname: String;

  constructor(public navCtrl: NavController, public navParams: NavParams, private socket: Socket) {
    this.nickname = this.navParams.get('name');
    this.socket.on('newRoom', addedRoom => {
      this.rooms.push({
        roomName: addedRoom
      })
    })
  }

  addRoom() {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RoomsListPage');
  }

}
