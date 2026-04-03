import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private baseUrl = `${environment.apiUrl}/api/admin/categories`;
  private categoriesCache$?: Observable<Category[]>;

  constructor(private http: HttpClient) {}

  private normalizeList(payload: any): any[] {
    const raw = payload?.data ?? payload?.result ?? payload?.items ?? payload;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (Array.isArray(raw?.$values)) {
      return raw.$values;
    }
    return [];
  }

  private mapCategory(item: any): Category {
    return {
      id: Number(item?.id ?? item?.Id ?? 0),
      name: String(item?.name ?? item?.Name ?? ''),
      description: String(item?.description ?? item?.Description ?? ''),
      icon: String(item?.icon ?? item?.Icon ?? ''),
      color: String(item?.color ?? item?.Color ?? ''),
      isActive: Boolean(item?.isActive ?? item?.IsActive ?? true),
    };
  }

  getAll(): Observable<Category[]> {
    return this.http.get<any>(this.baseUrl).pipe(
      map((payload) => this.normalizeList(payload).map((item) => this.mapCategory(item)))
    );
  }

  getAllCached(forceRefresh = false): Observable<Category[]> {
    if (!this.categoriesCache$ || forceRefresh) {
      this.categoriesCache$ = this.getAll().pipe(shareReplay(1));
    }
    return this.categoriesCache$;
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
