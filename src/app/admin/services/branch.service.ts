import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Branch } from '../models/branch.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private base = `${environment.apiUrl}/api/admin/branches`;

  constructor(private http: HttpClient) {}

  list(): Observable<Branch[]> {
    return this.http.get<Branch[]>(this.base);
  }

  get(id: number): Observable<Branch> {
    return this.http.get<Branch>(`${this.base}/${id}`);
  }

  create(data: Partial<Branch>): Observable<Branch> {
    return this.http.post<Branch>(this.base, data);
  }

  update(id: number, data: Partial<Branch>): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}`, data);
  }
}
