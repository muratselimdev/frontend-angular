import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { Router } from '@angular/router';
import { CustomerAuthService } from '../services/customer-auth.service';
import { VoiceService } from '../../shared/services/voice.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-customer-layout',
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css',
  standalone: false
})
export class CustomerLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  customerName: string | null = null;
  customerId = 0;

  // Incoming call state
  incomingVisible = false;
  callerName = '';
  currentIncomingCall: any = null;
  callActive = false;

  // Persistent audio elements for WebRTC (must live outside router-outlet)
  @ViewChild('localAudio') localAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('remoteAudio') remoteAudio!: ElementRef<HTMLAudioElement>;

  constructor(
    private auth: CustomerAuthService,
    private router: Router,
    private voiceService: VoiceService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    const profile = localStorage.getItem('customerProfile');
    if (profile) {
      const data = JSON.parse(profile);
      this.customerName = `${data.firstName} ${data.lastName}`;
    }

    const token = this.auth.token;
    if (!token) return;

    this.customerId = this.decodeCustomerId();

    // Connect to voice hub once — persists across all child routes
    await this.voiceService.startConnection(token, 'customer', this.customerId);

    // 📥 Incoming call from agent
    this.voiceService.incomingCall.subscribe(call => {
      const fromId = call.fromUserId ?? call.FromUserId;
      if (fromId === this.customerId) return;

      this.zone.run(() => {
        this.callerName = call.FromUserName ?? call.fromUserName ?? `Temsilci #${fromId}`;
        this.currentIncomingCall = call;
        this.incomingVisible = true;
        this.toastr.info(`${this.callerName} sizi arıyor...`, '📞 Gelen Çağrı');
        this.cdr.detectChanges();
      });
    });

    // 📴 Call ended
    this.voiceService.callEnded.subscribe(() => {
      this.zone.run(() => {
        this.incomingVisible = false;
        this.callActive = false;
        this.currentIncomingCall = null;
        this.callerName = '';
        this.cdr.detectChanges();
      });
    });

    // 📶 Active call state
    this.voiceService.onCallActive.subscribe(state => {
      this.zone.run(() => {
        this.callActive = state;
        this.cdr.detectChanges();
      });
    });
  }

  ngAfterViewInit(): void {
    if (this.localAudio?.nativeElement && this.remoteAudio?.nativeElement) {
      this.voiceService.setLocalAudioElement(this.localAudio.nativeElement);
      this.voiceService.setRemoteAudioElement(this.remoteAudio.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.voiceService.cleanup();
  }

  onAcceptCall(): void {
    this.incomingVisible = false;
    if (this.currentIncomingCall) {
      this.voiceService.acceptCall(
        this.currentIncomingCall.requestId ?? this.currentIncomingCall.RequestId,
        this.currentIncomingCall.fromUserId ?? this.currentIncomingCall.FromUserId
      );
      this.callActive = true;
      this.toastr.success('Çağrı kabul edildi.');
    }
  }

  onRejectCall(): void {
    this.incomingVisible = false;
    if (this.currentIncomingCall) {
      this.voiceService.endCall(
        this.currentIncomingCall.requestId ?? this.currentIncomingCall.RequestId
      );
    }
    this.currentIncomingCall = null;
  }

  endCall(): void {
    this.callActive = false;
    this.cdr.detectChanges();
    this.voiceService.endCall();
  }

  private decodeCustomerId(): number {
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

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        localStorage.removeItem('customerProfile');
        this.router.navigate(['/customer/login'], { queryParams: { loggedOut: 'true' } });
      },
      error: err => console.error('Logout hatası', err)
    });
  }
}
