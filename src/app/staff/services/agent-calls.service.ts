import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgentCall } from '../models/agent-call.model';

@Injectable({
  providedIn: 'root'
})
export class AgentCallsService {
  private baseUrl = `${environment.apiUrl}/api/agent/calls`;
  private supervisorUrl = `${environment.apiUrl}/api/supervisor/calls`;

  constructor(private http: HttpClient) {}

  // 🔹 1. Agent → Kendi çağrılarını getir
  getMyCalls(): Observable<AgentCall[]> {
    return this.http.get<AgentCall[]>(`${this.baseUrl}`);
  }

  // 🔹 2. Agent → Çağrı detayını getir
  getCallDetail(id: number): Observable<AgentCall> {
    return this.http.get<AgentCall>(`${this.baseUrl}/${id}`);
  }

  // 🔹 3. Agent → Klinik/Hastane/Otel ataması güncelle
  updateAssignments(id: number, payload: any): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/assignments`, payload);
  }

  // 🔹 4. Supervisor/SalesManager → Bekleyen çağrılar (unassigned)
  getPendingCalls(): Observable<AgentCall[]> {
    return this.http.get<AgentCall[]>(`${this.supervisorUrl}/pending`);
  }

  // 🔹 5. Supervisor/SalesManager → Çağrıyı manuel atama
  assignCall(callId: number, agentId: number): Observable<any> {
    return this.http.post(`${this.supervisorUrl}/${callId}/assign/${agentId}`, {});
  }

  // 🔹 6. Supervisor/SalesManager → Çağrı detayını getir
  getSupervisorCallDetail(id: number): Observable<any> {
    return this.http.get(`${this.supervisorUrl}/${id}`);
  }

  // 🔹 7. Supervisor/SalesManager → Çağrı geçmişini (timeline) getir
  getCallHistory(id: number): Observable<any> {
    return this.http.get(`${this.supervisorUrl}/${id}/history`);
  }

  // 🔹 8. Supervisor/SalesManager → Dashboard istatistikleri
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.supervisorUrl}/stats`);
  }

  // 🔹 9. SalesManager → Dil grubuna göre çağrıları listele
  getCallsByLanguageGroup(langGroupId: number): Observable<AgentCall[]> {
    return this.http.get<AgentCall[]>(`${this.supervisorUrl}/group/${langGroupId}`);
  }
}
