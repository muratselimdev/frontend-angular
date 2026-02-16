import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryItemDetail } from '../models/category-item-detail.model';

@Injectable({ providedIn: 'root' })
export class CategoryItemDetailService {
  private baseUrl = `${environment.apiUrl}/api/admin/category-item-details`;

  constructor(private http: HttpClient) {}

  getAll(categoryItemId?: number): Observable<CategoryItemDetail[]> {
    if (categoryItemId) {
      return this.http.get<CategoryItemDetail[]>(this.baseUrl, {
        params: { categoryItemId: categoryItemId.toString() }
      });
    }
    return this.http.get<CategoryItemDetail[]>(this.baseUrl);
  }

  getByCategoryItemId(categoryItemId: number): Observable<CategoryItemDetail[]> {
    return this.getAll(categoryItemId);
  }

  getById(id: number) {
    return this.http.get<CategoryItemDetail>(`${this.baseUrl}/${id}`);
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
