import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CategoryItemDetail } from '../models/category-item-detail.model';

@Injectable({ providedIn: 'root' })
export class CategoryItemDetailService {
  private baseUrl = `${environment.apiUrl}/api/admin/category-item-details`;

  constructor(private http: HttpClient) {}

  private unwrapItem(payload: any): any {
    return payload?.data ?? payload?.result ?? payload?.item ?? payload;
  }

  private unwrapList(payload: any): any[] {
    const raw = payload?.data ?? payload?.result ?? payload?.items ?? payload;
    return Array.isArray(raw) ? raw : [];
  }

  private mapFromApi(item: any): CategoryItemDetail {
    const src = this.unwrapItem(item);

    const mapped: CategoryItemDetail = {
      id: src.id ?? src.Id,
      categoryItemId: src.categoryItemId ?? src.CategoryItemId,
      label: src.label ?? src.Label ?? src.title ?? src.Title ?? '',
      detail: src.detail ?? src.Detail ?? src.description ?? src.Description ?? src.content ?? src.Content ?? '',
      imageUrl: src.imageUrl ?? src.ImageUrl ?? src.image ?? src.Image ?? '',
      videoUrl: src.videoUrl ?? src.VideoUrl ?? '',
      isActive: src.isActive ?? src.IsActive ?? true,
      createdAt: src.createdAt ?? src.CreatedAt,
      updatedAt: src.updatedAt ?? src.UpdatedAt,

      // Keep legacy properties populated so existing UI doesn't break.
      title: src.title ?? src.Title ?? src.label ?? src.Label ?? '',
      description: src.description ?? src.Description ?? src.detail ?? src.Detail ?? '',
      content: src.content ?? src.Content ?? src.detail ?? src.Detail ?? '',
      image: src.image ?? src.Image ?? src.imageUrl ?? src.ImageUrl ?? ''
    };

    return mapped;
  }

  private toFormData(data: {
    id?: number;
    categoryItemId: number;
    label: string;
    detail?: string;
    imageUrl?: string;
    videoUrl?: string;
    isActive: boolean;
    imageFile?: File;
  }): FormData {
    const formData = new FormData();
    if (data.id !== undefined && data.id !== null) {
      formData.append('Id', String(data.id));
      formData.append('id', String(data.id));
    }
    formData.append('CategoryItemId', String(data.categoryItemId));
    formData.append('Label', data.label ?? '');
    formData.append('Detail', data.detail ?? '');
    formData.append('ImageUrl', data.imageUrl ?? '');
    formData.append('VideoUrl', data.videoUrl ?? '');
    formData.append('IsActive', String(data.isActive));

    if (data.imageFile) {
      formData.append('image', data.imageFile);
    }

    return formData;
  }

  private isRouteOrMethodError(err: any): boolean {
    return err?.status === 404 || err?.status === 405;
  }

  getAll(categoryItemId?: number): Observable<CategoryItemDetail[]> {
    if (categoryItemId) {
      return this.http.get<any>(this.baseUrl, {
        params: { categoryItemId: categoryItemId.toString() }
      }).pipe(map(payload => this.unwrapList(payload).map(item => this.mapFromApi(item))));
    }
    return this.http.get<any>(this.baseUrl).pipe(
      map(payload => this.unwrapList(payload).map(item => this.mapFromApi(item)))
    );
  }

  getByCategoryItemId(categoryItemId: number): Observable<CategoryItemDetail[]> {
    return this.getAll(categoryItemId);
  }

  getById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(payload => this.mapFromApi(this.unwrapItem(payload)))
    );
  }

  create(data: {
    categoryItemId: number;
    label: string;
    detail?: string;
    imageUrl?: string;
    videoUrl?: string;
    isActive: boolean;
    imageFile?: File;
  }) {
    return this.http.post(`${this.baseUrl}/create`, this.toFormData(data)).pipe(
      catchError((err) => {
        if (err?.status === 404 || err?.status === 405) {
          return this.http.post(this.baseUrl, this.toFormData(data));
        }
        return throwError(() => err);
      })
    );
  }

  update(id: number, data: {
    categoryItemId: number;
    label: string;
    detail?: string;
    imageUrl?: string;
    videoUrl?: string;
    isActive: boolean;
    imageFile?: File;
  }) {
    // Backend currently exposes only POST /create for writes on this resource.
    return this.http.post(`${this.baseUrl}/create`, this.toFormData({ ...data, id })).pipe(
      catchError((err) => {
        if (this.isRouteOrMethodError(err)) {
          return this.http.post(this.baseUrl, this.toFormData({ ...data, id }));
        }
        return throwError(() => err);
      })
    );
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  toggle(id: number) {
    return this.getById(id).pipe(
      switchMap((item) => this.update(id, {
        categoryItemId: Number(item.categoryItemId),
        label: item.label ?? item.title ?? '',
        detail: item.detail ?? item.description ?? item.content ?? '',
        imageUrl: item.imageUrl ?? item.image ?? '',
        videoUrl: item.videoUrl ?? '',
        isActive: !Boolean(item.isActive),
      }))
    );
  }
}
