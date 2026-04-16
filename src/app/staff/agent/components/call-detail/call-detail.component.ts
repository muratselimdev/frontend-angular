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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';
import { AgentCallsService } from '../../../services/agent-calls.service';
import { AgentRequestsService } from '../../../services/agent-requests.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../auth/auth.service';
import { ChatService } from '../../../../shared/services/chat.service';
import { VoiceService } from '../../../../shared/services/voice.service';
import { ChatMessage } from '../../../models/chat-message.model';
import { VoiceCall } from '../../../models/voice-call.model';

@Component({
  selector: 'app-call-detail',
  templateUrl: './call-detail.component.html',
  styleUrl: './call-detail.component.css',
  standalone: false
})
export class CallDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly MAX_VOICE_RECORDING_MS = 5 * 60 * 1000;

  // === AUDIO ===
  @ViewChild('localAudio') localAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('remoteAudio') remoteAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('attachmentInput') attachmentInput?: ElementRef<HTMLInputElement>;

  // === CHAT SCROLL ===
  @ViewChild('chatBox') chatBox!: ElementRef;

  callId!: number;
  requestId!: number;
  data: any;
  loading = false;
  sendingAttachment = false;

  newMessage = '';
  pendingAttachmentName = '';
  pendingAttachmentFile: File | null = null;
  pendingAttachmentPreviewUrl: string | null = null;
  isRecordingVoice = false;
  recordingSeconds = 0;
  recordedVoiceUrl: SafeResourceUrl | null = null;

  agentId!: number;

  callActive = false;
  incomingCall: any = null;
  activeVoiceCallId?: number;
  requestIdCandidates: number[] = [];
  private mediaRecorder?: MediaRecorder;
  private recordingStream?: MediaStream;
  private recordedVoiceBlob: Blob | null = null;
  private recordedVoiceFile: File | null = null;
  private recordingChunks: Blob[] = [];
  private recordingTimerId?: number;
  private recordingStopTimerId?: number;

  selectedTabIndex = 0;
  agentStatus: 'online' | 'busy' | 'offline' = 'offline';

  constructor(
    private route: ActivatedRoute,
    private api: AgentCallsService,
    private agentRequestsApi: AgentRequestsService,
    private toastr: ToastrService,
    private chatService: ChatService,
    private voiceService: VoiceService,
    private auth: AuthService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  // ===========================================================
  // INIT
  // ===========================================================
  async ngOnInit() {
    if (!this.auth.token) {
      this.toastr.error('Oturum geçersiz.');
      return;
    }

    this.agentId = this.getAgentIdFromToken();

    this.chatService.messages$.subscribe((msgs: ChatMessage[]) => {
      if (!this.data || !this.requestId) return;

      const filteredMessages = msgs.filter(message => message.requestId === this.requestId);
      if (!filteredMessages.length) return;

      this.zone.run(() => {
        this.data = {
          ...this.data,
          messages: [...filteredMessages]
        };
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 80);
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
    this.stopRecordingTimers();
    this.clearPendingAttachment();
    this.releaseRecordedVoicePreview();
    this.stopRecordingStream();
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
      next: async detail => {
        try {
          console.log('[CallDetail] detail payload', detail);
          const { resolvedRequestId, normalizedMessages, normalizedVoiceCalls } =
            await this.resolveRelatedRequestData(detail);

          console.log('[CallDetail] resolved request id', {
            callId: this.callId,
            requestIdCandidates: this.requestIdCandidates,
            resolvedRequestId,
            messageCount: normalizedMessages.length,
            voiceCallCount: normalizedVoiceCalls.length
          });

          this.zone.run(() => {
            this.data = {
              ...detail,
              messages: [...normalizedMessages],
              voiceCalls: [...normalizedVoiceCalls]
            };
            this.requestId = resolvedRequestId;

            this.syncVoiceCallState(normalizedVoiceCalls);

            this.loading = false;
            this.cdr.detectChanges();
            setTimeout(() => this.scrollToBottom(), 200);
          });

          if (!normalizedMessages.length) {
            this.loadMessagesFromHub(resolvedRequestId);
          }
        } catch {
          this.zone.run(() => {
            this.toastr.error('Detay yüklenemedi');
            this.loading = false;
            this.cdr.detectChanges();
          });
        }
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
    if (this.sendingAttachment) return;
    if (!this.newMessage.trim()) return;

    const toUserId = this.getChatTargetUserId();
    if (!toUserId) {
      this.toastr.warning('Müşteri bilgisi eksik.');
      return;
    }

    const message = this.newMessage.trim();

    this.chatService.postMessageForRequest(this.requestId, this.agentId, toUserId, message).subscribe({
      next: () => {
        this.newMessage = '';
        this.refreshMessages();
      },
      error: () => {
        this.chatService
          .sendMessage(this.requestId, this.agentId, toUserId, message)
          .then(() => {
            this.newMessage = '';
            this.loadMessagesFromHub(this.requestId);
          })
          .catch(() => this.toastr.error('Mesaj gönderilemedi'));
      }
    });
  }

  handleComposerKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && this.canSendMessage()) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  openAttachmentPicker() {
    if (this.sendingAttachment || this.isRecordingVoice) {
      return;
    }

    this.attachmentInput?.nativeElement.click();
  }

  onAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.setPendingAttachment(file);
    input.value = '';
  }

  sendPendingAttachment() {
    if (!this.pendingAttachmentFile || this.sendingAttachment) {
      return;
    }

    this.uploadAttachmentFile(this.pendingAttachmentFile);
  }

  removePendingAttachment() {
    this.clearPendingAttachment();
  }

  hasPendingAttachmentPreview(): boolean {
    return Boolean(this.pendingAttachmentFile && (this.isPendingAttachmentImage() || this.isPendingAttachmentPdf()));
  }

  isPendingAttachmentImage(): boolean {
    return Boolean(this.pendingAttachmentFile && this.pendingAttachmentFile.type.startsWith('image/'));
  }

  isPendingAttachmentPdf(): boolean {
    return Boolean(this.pendingAttachmentFile && this.getFileExtension(this.pendingAttachmentFile.name).toLowerCase() === 'pdf');
  }

  getPendingAttachmentPreviewResource(): SafeResourceUrl | null {
    if (!this.pendingAttachmentPreviewUrl) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `${this.pendingAttachmentPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
    );
  }

  getPendingAttachmentTypeLabel(): string {
    if (!this.pendingAttachmentFile) {
      return 'File';
    }

    const uploadType = this.resolveUploadType(this.pendingAttachmentFile);
    if (uploadType === 'Image') {
      return 'Image';
    }

    if (uploadType === 'Voice') {
      return 'Voice';
    }

    return this.isPendingAttachmentPdf() ? 'PDF Document' : 'Document';
  }

  async toggleVoiceRecording() {
    if (this.sendingAttachment) {
      return;
    }

    if (this.isRecordingVoice) {
      this.stopVoiceRecording();
      return;
    }

    await this.startVoiceRecording();
  }

  sendRecordedVoice() {
    if (!this.recordedVoiceFile || this.sendingAttachment) {
      return;
    }

    this.uploadAttachmentFile(this.recordedVoiceFile, 'Voice', this.getFileExtension(this.recordedVoiceFile.name).toUpperCase());
  }

  discardRecordedVoice() {
    this.recordedVoiceBlob = null;
    this.recordedVoiceFile = null;
    this.recordingSeconds = 0;
    this.releaseRecordedVoicePreview();
  }

  getRecordingDurationLabel(): string {
    const minutes = Math.floor(this.recordingSeconds / 60);
    const seconds = this.recordingSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  getRecordingProgressPercent(): number {
    return Math.min(
      100,
      (this.recordingSeconds / (CallDetailComponent.MAX_VOICE_RECORDING_MS / 1000)) * 100
    );
  }

  getRemainingRecordingLabel(): string {
    const maxSeconds = CallDetailComponent.MAX_VOICE_RECORDING_MS / 1000;
    const remainingSeconds = Math.max(0, maxSeconds - this.recordingSeconds);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  canSendMessage(): boolean {
    return Boolean(this.newMessage.trim()) && !this.sendingAttachment;
  }

  private async startVoiceRecording() {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.toastr.error('Ses kaydi bu tarayicida desteklenmiyor.');
      return;
    }

    try {
      this.discardRecordedVoice();
      this.recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = this.getSupportedRecordingMimeType();
      this.recordingChunks = [];
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.recordingStream, { mimeType })
        : new MediaRecorder(this.recordingStream);

      this.mediaRecorder.addEventListener('dataavailable', event => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      });

      this.mediaRecorder.addEventListener('stop', () => {
        this.zone.run(() => {
          const blobType = this.mediaRecorder?.mimeType || mimeType || 'audio/webm';
          this.recordedVoiceBlob = new Blob(this.recordingChunks, { type: blobType });
          const extension = this.getFileExtensionFromMimeType(blobType);
          this.recordedVoiceFile = new File(
            [this.recordedVoiceBlob],
            `voice-${Date.now()}.${extension}`,
            { type: blobType }
          );
          this.releaseRecordedVoicePreview();
          this.recordedVoiceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            URL.createObjectURL(this.recordedVoiceBlob)
          );
          this.stopRecordingStream();
          this.cdr.detectChanges();
        });
      });

      this.mediaRecorder.start();
      this.zone.run(() => {
        this.isRecordingVoice = true;
        this.recordingSeconds = 0;
        this.startRecordingTimers();
        this.toastr.info('Ses kaydi basladi. En fazla 5 dakika kaydedebilirsiniz.');
        this.cdr.detectChanges();
      });
    } catch {
      this.zone.run(() => {
        this.stopRecordingStream();
        this.toastr.error('Mikrofon erisimi saglanamadi.');
        this.cdr.detectChanges();
      });
    }
  }

  private stopVoiceRecording() {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return;
    }

    this.mediaRecorder.stop();
    this.mediaRecorder = undefined;
    this.zone.run(() => {
      this.isRecordingVoice = false;
      this.stopRecordingTimers();
      this.cdr.detectChanges();
    });
  }

  private startRecordingTimers() {
    this.stopRecordingTimers();
    this.recordingTimerId = window.setInterval(() => {
      this.zone.run(() => {
        this.recordingSeconds += 1;
        this.cdr.detectChanges();
      });
    }, 1000);

    this.recordingStopTimerId = window.setTimeout(() => {
      this.zone.run(() => {
        if (this.isRecordingVoice) {
          this.stopVoiceRecording();
          this.toastr.info('5 dakika doldugu icin kayit otomatik durduruldu.');
        }
      });
    }, CallDetailComponent.MAX_VOICE_RECORDING_MS);
  }

  private stopRecordingTimers() {
    if (this.recordingTimerId) {
      window.clearInterval(this.recordingTimerId);
      this.recordingTimerId = undefined;
    }

    if (this.recordingStopTimerId) {
      window.clearTimeout(this.recordingStopTimerId);
      this.recordingStopTimerId = undefined;
    }
  }

  private stopRecordingStream() {
    this.recordingStream?.getTracks().forEach(track => track.stop());
    this.recordingStream = undefined;
  }

  private releaseRecordedVoicePreview() {
    if (this.recordedVoiceUrl) {
      const previewUrl = this.sanitizer.sanitize(4, this.recordedVoiceUrl);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
    this.recordedVoiceUrl = null;
  }

  private uploadAttachmentFile(file: File, forcedType?: 'Image' | 'Document' | 'Voice', forcedDocumentType?: string) {
    const toUserId = this.getChatTargetUserId();
    if (!toUserId) {
      this.toastr.warning('Müşteri bilgisi eksik.');
      return;
    }

    const uploadType = forcedType ?? this.resolveUploadType(file);
    const documentType = forcedDocumentType ?? this.getFileExtension(file.name).toUpperCase();

    this.pendingAttachmentName = file.name;
    this.sendingAttachment = true;

    this.chatService.uploadMessageAttachment(
      this.requestId,
      this.agentId,
      toUserId,
      file,
      uploadType,
      documentType
    ).subscribe({
      next: () => {
        this.pendingAttachmentName = '';
        this.sendingAttachment = false;
        if (uploadType === 'Voice') {
          this.discardRecordedVoice();
        } else {
          this.clearPendingAttachment();
        }
        this.toastr.success('Dosya gonderildi.');
        this.refreshMessages();
      },
      error: () => {
        this.pendingAttachmentName = '';
        this.sendingAttachment = false;
        this.toastr.error('Dosya gonderilemedi.');
      }
    });
  }

  private setPendingAttachment(file: File) {
    this.clearPendingAttachment();
    this.pendingAttachmentFile = file;
    this.pendingAttachmentName = file.name;

    if (file.type.startsWith('image/') || this.getFileExtension(file.name).toLowerCase() === 'pdf') {
      this.pendingAttachmentPreviewUrl = URL.createObjectURL(file);
    }
  }

  private clearPendingAttachment() {
    if (this.pendingAttachmentPreviewUrl) {
      URL.revokeObjectURL(this.pendingAttachmentPreviewUrl);
      this.pendingAttachmentPreviewUrl = null;
    }

    this.pendingAttachmentFile = null;
    this.pendingAttachmentName = '';
  }

  private resolveUploadType(file: File): 'Image' | 'Document' | 'Voice' {
    if (file.type.startsWith('image/')) {
      return 'Image';
    }

    if (file.type.startsWith('audio/')) {
      return 'Voice';
    }

    return 'Document';
  }

  private getSupportedRecordingMimeType(): string {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];

    return candidates.find(candidate => MediaRecorder.isTypeSupported(candidate)) || '';
  }

  private getFileExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex < 0 || dotIndex === fileName.length - 1) {
      return 'FILE';
    }

    return fileName.slice(dotIndex + 1);
  }

  private getFileExtensionFromMimeType(mimeType: string): string {
    if (mimeType.includes('ogg')) {
      return 'ogg';
    }

    if (mimeType.includes('mpeg')) {
      return 'mp3';
    }

    if (mimeType.includes('mp4')) {
      return 'm4a';
    }

    return 'webm';
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
    const customerId = this.getCustomerId();

    if (!customerId) {
      this.toastr.warning('Müşteri bilgisi eksik.');
      return;
    }

    this.voiceService.startVoiceCallRequest(this.requestId, this.agentId, customerId).subscribe({
      next: () => {
        this.toastr.success('Sesli arama başlatıldı.');
        this.refreshVoiceCalls();
      },
      error: () => this.toastr.error('Sesli arama başlatılamadı')
    });
  }

  endCall() {
    if (!this.activeVoiceCallId) {
      this.toastr.warning('Bitirilecek aktif arama bulunamadı.');
      return;
    }

    this.voiceService.endVoiceCallRequest(this.activeVoiceCallId).subscribe({
      next: () => {
        this.toastr.warning('Çağrı sonlandırıldı.');
        this.refreshVoiceCalls();
      },
      error: () => this.toastr.error('Çağrı sonlandırılamadı')
    });
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

  getVoiceCallStatusLabel(status?: string): string {
    const normalizedStatus = (status ?? '').trim();
    if (!normalizedStatus) {
      return 'Unknown';
    }

    return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  }

  getVoiceCallStatusClass(status?: string): string {
    const normalizedStatus = (status ?? '').trim().toLowerCase();

    if (['completed', 'ended', 'finished'].includes(normalizedStatus)) {
      return 'voice-status-completed';
    }

    if (['ongoing', 'active', 'started', 'ringing', 'inprogress', 'in progress'].includes(normalizedStatus)) {
      return 'voice-status-active';
    }

    if (['missed', 'failed', 'rejected', 'cancelled', 'canceled'].includes(normalizedStatus)) {
      return 'voice-status-missed';
    }

    return 'voice-status-default';
  }

  getVoiceCallDuration(startedAt?: string, endedAt?: string): string {
    const startTime = new Date(startedAt ?? '').getTime();
    if (!Number.isFinite(startTime) || !startTime) {
      return '-';
    }

    const endTime = endedAt ? new Date(endedAt).getTime() : Date.now();
    if (!Number.isFinite(endTime) || endTime < startTime) {
      return '-';
    }

    const diffMs = endTime - startTime;
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((diffMs % 60000) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (totalMinutes > 0) {
      return `${totalMinutes}m ${seconds}s`;
    }

    return `${seconds}s`;
  }

  isImageMessage(message: ChatMessage): boolean {
    return this.getMessageKind(message) === 'image';
  }

  isAudioMessage(message: ChatMessage): boolean {
    return this.getMessageKind(message) === 'audio';
  }

  isPdfMessage(message: ChatMessage): boolean {
    return this.getMessageKind(message) === 'pdf';
  }

  isFileMessage(message: ChatMessage): boolean {
    return this.getMessageKind(message) === 'file';
  }

  getMessageAssetUrl(message: ChatMessage): string {
    return String(message.fileUrl || message.message || '').trim();
  }

  getAttachmentLabel(message: ChatMessage): string {
    const assetUrl = this.getMessageAssetUrl(message);

    try {
      const parsedUrl = new URL(assetUrl);
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      return decodeURIComponent(pathParts[pathParts.length - 1] || 'attachment');
    } catch {
      return 'attachment';
    }
  }

  getAttachmentUrl(attachment: any): string {
    return String(
      attachment?.url ??
      attachment?.fileUrl ??
      attachment?.Url ??
      attachment?.FileUrl ??
      attachment?.message ??
      attachment?.Message ??
      ''
    ).trim();
  }

  getPdfPreviewUrl(attachment: any): SafeResourceUrl {
    const attachmentUrl = this.getAttachmentUrl(attachment);
    const previewUrl = attachmentUrl
      ? `${attachmentUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
      : 'about:blank';

    return this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl);
  }

  getAttachmentDisplayName(attachment: any): string {
    const explicitName = String(attachment?.fileName ?? attachment?.FileName ?? '').trim();
    if (explicitName) {
      return explicitName;
    }

    const attachmentUrl = this.getAttachmentUrl(attachment);
    if (!attachmentUrl) {
      return 'Untitled file';
    }

    try {
      const parsedUrl = new URL(attachmentUrl);
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      return decodeURIComponent(pathParts[pathParts.length - 1] || 'Untitled file');
    } catch {
      return 'Untitled file';
    }
  }

  getAttachmentExtension(attachment: any): string {
    const fileName = this.getAttachmentDisplayName(attachment);
    const dotIndex = fileName.lastIndexOf('.');

    if (dotIndex < 0 || dotIndex === fileName.length - 1) {
      return 'FILE';
    }

    return fileName.slice(dotIndex + 1).toUpperCase();
  }

  getAttachmentBaseName(attachment: any): string {
    const fileName = this.getAttachmentDisplayName(attachment);
    const dotIndex = fileName.lastIndexOf('.');

    if (dotIndex <= 0) {
      return fileName;
    }

    return fileName.slice(0, dotIndex);
  }

  getAttachmentTypeLabel(attachment: any): string {
    return String(
      attachment?.type ??
      attachment?.Type ??
      attachment?.messageType ??
      attachment?.MessageType ??
      'File'
    ).trim() || 'File';
  }

  getAttachmentIcon(attachment: any): string {
    const extension = this.getAttachmentExtension(attachment).toLowerCase();
    const typeLabel = this.getAttachmentTypeLabel(attachment).toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(extension) || typeLabel.includes('image')) {
      return 'image';
    }

    if (['pdf'].includes(extension)) {
      return 'pdf';
    }

    if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm'].includes(extension) || typeLabel.includes('voice') || typeLabel.includes('audio')) {
      return 'audio';
    }

    return 'file';
  }

  isAttachmentImage(attachment: any): boolean {
    const extension = this.getAttachmentExtension(attachment).toLowerCase();
    const typeLabel = this.getAttachmentTypeLabel(attachment).toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(extension) || typeLabel.includes('image');
  }

  isAttachmentAudio(attachment: any): boolean {
    const extension = this.getAttachmentExtension(attachment).toLowerCase();
    const typeLabel = this.getAttachmentTypeLabel(attachment).toLowerCase();
    return ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm'].includes(extension) || typeLabel.includes('voice') || typeLabel.includes('audio');
  }

  isAttachmentPdf(attachment: any): boolean {
    return this.getAttachmentExtension(attachment).toLowerCase() === 'pdf';
  }

  getImageAttachments(): any[] {
    return this.getFileEntries().filter(attachment => this.isAttachmentImage(attachment));
  }

  getAudioAttachments(): any[] {
    return this.getFileEntries().filter(attachment => this.isAttachmentAudio(attachment));
  }

  getPdfAttachments(): any[] {
    return this.getFileEntries().filter(attachment => this.isAttachmentPdf(attachment));
  }

  getOtherAttachments(): any[] {
    return this.getFileEntries().filter(
      attachment => !this.isAttachmentImage(attachment) && !this.isAttachmentAudio(attachment) && !this.isAttachmentPdf(attachment)
    );
  }

  getFileEntries(): any[] {
    const directAttachments = Array.isArray(this.data?.attachments) ? this.data.attachments : [];
    const messageAttachments = (Array.isArray(this.data?.messages) ? this.data.messages : []).filter((message: ChatMessage) => {
      const typeLabel = String(message?.messageType || '').trim().toLowerCase();
      const assetUrl = this.getAttachmentUrl(message);
      return Boolean(assetUrl) && ['image', 'audio', 'voice', 'pdf', 'file', 'document', 'attachment'].includes(typeLabel);
    });

    const mergedEntries = [...directAttachments, ...messageAttachments];
    const seenUrls = new Set<string>();

    return mergedEntries.filter(entry => {
      const assetUrl = this.getAttachmentUrl(entry);
      if (!assetUrl || seenUrls.has(assetUrl)) {
        return false;
      }

      seenUrls.add(assetUrl);
      return true;
    });
  }

  private refreshMessages() {
    this.chatService.getMessagesForRequest(this.requestId).subscribe({
      next: messages => {
        const normalizedMessages = this.chatService.setMessagesForRequest(
          this.requestId,
          messages
        );

        this.zone.run(() => {
          this.data = {
            ...this.data,
            messages: [...normalizedMessages]
          };
          this.cdr.detectChanges();
          setTimeout(() => this.scrollToBottom(), 100);
        });

        if (!normalizedMessages.length) {
          this.loadMessagesFromHub(this.requestId);
        }
      },
      error: () => this.loadMessagesFromHub(this.requestId)
    });
  }

  private loadMessagesFromHub(requestId: number) {
    this.chatService.loadMessageHistory(requestId).catch(() => {
      this.toastr.error('Mesajlar yüklenemedi');
    });
  }

  private getChatTargetUserId(): number {
    const customerId = this.getCustomerId();
    if (customerId) {
      return customerId;
    }

    const existingMessages = this.data?.messages ?? [];
    const participantId = existingMessages
      .flatMap((message: ChatMessage) => [message.fromUserId, message.toUserId])
      .find((userId: number) => Number(userId) > 0 && Number(userId) !== this.agentId);

    return Number(participantId ?? 0);
  }

  private refreshVoiceCalls() {
    this.voiceService.getVoiceCallsForRequest(this.requestId).subscribe({
      next: voiceCalls => {
        const normalizedVoiceCalls = this.voiceService.normalizeVoiceCalls(voiceCalls);

        this.zone.run(() => {
          this.data = {
            ...this.data,
            voiceCalls: [...normalizedVoiceCalls]
          };
          this.syncVoiceCallState(normalizedVoiceCalls);
          this.cdr.detectChanges();
        });
      }
    });
  }

  private syncVoiceCallState(voiceCalls: VoiceCall[]) {
    const activeVoiceCall = voiceCalls.find(call => this.isVoiceCallActive(call.status));
    this.activeVoiceCallId = activeVoiceCall?.id;
    this.callActive = Boolean(activeVoiceCall);
  }

  private isVoiceCallActive(status?: string): boolean {
    const normalizedStatus = (status ?? '').trim().toLowerCase();
    return ['active', 'started', 'ringing', 'ongoing', 'inprogress', 'in progress'].includes(normalizedStatus);
  }

  private getCustomerId(): number {
    return this.firstValidNumber([
      this.data?.customer?.customerId,
      this.data?.customer?.CustomerId,
      this.data?.customer?.id,
      this.data?.customer?.Id,
      this.data?.customer?.userId,
      this.data?.customer?.UserId,
      this.data?.customerId,
      this.data?.CustomerId,
      this.data?.customerUserId,
      this.data?.CustomerUserId,
      this.data?.request?.customerId,
      this.data?.request?.CustomerId,
      this.data?.request?.customer?.id,
      this.data?.request?.customer?.Id,
      this.data?.request?.customer?.userId,
      this.data?.request?.customer?.UserId
    ]);
  }

  private resolveRequestId(detail: any): number {
    return this.firstValidNumber([
      detail?.requestId,
      detail?.RequestId,
      detail?.request?.requestId,
      detail?.request?.RequestId,
      detail?.request?.id,
      detail?.request?.Id,
      detail?.customerRequestId,
      detail?.CustomerRequestId,
      detail?.customerRequest?.id,
      detail?.customerRequest?.Id,
      detail?.id,
      this.callId
    ]);
  }

  private async resolveRelatedRequestData(detail: any): Promise<{
    resolvedRequestId: number;
    normalizedMessages: ChatMessage[];
    normalizedVoiceCalls: VoiceCall[];
  }> {
    const directCandidates = this.collectRequestIdCandidates(detail);
    const directResult = await this.findFirstRequestIdWithData(directCandidates);

    if (directResult) {
      this.requestIdCandidates = directCandidates;
      this.chatService.setMessagesForRequest(directResult.requestId, directResult.messages);

      return {
        resolvedRequestId: directResult.requestId,
        normalizedMessages: directResult.messages,
        normalizedVoiceCalls: directResult.voiceCalls
      };
    }

    const matchedRequestCandidates = await this.collectRequestCandidatesFromAssignedRequests(detail);
    const combinedCandidates = [...directCandidates, ...matchedRequestCandidates].filter(
      (candidate, index, allCandidates) => allCandidates.indexOf(candidate) === index
    );
    this.requestIdCandidates = combinedCandidates;

    const combinedResult = await this.findFirstRequestIdWithData(combinedCandidates);

    if (combinedResult) {
      this.chatService.setMessagesForRequest(combinedResult.requestId, combinedResult.messages);

      return {
        resolvedRequestId: combinedResult.requestId,
        normalizedMessages: combinedResult.messages,
        normalizedVoiceCalls: combinedResult.voiceCalls
      };
    }

    return {
      resolvedRequestId: combinedCandidates[0] ?? this.callId,
      normalizedMessages: [],
      normalizedVoiceCalls: []
    };
  }

  private async findFirstRequestIdWithData(candidates: number[]): Promise<{
    requestId: number;
    messages: ChatMessage[];
    voiceCalls: VoiceCall[];
  } | null> {
    for (const candidate of candidates) {
      const [messagesPayload, voiceCallsPayload] = await Promise.all([
        firstValueFrom(this.chatService.getMessagesForRequest(candidate).pipe(catchError(() => of([])))),
        firstValueFrom(this.voiceService.getVoiceCallsForRequest(candidate).pipe(catchError(() => of([]))))
      ]);

      const normalizedMessages = this.chatService.normalizeMessages(messagesPayload);
      const normalizedVoiceCalls = this.voiceService.normalizeVoiceCalls(voiceCallsPayload);

      if (normalizedMessages.length || normalizedVoiceCalls.length) {
        return {
          requestId: candidate,
          messages: normalizedMessages,
          voiceCalls: normalizedVoiceCalls
        };
      }
    }

    return null;
  }

  private async collectRequestCandidatesFromAssignedRequests(detail: any): Promise<number[]> {
    const requests = await firstValueFrom(
      this.agentRequestsApi.getAssignedRequests().pipe(catchError(() => of([])))
    );

    console.log('[CallDetail] assigned requests payload', requests);

    const normalizedDetailName = this.normalizeComparable(
      detail?.customer?.fullName ?? detail?.customerName ?? detail?.customer?.name
    );
    const normalizedDetailEmail = this.normalizeComparable(
      detail?.customer?.email ?? detail?.customerEmail
    );
    const normalizedDetailPhone = this.normalizeComparable(
      detail?.customer?.phone ?? detail?.customerPhone
    );
    const normalizedDetailSubject = this.normalizeComparable(
      detail?.subject ?? detail?.request?.subject
    );
    const detailCustomerId = this.firstValidNumber([
      detail?.customer?.customerId,
      detail?.customer?.id,
      detail?.customerId,
      detail?.CustomerId,
      detail?.customerUserId,
      detail?.CustomerUserId
    ]);
    const detailCreatedAt = this.toTime(detail?.createdAt ?? detail?.CreatedAt);

    const matchedCandidates = (Array.isArray(requests) ? requests : [])
      .map(request => {
        const requestId = this.firstValidNumber([request?.id, request?.Id, request?.requestId, request?.RequestId]);
        let score = 0;

        const requestCustomerId = this.firstValidNumber([
          request?.customerId,
          request?.CustomerId,
          request?.customer?.id,
          request?.customer?.Id,
          request?.customer?.customerId,
          request?.customer?.CustomerId,
          request?.customerUserId,
          request?.CustomerUserId
        ]);
        const requestName = this.normalizeComparable(
          request?.customer?.fullName ?? request?.customerName ?? request?.customer?.name
        );
        const requestEmail = this.normalizeComparable(
          request?.customer?.email ?? request?.customerEmail
        );
        const requestPhone = this.normalizeComparable(
          request?.customer?.phone ?? request?.customerPhone
        );
        const requestSubject = this.normalizeComparable(request?.subject ?? request?.request?.subject);
        const requestCreatedAt = this.toTime(request?.createdAt ?? request?.CreatedAt);

        if (detailCustomerId && requestCustomerId && detailCustomerId === requestCustomerId) score += 5;
        if (normalizedDetailName && requestName && normalizedDetailName === requestName) score += 4;
        if (normalizedDetailEmail && requestEmail && normalizedDetailEmail === requestEmail) score += 4;
        if (normalizedDetailPhone && requestPhone && normalizedDetailPhone === requestPhone) score += 4;
        if (normalizedDetailSubject && requestSubject && normalizedDetailSubject === requestSubject) score += 3;
        if (detailCreatedAt && requestCreatedAt && Math.abs(detailCreatedAt - requestCreatedAt) < 5 * 60 * 1000) score += 3;

        return { requestId, score };
      })
      .filter(candidate => candidate.requestId > 0)
      .sort((left, right) => right.score - left.score || right.requestId - left.requestId)
      .slice(0, 20)
      .map(candidate => candidate.requestId);

    console.log('[CallDetail] matched request candidates from /api/agent/requests', matchedCandidates);

    return matchedCandidates;
  }

  private collectRequestIdCandidates(detail: any): number[] {
    const strongCandidates: number[] = [];
    const urlCandidates: number[] = [];
    const numericCandidates: number[] = [];
    const fallbackCandidates: number[] = [];

    const pushCandidate = (bucket: number[], value: any) => {
      const parsedValue = Number(value);
      if (!Number.isInteger(parsedValue) || parsedValue <= 0 || bucket.includes(parsedValue)) {
        return;
      }
      bucket.push(parsedValue);
    };

    const collectFromValue = (value: any, path: string[] = []) => {
      if (value == null) {
        return;
      }

      if (typeof value === 'number') {
        const lastKey = (path[path.length - 1] ?? '').toLowerCase();
        const parentKey = (path[path.length - 2] ?? '').toLowerCase();

        if (
          ['requestid', 'customerrequestid'].includes(lastKey) ||
          (lastKey === 'id' && parentKey.includes('request'))
        ) {
          pushCandidate(strongCandidates, value);
          return;
        }

        if (parsedValueLooksLikeRequestId(value)) {
          pushCandidate(numericCandidates, value);
        }

        if (lastKey === 'id' && path.length <= 1) {
          pushCandidate(fallbackCandidates, value);
        }
        return;
      }

      if (typeof value === 'string') {
        const pathMatches = value.match(/\b(\d{3,})\b/g) ?? [];
        for (const match of pathMatches) {
          if (value.includes('/mobile/') || value.includes('/request') || value.includes('/requests')) {
            pushCandidate(urlCandidates, match);
          } else if (parsedValueLooksLikeRequestId(match)) {
            pushCandidate(numericCandidates, match);
          }
        }
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(item => collectFromValue(item, path));
        return;
      }

      if (typeof value === 'object') {
        Object.entries(value).forEach(([key, nestedValue]) => {
          collectFromValue(nestedValue, [...path, key]);
        });
      }
    };

    pushCandidate(strongCandidates, detail?.requestId);
    pushCandidate(strongCandidates, detail?.RequestId);
    pushCandidate(strongCandidates, detail?.request?.requestId);
    pushCandidate(strongCandidates, detail?.request?.RequestId);
    pushCandidate(strongCandidates, detail?.request?.id);
    pushCandidate(strongCandidates, detail?.request?.Id);
    pushCandidate(strongCandidates, detail?.customerRequestId);
    pushCandidate(strongCandidates, detail?.CustomerRequestId);
    pushCandidate(strongCandidates, detail?.customerRequest?.id);
    pushCandidate(strongCandidates, detail?.customerRequest?.Id);

    collectFromValue(detail);
    pushCandidate(fallbackCandidates, detail?.id);
    pushCandidate(fallbackCandidates, this.callId);

    const candidates = [...strongCandidates, ...urlCandidates, ...numericCandidates, ...fallbackCandidates].filter(
      (candidate, index, allCandidates) => allCandidates.indexOf(candidate) === index
    ).slice(0, 25);

    console.log('[CallDetail] direct request id candidates', {
      strongCandidates,
      urlCandidates,
      numericCandidates,
      fallbackCandidates,
      candidates
    });

    return candidates;
  }

  private firstValidNumber(values: any[]): number {
    for (const value of values) {
      const parsedValue = Number(value);
      if (Number.isInteger(parsedValue) && parsedValue > 0) {
        return parsedValue;
      }
    }

    return 0;
  }

  private normalizeComparable(value: any): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  private toTime(value: any): number {
    const timestamp = new Date(value ?? '').getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private getMessageKind(message: ChatMessage): 'image' | 'audio' | 'pdf' | 'file' | 'text' {
    const messageType = String(message.messageType || '').trim().toLowerCase();
    const assetUrl = this.getMessageAssetUrl(message).toLowerCase();

    if (
      messageType === 'image' ||
      /(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.bmp|\.svg)(\?|$)/.test(assetUrl)
    ) {
      return 'image';
    }

    if (
      messageType === 'voice' ||
      messageType === 'audio' ||
      /(\.mp3|\.wav|\.ogg|\.m4a|\.aac|\.webm)(\?|$)/.test(assetUrl)
    ) {
      return 'audio';
    }

    if (messageType === 'pdf' || /(\.pdf)(\?|$)/.test(assetUrl)) {
      return 'pdf';
    }

    if (
      ['file', 'document', 'doc', 'attachment'].includes(messageType) ||
      /^https?:\/\//.test(assetUrl)
    ) {
      return 'file';
    }

    return 'text';
  }
}

function parsedValueLooksLikeRequestId(value: any): boolean {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue >= 100;
}
