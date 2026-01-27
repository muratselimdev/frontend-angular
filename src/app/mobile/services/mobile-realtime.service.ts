import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MobileRealtimeService {

  private hub!: signalR.HubConnection;

  private homeInvalidatedSource = new BehaviorSubject<void>(undefined);
  homeInvalidated$ = this.homeInvalidatedSource.asObservable();

  connect() {
    if (this.hub) return;

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/mobile`)
      .withAutomaticReconnect()
      .build();

    this.hub.start()
      .then(() => {
        console.log('[MobileHub] Connected');
        this.hub.invoke('JoinHomeGroup');
      })
      .catch(err => console.error('[MobileHub] Connection error', err));

    this.hub.on('HomeInvalidated', (payload) => {
      console.log('[MobileHub] Home invalidated:', payload);
      this.homeInvalidatedSource.next();
    });
  }
}
