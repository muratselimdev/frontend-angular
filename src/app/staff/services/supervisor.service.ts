import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AgentCall } from '../models/agent-call.model';
import { AgentVm } from '../../admin/models/staff.models';

@Injectable({ providedIn: 'root' })
export class SupervisorService {
  private baseUrl = `${environment.apiUrl}/api/supervisor/calls`;

  constructor(private http: HttpClient) {}

    private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // login sonrası kaydedilen token
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Bekleyen çağrılar
  getPendingCalls(): Observable<AgentCall[]> {
    return this.http.get<AgentCall[]>(`${this.baseUrl}/pending`, { withCredentials: true });
  }

  // Detay
  getCallDetail(id: number): Observable<AgentCall> {
    return this.http.get<AgentCall>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  // İstatistikler
  getStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats`, { withCredentials: true });
  }

  // Manuel çağrı atama
  assignCall(callId: number, agentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${callId}/assign/${agentId}`, {}, { withCredentials: true });
  }

  getAgents(): Observable<AgentVm[]> {
  return this.http.get<AgentVm[]>(`${environment.apiUrl}/api/supervisor/agents`, { withCredentials: true });
  }
}
