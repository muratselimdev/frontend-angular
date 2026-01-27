import { Component, OnInit } from '@angular/core';
import { SupervisorService } from '../../services/supervisor.service';
import { AgentCall } from '../../models/agent-call.model';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AgentVm } from '../../../admin/models/staff.models';
import { AuthService } from '../../../auth/auth.service';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

@Component({
  selector: 'app-supervisor-dashboard',
  templateUrl: './supervisor-dashboard.component.html',
  //styleUrls: ['./supervisor-dashboard.component.css'],
  standalone: false
})
export class SupervisorDashboardComponent implements OnInit {
  pendingCalls: AgentCall[] = [];
  stats: any;
  agents: any[] = [];
  private hubConnection?: HubConnection;

  constructor(
    private supervisorService: SupervisorService, 
    private http: HttpClient,
    private auth: AuthService,
  ) {}

ngOnInit(): void {
  this.loadPendingCalls();
  this.loadStats();
  this.loadAgents();
  this.startSignalR();
}

  ngOnDestroy(): void {
    this.hubConnection?.stop();
  }

  loadPendingCalls() {
    this.supervisorService.getPendingCalls().subscribe({
      next: res => (this.pendingCalls = res),
      error: err => console.error('Çağrılar alınamadı', err)
    });
  }

  loadStats() {
    this.supervisorService.getStats().subscribe({
      next: res => (this.stats = res),
      error: err => console.error('İstatistik alınamadı', err)
    });
  }

  loadAgents() {
  this.supervisorService.getAgents().subscribe({
    next: res => (this.agents = res),
    error: err => console.error('Agent listesi alınamadı', err)
  });
} 

getStatusBadge(status?: string): string {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'online': return '🟢';
    case 'busy':   return '🔴';
    default:       return '⚪';
  }
}

getStatusClass(status?: string): string {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'online': return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold';
    case 'busy': return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold';
    default: return 'bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold';
  }
}

  startSignalR() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/presence`, { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR bağlantısı kuruldu.'))
      .catch(err => console.error('SignalR bağlantı hatası:', err));

    // Supervisor dashboard: gelen anlık güncellemeleri dinle
    this.hubConnection.on('UserStatusChanged', (staffId: number, status: string) => {
      const agent = this.agents.find(a => a.id === staffId);
      if (agent) {
        agent.presenceStatus = status;
      }
    });
  }

}
