import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgentCall } from '../models/agent-call.model';

@Injectable({
  providedIn: 'root'
})
export class SalesManagerService {
  private baseUrl = `${environment.apiUrl}/api/supervisor/calls`;

  constructor(private http: HttpClient) {}

  // 🔹 1. Şubedeki tüm dil gruplarının bekleyen çağrılarını getir
  getPendingCalls(): Observable<AgentCall[]> {
    return this.http.get<AgentCall[]>(`${this.baseUrl}/pending`);
  }

  // 🔹 2. Dil grubuna göre çağrıları listele
  getCallsByLangGroup(langGroupId: number): Observable<AgentCall[]> {
    return this.http.get<AgentCall[]>(`${this.baseUrl}/group/${langGroupId}`);
  }

  // 🔹 3. Çağrı detayını getir
  getCallDetail(id: number): Observable<AgentCall> {
    return this.http.get<AgentCall>(`${this.baseUrl}/${id}`);
  }

  // 🔹 4. Manuel çağrı ataması (Sales Manager)
  assignCall(callId: number, agentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${callId}/assign/${agentId}`, {});
  }

  // 🔹 5. Dashboard istatistikleri
  getCallStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats`);
  }

  // 🔹 6. Çağrı geçmişi (timeline)
  getCallHistory(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/history`);
  }
}
