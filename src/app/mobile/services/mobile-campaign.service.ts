import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MobileCampaignService {

  private baseUrl = environment.apiUrl + '/api/campaign/mobile';

  constructor(private http: HttpClient) {}

  getActiveCampaigns() {
    return this.http.get<any[]>(`${this.baseUrl}/active`);
  }
}
