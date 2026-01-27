import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AgentNotificationService {
  private hub!: signalR.HubConnection;
  private connected = false;

  constructor(private toastr: ToastrService) {}

  // 🔹 Bağlantıyı başlat
  async startConnection(token: string): Promise<void> {
    if (this.connected) return;

    const hubUrl = `${environment.apiUrl}/hubs/chat`; // aynı ChatHub kullanıyoruz

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hub.on('RequestAssigned', (req: any) => this.onRequestAssigned(req));

    try {
      await this.hub.start();
      this.connected = true;
      console.log('✅ Agent Notification Hub connected.');
    } catch (err) {
      console.error('❌ Hub connection error:', err);
    }
  }

  // 🔹 Bağlantıyı durdur
  stopConnection() {
    if (this.hub && this.connected) {
      this.hub.stop();
      this.connected = false;
    }
  }

  // 🔔 Yeni talep bildirimi alındığında
  private onRequestAssigned(req: any) {
    console.log('📩 Yeni Talep Atandı:', req);

    const msg = `Yeni talep atandı: ${req.treatment || 'Tedavi bilgisi yok'} (${req.language || '-'})`;

    this.toastr.info(msg, '📢 Yeni Talep', {
      timeOut: 8000,
      progressBar: true,
      closeButton: true,
      positionClass: 'toast-top-right',
    });

    // 👉 İsteğe bağlı olarak popup modal tetiklenebilir
    // this.showRequestModal(req);
  }

  // (İsteğe bağlı) popup modal örneği:
  // private showRequestModal(req: any) {
  //   alert(`Yeni talep geldi!\nTedavi: ${req.treatment}\nDil: ${req.language}`);
  // }
}
