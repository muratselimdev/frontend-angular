import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
  ElementRef
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { ChatService } from '../../../shared/services/chat.service';
import { VoiceService } from '../../../shared/services/voice.service';
import { ChatMessage } from '../../../staff/models/chat-message.model';
import { CustomerAuthService } from '../../../customer/services/customer-auth.service';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-customer-requests',
  templateUrl: './customer-requests.component.html',
  styleUrl: './customer-requests.component.css',
  standalone: false
})
export class CustomerRequestsComponent
  implements OnInit, OnDestroy {

  // =============================================================
  // STATE
  // =============================================================
  requests: any[] = [];
  selectedRequest: any = null;

  showModal = false;
  loadingDetail = false;

  selectedFiles: File[] = [];
  selectedUploadType = '';
  newMessage = '';

  chatMessages: ChatMessage[] = [];

  customerId!: number;
  agentId!: number;

  // Controlled by VoiceService.onCallActive — shown in the in-page active call indicator
  callActive = false;

  baseUrl = `${environment.apiUrl}/api/customer/requests`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private chatService: ChatService,
    private voiceService: VoiceService,
    private auth: CustomerAuthService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  // =============================================================
  // INIT
  // =============================================================
  async ngOnInit() {
    const token = this.auth.token;
    if (!token) {
      this.toastr.error('Oturum geçersiz.');
      return;
    }

    this.customerId = this.decodeCustomerId();

    // Chat connection (voice hub is managed by CustomerLayoutComponent)
    this.chatService.startConnection(token, 'customer', this.customerId);

    // Mesajları dinle
    this.chatService.messages$.subscribe((msgs: ChatMessage[]) => {
      if (!this.selectedRequest) return;
      this.chatMessages = msgs.filter(m => m.requestId === this.selectedRequest.id);
    });

    // Talepleri yükle
    this.loadRequests();

    // Mirror call active state for the in-page active call indicator
    this.voiceService.onCallActive.subscribe(state => {
      this.zone.run(() => {
        this.callActive = state;
        this.cdr.detectChanges();
      });
    });
  }

  // =============================================================
  // DESTROY
  // =============================================================
  ngOnDestroy(): void {
    this.chatService.stopConnection();
    // Voice hub cleanup is handled by CustomerLayoutComponent
  }

  // =============================================================
  // TOKEN
  // =============================================================
  decodeCustomerId(): number {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) return 0;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return parseInt(
        payload.sub ||
          payload.nameid ||
          payload.id ||
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
          '0',
        10
      );
    } catch {
      return 0;
    }
  }

  // =============================================================
  // REQUESTS
  // =============================================================
  loadRequests() {
    this.http.get<any[]>(this.baseUrl).subscribe({
      next: res => (this.requests = res),
      error: () => this.toastr.error('Talepler yüklenemedi.')
    });
  }

  // =============================================================
  // File Upload
  // =============================================================
  onFileSelected(evt: any) {
    this.selectedFiles = Array.from(evt.target.files);
  }

  uploadSelectedFiles() {
    if (!this.selectedFiles.length || !this.selectedRequest) {
      this.toastr.warning('Dosya seçiniz.');
      return;
    }
    if (!this.selectedUploadType) {
      this.toastr.warning('Dosya türü seçiniz.');
      return;
    }

    const fd = new FormData();
    this.selectedFiles.forEach(f => fd.append('files', f));
    fd.append('type', this.selectedUploadType);

    this.http.post(`${this.baseUrl}/${this.selectedRequest.id}/attachments`, fd).subscribe({
      next: () => {
        this.toastr.success('Dosyalar yüklendi.');
        this.selectedFiles = [];
        this.selectedUploadType = '';
      },
      error: () => this.toastr.error('Dosya yüklenemedi.')
    });
  }

  // =============================================================
  // CHAT
  // =============================================================
  async sendChatMessage() {
    if (!this.newMessage.trim() || !this.selectedRequest) return;

    this.agentId =
      this.selectedRequest?.assignedAgent?.id ||
      this.selectedRequest?.assignedAgentId ||
      this.chatService.getAssignedAgentId(this.customerId) ||
      0;

    console.log('Volkan', this.selectedRequest)

    if (!this.agentId) {
      this.toastr.warning('Temsilci atanmadı.');
      return;
    }

    try {
      await this.chatService.sendMessage(
        this.selectedRequest.id,
        this.customerId,
        this.agentId,
        this.newMessage
      );

      this.newMessage = '';
    } catch {
      this.toastr.error('Mesaj gönderilemedi.');
    }
  }

  // =============================================================
  // VOICE CALL
  // =============================================================
  async startVoiceCall() {
    if (!this.selectedRequest?.assignedAgent) {
      this.toastr.warning('Temsilci atanmadı.');
      return;
    }

    try {
      this.callActive = true;
      this.selectedRequest.isCalling = true;

      await this.voiceService.startCall(
        this.selectedRequest.id,
        this.selectedRequest.assignedAgent.id
      );

      this.toastr.success('Arama başlatıldı.');
    } catch {
      this.callActive = false;
      this.selectedRequest.isCalling = false;
      this.toastr.error('Arama başlatılamadı.');
    }
  }

  endCall() {
    console.warn('[CustomerRequests] endCall() triggered');
    this.voiceService.endCall();
    this.callActive = false;
    this.toastr.info('Çağrı sonlandırıldı.');
  }

  // =============================================================
  // MODAL
  // =============================================================
  openDetails(r: any) {
    this.loadingDetail = true;

    this.http.get<any>(`${this.baseUrl}/${r.id}`).subscribe({
      next: res => {
        this.selectedRequest = res;

        // Mesaj geçmişi yükle
        this.chatService.loadMessageHistory(res.id);

        // 🔥 Hub bağlı olduktan sonra okundu işaretle
        this.chatService.onConnected
          .pipe(
            filter((x: boolean) => x === true),
            take(1)
          )
          .subscribe(() => {
            this.chatService.markAllAsRead(res.id, this.customerId);
          });

        this.showModal = true;
        this.loadingDetail = false;

        setTimeout(() => this.scrollToBottom(), 200);
      },
      error: () => {
        this.toastr.error('Detay yüklenemedi.');
        this.loadingDetail = false;
      }
    });
  }

  closeModal() {
    this.showModal = false;
    this.selectedRequest = null;
    this.newMessage = '';
    this.chatMessages = [];
  }

    @ViewChild('chatBox') chatBox!: ElementRef;

  private scrollToBottom(): void {
    try {
      if (this.chatBox?.nativeElement) {
        setTimeout(() => {
          this.chatBox.nativeElement.scrollTop =
            this.chatBox.nativeElement.scrollHeight;
        }, 50);
      }
    } catch (err) {
      console.warn('[CustomerRequests] scrollToBottom error:', err);
    }
  }

  // =============================================================
  // CANCEL REQUEST
  // =============================================================
  cancelRequest(r: any) {
    const reason = prompt('İptal sebebi:');
    if (reason === null) return;

    this.http.patch(`${this.baseUrl}/${r.id}/cancel`, { reason }).subscribe({
      next: () => {
        this.toastr.success('Talep iptal edildi.');
        this.loadRequests();
      },
      error: () => this.toastr.error('Talep iptal edilemedi.')
    });
  }
}
