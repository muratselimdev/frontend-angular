import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Populer } from '../models/populer.model';

@Injectable({ providedIn: 'root' })
export class PopulerService {
  private baseUrl = `${environment.apiUrl}/api/admin/populers`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Populer[]>(this.baseUrl);
  }

  getById(id: number) {
    return this.http.get<Populer>(`${this.baseUrl}/${id}`);
  }

  create(data: any) {
    return this.http.post(`${this.baseUrl}/create`, data);
  }

  update(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/update/${id}`, data);
  }

  toggle(id: number) {
    return this.http.patch(`${this.baseUrl}/${id}/toggle`, {});
  }
}
