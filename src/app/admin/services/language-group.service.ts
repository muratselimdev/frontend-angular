import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LanguageGroup } from '../models/language-group.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LanguageGroupService {
    private base = `${environment.apiUrl}/api/admin/language-groups`;

  constructor(private http: HttpClient) {}

  list(): Observable<LanguageGroup[]> {
    return this.http.get<LanguageGroup[]>(this.base);
  }

  get(id: number): Observable<LanguageGroup> {
    return this.http.get<LanguageGroup>(`${this.base}/${id}`);
  }

  create(data: Partial<LanguageGroup>): Observable<LanguageGroup> {
    return this.http.post<LanguageGroup>(this.base, data);
  }

  update(id: number, data: Partial<LanguageGroup>): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}`, data);
  }
}
