import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AgentCallsService } from '../../../services/agent-calls.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../auth/auth.service';
import { ChatService } from '../../../../shared/services/chat.service';
import { VoiceService } from '../../../../shared/services/voice.service';
import { ChatMessage } from '../../../models/chat-message.model';

@Component({
  selector: 'app-call-detail',
  templateUrl: './call-detail.component.html',
  styleUrl: './call-detail.component.css',
  standalone: false
})
export class CallDetailComponent implements OnInit, AfterViewInit, OnDestroy {

  // === AUDIO ===
  @ViewChild('localAudio') localAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('remoteAudio') remoteAudio!: ElementRef<HTMLAudioElement>;

  // === CHAT SCROLL ===
  @ViewChild('chatBox') chatBox!: ElementRef;

  callId!: number;
  requestId!: number;
  data: any;
  loading = false;

  newMessage = '';

  agentId!: number;

  callActive = false;
  incomingCall: any = null;

  selectedTabIndex = 0;
  agentStatus: 'online' | 'busy' | 'offline' = 'offline';

  constructor(
    private route: ActivatedRoute,
    private api: AgentCallsService,
    private toastr: ToastrService,
    private chatService: ChatService,
    private voiceService: VoiceService,
    private auth: AuthService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  // ===========================================================
  // INIT
  // ===========================================================
  async ngOnInit() {
    const token = this.auth.token;
    if (!token) {
      this.toastr.error('Oturum geçersiz.');
      return;
    }

    this.agentId = this.getAgentIdFromToken();

    // CHAT & VOICE connections
    this.chatService.startConnection(token, 'agent', this.agentId);
    await this.voiceService.startConnection(token, 'agent', this.agentId);

    // ==== INCOMING CALL ====
    this.voiceService.incomingCall.subscribe(call => {
      this.zone.run(() => {
        this.incomingCall = call;
        this.toastr.info('Müşteri arıyor...', '📞 Gelen Çağrı');
        this.cdr.detectChanges();
      });
    });

    // ==== CALL ACTIVE ====
    this.voiceService.onCallActive.subscribe(active => {
      this.zone.run(() => {
        this.callActive = active;
        this.cdr.detectChanges();
      });
    });

    // ==== CALL ENDED ====
    this.voiceService.callEnded.subscribe(() => {
      this.zone.run(() => {
        this.callActive = false;
        this.incomingCall = null;
        this.toastr.warning('Çağrı sonlandırıldı.');
        this.cdr.detectChanges();
      });
    });

    // ==== CHAT MESSAGES ====
    this.chatService.messages$.subscribe((msgs: ChatMessage[]) => {
      if (!this.data) return;

      this.zone.run(() => {
        this.data.messages = msgs.filter(m => m.requestId === this.requestId);

        // UI render edildikten sonra scroll
        setTimeout(() => this.scrollToBottom(), 80);

        this.cdr.detectChanges();
      });
    });

    window.addEventListener('agent-status-changed', this.onAgentStatusChanged.bind(this));

    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) {
        return;
      }

      this.zone.run(() => {
        this.callId = id;
        this.requestId = id;
        this.load();
      });
    });
  }

  // ===========================================================
  // AFTER VIEW INIT
  // ===========================================================
  ngAfterViewInit(): void {
    this.voiceService.setLocalAudioElement(this.localAudio.nativeElement);
    this.voiceService.setRemoteAudioElement(this.remoteAudio.nativeElement);

    // İlk açılışta scroll
    setTimeout(() => this.scrollToBottom(), 300);
  }

  // ===========================================================
  // DESTROY
  // ===========================================================
  ngOnDestroy() {
    this.chatService.stopConnection();
    this.voiceService.cleanup();
    window.removeEventListener('agent-status-changed', this.onAgentStatusChanged.bind(this));
  }

  // ===========================================================
  // LOAD DETAILS
  // ===========================================================
  load() {
    this.zone.run(() => {
      this.loading = true;
      this.data = null;
      this.cdr.detectChanges();
    });

    this.api.getCallDetail(this.callId).subscribe({
      next: res => {
        this.zone.run(() => {
          this.data = res;
          this.requestId = res.id;
          this.data.messages = this.data.messages || [];

          this.chatService.loadMessageHistory(this.requestId);
          this.chatService.markAllAsRead(this.requestId, this.agentId);

          this.loading = false;
          this.cdr.detectChanges();
          setTimeout(() => this.scrollToBottom(), 200);
        });
      },
      error: () => {
        this.zone.run(() => {
          this.toastr.error('Detay yüklenemedi');
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ===========================================================
  // SEND MESSAGE
  // ===========================================================
  sendMessage() {
    if (!this.newMessage.trim()) return;

    const agentId = this.data?.assignedAgent?.id ?? this.agentId;
    const customerId =
      this.data?.customer?.customerId ??
      this.data?.customerId ??
      this.data?.customer?.CustomerId;

    this.chatService
      .sendMessage(this.requestId, agentId, customerId, this.newMessage)
      .then(() => {
        this.newMessage = '';

        // mesaj gönderince scroll
        setTimeout(() => this.scrollToBottom(), 100);
      })
      .catch(() => this.toastr.error('Mesaj gönderilemedi'));
  }

  // ===========================================================
  // SCROLL FUNCTION
  // ===========================================================
  private scrollToBottom(): void {
    try {
      if (this.chatBox?.nativeElement) {
        const el = this.chatBox.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {
      console.warn('[CallDetail] scrollToBottom error:', err);
    }
  }

  // ===========================================================
  // CALL FUNCTIONS
  // ===========================================================
  async startVoiceCall() {
    const customerId =
      this.data?.customer?.customerId ??
      this.data?.customerId ??
      this.data?.customer?.CustomerId;

    if (!customerId) {
      this.toastr.warning('Müşteri bilgisi eksik.');
      return;
    }

    await this.voiceService.startCall(this.requestId, customerId);
    this.toastr.success('Sesli arama başlatıldı.');
  }

  endCall() {
    this.voiceService.endCall(this.requestId);
  }

  // ===========================================================
  // UTILS
  // ===========================================================
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

  private onAgentStatusChanged(event: any) {
    const { agentId, status } = event.detail;
    if (this.agentId === agentId) {
      this.agentStatus = status;
    }
  }

  formatDate(date?: string) {
    return date ? new Date(date).toLocaleString() : '-';
  }
}
