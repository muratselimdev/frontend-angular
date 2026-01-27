import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Clinic } from '../models/clinic.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClinicService {
  private base = `${environment.apiUrl}/api/admin/clinics`;

  constructor(private http: HttpClient) {}

  list(): Observable<Clinic[]> {
    return this.http.get<Clinic[]>(this.base);
  }

  create(data: Partial<Clinic>): Observable<Clinic> {
    return this.http.post<Clinic>(this.base, data);
  }

  update(id: number, data: Partial<Clinic>): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}`, data);
  }
}
