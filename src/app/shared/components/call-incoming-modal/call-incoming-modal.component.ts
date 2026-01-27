import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-call-incoming-modal',
  templateUrl: './call-incoming-modal.component.html',
  styleUrl: './call-incoming-modal.component.css',
  standalone: false
})
export class CallIncomingModalComponent {

  /** Modal görünürlük kontrolü */
  @Input() visible: boolean = false;

  /** Arayan kişinin adı */
  @Input() callerName: string = '';

  /** Backend tarafından iletilen RequestId (opsiyonel) */
  @Input() requestId?: number;

  /** Arayan kullanıcı (customer or agent) */
  @Input() fromUserId?: number;

  /** Çağrıyı kabul event’i */
  @Output() accept = new EventEmitter<void>();

  /** Çağrıyı reddet event’i */
  @Output() reject = new EventEmitter<void>();

  // === 🟢 Çağrıyı kabul et =====================
  acceptCall(): void {
    this.accept.emit();
    this.visible = false;
  }

  // === 🔴 Çağrıyı reddet ======================
  rejectCall(): void {
    this.reject.emit();
    this.visible = false;
  }
}
