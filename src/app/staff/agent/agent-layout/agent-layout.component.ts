import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AgentNotificationService } from '../../services/agent-notification.service';
import { ChatService } from '../../../shared/services/chat.service';
import { VoiceService } from '../../../shared/services/voice.service';
import { ToastrService } from 'ngx-toastr';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-agent-layout',
  templateUrl: './agent-layout.component.html',
  styleUrl: './agent-layout.component.css',
  standalone: false
})
export class AgentLayoutComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [
    { label: 'Talepler', path: '/agent/calls', icon: '📋' },
    { label: 'Mesajlar', path: '/agent/chat', icon: '💬' },
    { label: 'Sesli Arama', path: '/agent/voice', icon: '🎤' }
  ];

  incomingVisible = false;
  callerName = '';
  callActive = false;
  currentIncomingCall: any = null;
  private agentId!: number;

  constructor(
    private auth: AuthService,
    public router: Router,
    private chatService: ChatService,
    private voiceService: VoiceService,
    private notifyService: AgentNotificationService,
    private http: HttpClient,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  async ngOnInit() {
    // 🔒 Giriş kontrolü
    if (!this.auth.isLoggedIn || this.auth.profile?.role?.toLowerCase() !== 'agent') {
      this.router.navigate(['/login']);
      return;
    }

    const token = this.auth.token;
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.agentId = this.getAgentIdFromToken();
    if (!this.agentId) {
      console.error('[AgentLayout] Token’dan agentId alınamadı.');
      this.router.navigate(['/login']);
      return;
    }

    // 🔌 SignalR bağlantılarını başlat
    this.chatService.startConnection(token, 'agent', this.agentId);
    await this.voiceService.startConnection(token, 'agent', this.agentId);
    await this.notifyService.startConnection(token);

    console.log(`[AgentLayout] ✅ Agent #${this.agentId} için bağlantılar aktif.`);

    // 🔚 Tarayıcı kapanışı logout
    window.addEventListener('beforeunload', () => {
      this.http
        .post(`${environment.apiUrl}/api/staff/auth/logout`, {}, { withCredentials: true })
        .subscribe();
    });

    // 📞 Gelen çağrılar
    this.voiceService.incomingCall.subscribe((call: any) => {
      const fromId = call.fromUserId ?? call.FromUserId;
      const requestId = call.requestId ?? call.RequestId;

      if (fromId === this.agentId) {
        console.log('[AgentLayout] 🔇 Kendi başlattığım çağrı (popup gösterilmeyecek).');
        return;
      }

      console.log('[AgentLayout] ⚡ VoiceIncomingCall alındı:', call);

      this.zone.run(() => {
        this.incomingVisible = true;
        this.callerName = `Kullanıcı #${fromId}`;
        this.currentIncomingCall = { requestId, fromUserId: fromId };
        this.toastr.info(`${this.callerName} seni arıyor...`, '📞 Gelen Çağrı');
      });
    });

    // 📴 Çağrı sonlandırıldığında
    this.voiceService.callEnded.subscribe((userId: number) => {
      this.zone.run(() => {
        this.incomingVisible = false;
        this.callActive = false;
        this.currentIncomingCall = null;
        this.toastr.warning(`Kullanıcı #${userId} çağrıyı sonlandırdı.`, '🛑 Arama Bitti');
      });
    });

    // 🎧 Çağrı durumu (aktif/pasif)
    this.voiceService.onCallActive.subscribe(isActive => {
      this.zone.run(() => {
        this.callActive = isActive;
      });
    });
  }

  ngOnDestroy() {
    this.notifyService.stopConnection();
    this.chatService.stopConnection();
  }

  private getAgentIdFromToken(): number {
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) return 0;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return parseInt(payload.sub || payload.nameid || '0', 10);
    } catch {
      return 0;
    }
  }

  // ✅ Çağrı kabul edildi
  onAcceptCall() {
    if (!this.currentIncomingCall) {
      this.toastr.warning('Çağrı bilgisi eksik, kabul edilemiyor.');
      return;
    }

    const { requestId, fromUserId } = this.currentIncomingCall;

    console.log(`[AgentLayout] ✅ Çağrı kabul edildi Req:${requestId}, From:${fromUserId}`);
    this.toastr.success('Çağrı kabul edildi, mikrofon açılıyor...', '🎧');

    this.zone.run(() => {
      this.incomingVisible = false;
      this.callActive = true;
    });

    this.voiceService.acceptCall(requestId, fromUserId);
  }

  // ❌ Çağrı reddedildi
  onRejectCall() {
    if (!this.currentIncomingCall) {
      this.toastr.warning('Çağrı reddedildi (bilgi eksik).');
      return;
    }

    const { requestId } = this.currentIncomingCall;
    console.log(`[AgentLayout] ❌ Çağrı reddedildi Req:${requestId}`);

    this.voiceService.endCall(requestId);
    this.toastr.warning('Çağrı reddedildi.', '📵');

    this.zone.run(() => {
      this.incomingVisible = false;
      this.currentIncomingCall = null;
    });
  }

  // 🛑 Çağrı sonlandır
  endCall() {
    this.voiceService.endCall();
    this.zone.run(() => {
      this.callActive = false;
      this.currentIncomingCall = null;
    });
    this.toastr.info('Çağrı sonlandırıldı.', '🛑');
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
