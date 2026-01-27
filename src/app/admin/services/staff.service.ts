import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private base = `${environment.apiUrl}/api/admin/staff`;

  constructor(private http: HttpClient) {}

  list(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  listByRole(role: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}?role=${role}`);
  }

  get(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.base, data);
  }

  update(id: number, data: any): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}`, data);
  }
}
