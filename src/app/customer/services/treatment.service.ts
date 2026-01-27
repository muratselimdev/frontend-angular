import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TreatmentService {
  private groupUrl = `${environment.apiUrl}/api/treatments/groups`;
  private treatmentsUrl = `${environment.apiUrl}/api/treatments`;

  constructor(private http: HttpClient) {}

  getGroups(): Observable<any[]> {
    return this.http.get<any[]>(this.groupUrl, { withCredentials: true });
  }

  getByGroup(groupId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.treatmentsUrl}/by-group/${groupId}`, { withCredentials: true });
  }
}
