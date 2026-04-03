import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { map, shareReplay } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryItem } from '../models/category-item.model';

@Injectable({ providedIn: 'root' })
export class CategoryItemService {
  private baseUrl = `${environment.apiUrl}/api/admin/category-items`;
  private categoryItemsCache$?: Observable<CategoryItem[]>;

  constructor(private http: HttpClient) {}

  private unwrapList(payload: any): any[] {
    const raw = payload?.data ?? payload?.result ?? payload?.items ?? payload;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (Array.isArray(raw?.$values)) {
      return raw.$values;
    }
    return [];
  }

  private mapFromApi(item: any): CategoryItem {
    return {
      id: Number(item?.id ?? item?.Id ?? 0),
      categoryId: Number(item?.categoryId ?? item?.CategoryId ?? 0),
      name: String(item?.name ?? item?.Name ?? ''),
      description: String(item?.description ?? item?.Description ?? ''),
      icon: String(item?.icon ?? item?.Icon ?? ''),
      image: String(item?.image ?? item?.Image ?? item?.imageUrl ?? item?.ImageUrl ?? ''),
      isActive: Boolean(item?.isActive ?? item?.IsActive ?? true),
      createdAt: item?.createdAt ?? item?.CreatedAt,
      updatedAt: item?.updatedAt ?? item?.UpdatedAt,
    };
  }

  private toFormData(data: {
    categoryId: number;
    name: string;
    description?: string;
    icon?: string;
    image?: string;
    isActive: boolean;
    imageFile?: File;
  }): FormData {
    const formData = new FormData();
    formData.append('CategoryId', String(data.categoryId));
    formData.append('Name', data.name ?? '');
    formData.append('Description', data.description ?? '');
    formData.append('Icon', data.icon ?? '');
    formData.append('ImageUrl', data.image ?? '');
    formData.append('IsActive', String(data.isActive));

    if (data.imageFile) {
      formData.append('image', data.imageFile);
    }

    return formData;
  }

  getAll(categoryId?: number): Observable<CategoryItem[]> {
    if (categoryId) {
      return this.http.get<any>(this.baseUrl, {
        params: { categoryId: categoryId.toString() }
      }).pipe(map((payload) => this.unwrapList(payload).map((item) => this.mapFromApi(item))));
    }
    return this.http.get<any>(this.baseUrl).pipe(
      map((payload) => this.unwrapList(payload).map((item) => this.mapFromApi(item)))
    );
  }

  getAllCached(forceRefresh = false): Observable<CategoryItem[]> {
    if (!this.categoryItemsCache$ || forceRefresh) {
      this.categoryItemsCache$ = this.getAll().pipe(shareReplay(1));
    }
    return this.categoryItemsCache$;
  }

  getByCategoryId(categoryId: number): Observable<CategoryItem[]> {
    return this.getAll(categoryId);
  }

  getById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map((payload) => {
        const raw = payload?.data ?? payload?.result ?? payload?.item ?? payload;
        return this.mapFromApi(raw);
      })
    );
  }

  create(data: {
    categoryId: number;
    name: string;
    description?: string;
    icon?: string;
    image?: string;
    isActive: boolean;
    imageFile?: File;
  }) {
    const body = this.toFormData(data);
    return this.http.post(`${this.baseUrl}/create`, body).pipe(
      catchError((err) => {
        // Fallback for endpoints that still expect JSON payload.
        if (err?.status === 400 || err?.status === 404 || err?.status === 405) {
          const fallbackBody = {
            categoryId: data.categoryId,
            name: data.name,
            description: data.description ?? '',
            icon: data.icon ?? '',
            image: data.image ?? '',
            isActive: !!data.isActive,
          };
          return this.http.post(`${this.baseUrl}/create`, fallbackBody);
        }
        return throwError(() => err);
      })
    );
  }

  update(id: number, data: {
    categoryId: number;
    name: string;
    description?: string;
    icon?: string;
    image?: string;
    isActive: boolean;
    imageFile?: File;
  }) {
    const body = this.toFormData(data);
    return this.http.put(`${this.baseUrl}/update/${id}`, body).pipe(
      catchError((err) => {
        if (err?.status === 400 || err?.status === 404 || err?.status === 405) {
          const fallbackBody = {
            categoryId: data.categoryId,
            name: data.name,
            description: data.description ?? '',
            icon: data.icon ?? '',
            image: data.image ?? '',
            isActive: !!data.isActive,
          };
          return this.http.put(`${this.baseUrl}/update/${id}`, fallbackBody);
        }
        return throwError(() => err);
      })
    );
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  toggle(id: number) {
    return this.http.patch(`${this.baseUrl}/${id}/toggle`, {});
  }
}
