import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryItem } from '../models/category-item.model';

@Injectable({ providedIn: 'root' })
export class CategoryItemService {
  private baseUrl = `${environment.apiUrl}/api/admin/category-items`;

  constructor(private http: HttpClient) {}

  getAll(categoryId?: number): Observable<CategoryItem[]> {
    if (categoryId) {
      return this.http.get<CategoryItem[]>(this.baseUrl, {
        params: { categoryId: categoryId.toString() }
      });
    }
    return this.http.get<CategoryItem[]>(this.baseUrl);
  }

  getByCategoryId(categoryId: number): Observable<CategoryItem[]> {
    return this.getAll(categoryId);
  }

  getById(id: number) {
    return this.http.get<CategoryItem>(`${this.baseUrl}/${id}`);
  }

  create(data: any) {
    return this.http.post(`${this.baseUrl}/create`, data);
  }

  update(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/update/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  toggle(id: number) {
    return this.http.patch(`${this.baseUrl}/${id}/toggle`, {});
  }
}
