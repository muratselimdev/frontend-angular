import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AgentLevel, AgentVm, CreateAgentDto, UpdateAgentDto } from '../models/staff.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AgentsService {
  private base = `${environment.apiUrl}/api/admin/agents`;
  constructor(private http: HttpClient) {}

  list(filters?: { branchId?: number; languageGroupId?: number; supervisorId?: number; level?: AgentLevel }) {
    let params = new HttpParams();
    if (filters?.branchId) params = params.set('branchId', filters.branchId);
    if (filters?.languageGroupId) params = params.set('languageGroupId', filters.languageGroupId);
    if (filters?.supervisorId) params = params.set('supervisorId', filters.supervisorId);
    if (typeof filters?.level === 'number') params = params.set('level', filters.level);
    return this.http.get<AgentVm[]>(this.base, { params });
  }

  get(id: number) { return this.http.get<AgentVm>(`${this.base}/${id}`); }
  create(dto: CreateAgentDto) { return this.http.post<any>(this.base, dto); }
  update(id: number, dto: UpdateAgentDto) { return this.http.patch(`${this.base}/${id}`, dto); }
}
