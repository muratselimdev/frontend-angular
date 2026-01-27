import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateSupervisorDto, SupervisorVm, UpdateSupervisorDto } from '../models/staff.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupervisorsService {
  private base = `${environment.apiUrl}/api/admin/supervisors`;
  constructor(private http: HttpClient) {}

  list(filters?: { branchId?: number; languageGroupId?: number }) {
    let params = new HttpParams();
    if (filters?.branchId) params = params.set('branchId', filters.branchId);
    if (filters?.languageGroupId) params = params.set('languageGroupId', filters.languageGroupId);
    return this.http.get<SupervisorVm[]>(this.base, { params });
  }

  get(id: number) { return this.http.get<SupervisorVm>(`${this.base}/${id}`); }
  create(dto: CreateSupervisorDto) { return this.http.post<any>(this.base, dto); }
  update(id: number, dto: UpdateSupervisorDto) { return this.http.patch(`${this.base}/${id}`, dto); }
}
