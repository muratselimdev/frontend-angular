import { HttpClient, HttpParams } from '@angular/common/http'; // + HttpParams
import { Injectable } from '@angular/core';
import { Branch, LanguageGroup } from '../models/staff.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LookupsService {
  private base = `${environment.apiUrl}/api/admin`;
  constructor(private http: HttpClient) {}

  branches() {
    return this.http.get<Branch[]>(`${this.base}/branches`);
  }

  // 🔽 filtre destekli
  languageGroups(filters?: { isActive?: boolean; q?: string }) {
    let params = new HttpParams();
    if (filters?.isActive !== undefined) params = params.set('isActive', String(filters.isActive));
    if (filters?.q) params = params.set('q', filters.q);
    return this.http.get<LanguageGroup[]>(`${this.base}/language-groups`, { params });
  }
}
