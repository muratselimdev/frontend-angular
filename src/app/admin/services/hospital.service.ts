import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Hospital } from '../models/hospital.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HospitalService {
    private base = `${environment.apiUrl}/api/admin/hospitals`;

  constructor(private http: HttpClient) {}

  list(): Observable<Hospital[]> {
    return this.http.get<Hospital[]>(this.base);
  }

  create(data: Partial<Hospital>): Observable<Hospital> {
    return this.http.post<Hospital>(this.base, data);
  }

  update(id: number, data: Partial<Hospital>): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}`, data);
  }
}
