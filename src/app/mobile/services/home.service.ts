import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HomeService {
  constructor(private http: HttpClient) {}

  getHome() {
    return this.http.get<any>(`${environment.apiUrl}/api/mobile/home`);
  }
}
