import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Campaing } from '../models/campaing.model';

@Injectable({ providedIn: 'root' })
export class CampaignService {
private baseUrl = `${environment.apiUrl}/api/admin/campaigns`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Campaing[]>(this.baseUrl);
  }

  getById(id: number) {
    return this.http.get<Campaing>(`${this.baseUrl}/${id}`);
  }

  create(data: any) {
    return this.http.post(`${this.baseUrl}/create`, data);
  }

update(id: number, formData: FormData) {
  return this.http.put(`${this.baseUrl}/update/${id}`, formData);
}

toggle(id: number) {
    return this.http.patch(`${this.baseUrl}/${id}/toggle`, {});
  }
}
