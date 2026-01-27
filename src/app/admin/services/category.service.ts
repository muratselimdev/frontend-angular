import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
private baseUrl = `${environment.apiUrl}/api/admin/categories`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<any[]>(this.baseUrl);
  }

  getById(id: number) {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
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
