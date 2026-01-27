import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { ChatMessage } from '../../staff/models/chat-message.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private hubConnection!: signalR.HubConnection;

  private messagesSource = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messagesSource.asObservable();

  // ✍️ Yazıyor bilgisi
  private typingSource = new BehaviorSubject<{ fromUserId: number; toUserId: number } | null>(null);
  typing$ = this.typingSource.asObservable();
  private typingTimeout?: any;

  private connectedUserId?: number;
  private connectionId?: string;
  private role?: 'agent' | 'customer';
  public onConnected = new BehaviorSubject<boolean>(false);

  // Customer → atanmış agent
  private assignedAgentMap = new Map<number, number>(); // customerId → agentId

  constructor(private auth: AuthService) {}

  // ============================================================
  // 🔹 SignalR bağlantısını başlat
  // ============================================================
  startConnection(token: string, role: 'agent' | 'customer', userId: number): void {
    if (!token) {
      console.warn('[ChatService] ⚠️ Token bulunamadı.');
      return;
    }

    this.role = role;
    this.connectedUserId = userId;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/chat?role=${role}&userId=${userId}`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log(`[ChatService] 🔗 Bağlantı kuruldu (${role})`);
        this.onConnected.next(true);
        this.registerHubEvents();

        if (this.role === 'customer') this.assignAgentToCustomer();
      })
      .catch(err => console.error('[ChatService] ❌ Bağlantı hatası:', err));
  }

  // ============================================================
  // 🔹 Hub event kayıtları
  // ============================================================
  private registerHubEvents(): void {
    // Bağlantı onayı (opsiyonel)
    this.hubConnection.on('Connected', (userId: number, connectionId: string) => {
      this.connectedUserId = userId;
      this.connectionId = connectionId;
    });

    // 📜 Mesaj geçmişi
    this.hubConnection.on('MessageHistory', (msgs: any[]) => {
      const history: ChatMessage[] = msgs.map(m => ({
        id: Number(m.id ?? m.Id),
        requestId: m.requestId ?? m.RequestId,
        callId: m.callId ?? m.CallId,
        fromUserId: m.fromUserId ?? m.FromUserId,
        toUserId: m.toUserId ?? m.ToUserId,
        message: m.message ?? m.Message,
        sentAt: m.sentAt ? new Date(m.sentAt) : new Date(),
        isRead: m.isRead ?? m.IsRead ?? false
      }));

      if (history.length === 0) return;

      const reqId = history[0].requestId;

      const filtered = this.messagesSource.value.filter(m => m.requestId !== reqId);
      this.messagesSource.next([...filtered, ...history.reverse()]);

      console.log(`[ChatService] 📜 Mesaj geçmişi yüklendi (Req:${reqId}, Count:${history.length})`);
    });

    // 🎯 Agent atandı
    this.hubConnection.on('AgentAssigned', (agentId: number) => {
      console.log(`[ChatService] 🤝 Temsilci atandı → AgentID: ${agentId}`);
      if (this.connectedUserId) {
        this.assignedAgentMap.set(this.connectedUserId, agentId);
      }
    });

    // 📩 Mesaj geldi
    this.hubConnection.on('ReceiveMessage', (msg: any) => {
      const id = msg.id ?? msg.Id;
      const newMsg: ChatMessage = {
        id: Number(msg.id ?? msg.Id ?? 0),
        callId: msg.callId ?? msg.CallId,
        requestId: msg.requestId ?? msg.RequestId,
        fromUserId: msg.fromUserId ?? msg.FromUserId,
        toUserId: msg.toUserId ?? msg.ToUserId,
        message: msg.message ?? msg.Message,
        sentAt: msg.sentAt ? new Date(msg.sentAt) : new Date(),
        isRead: msg.isRead ?? msg.IsRead ?? false
      };

      const current = this.messagesSource.value;
      this.messagesSource.next([...current, newMsg]);

      console.log(`[ChatService] 📤 Mesaj alındı → ${newMsg.toUserId}`);


      // Eğer mesaj bana geldiyse → okundu işaretle
      if (this.connectedUserId && newMsg.toUserId === this.connectedUserId && newMsg.id) {
        this.markAsRead(newMsg.id, this.connectedUserId);
      }
    });

    // 🟦 Tek mesaj okundu
    this.hubConnection.on('MessageRead', (data: any) => {
      const updated = this.messagesSource.value.map(m =>
        m.id === (data.id ?? data.Id) ? { ...m, isRead: true } : m
      );
      this.messagesSource.next(updated);
    });

    // 📖 Tüm mesajlar okundu
    this.hubConnection.on('AllMessagesRead', (data: any) => {
      const reqId = data.requestId ?? data.RequestId;
      const updated = this.messagesSource.value.map(m =>
        m.requestId === reqId ? { ...m, isRead: true } : m
      );
      this.messagesSource.next(updated);
    });

    // ✍️ Yazıyor...
    this.hubConnection.on('UserTyping', (data: any) => {
      this.typingSource.next({
        fromUserId: data.fromUserId ?? data.FromUserId,
        toUserId: data.toUserId ?? data.ToUserId
      });

      if (this.typingTimeout) clearTimeout(this.typingTimeout);

      this.typingTimeout = setTimeout(() => {
        this.typingSource.next(null);
      }, 2000);
    });

    // Yazmayı bıraktı
    this.hubConnection.on('UserStoppedTyping', () => {
      this.typingSource.next(null);
    });

    this.hubConnection.onreconnected(() => {
      console.log('[ChatService] 🔁 Yeniden bağlandı.');
      if (this.role === 'customer') this.assignAgentToCustomer();
    });

    this.hubConnection.on('AgentNotAssigned', () => {
      console.warn('[ChatService] ⚠️ Henüz aktif temsilci atanmamış.');
    });

    this.hubConnection.onclose(() => {
      console.warn('[ChatService] ⚠️ SignalR bağlantısı kapandı.');
    });
  }

  // ============================================================
  // ✍️ Yazıyor / Yazmıyor bildirimi gönder
  // ============================================================
  sendTyping(fromUserId: number, toUserId: number) {
    if (!this.hubConnection) return;
    this.hubConnection.invoke('Typing', fromUserId, toUserId)
      .catch(err => console.error('[ChatService] Typing hatası:', err));
  }

  sendStoppedTyping(fromUserId: number, toUserId: number) {
    if (!this.hubConnection) return;
    this.hubConnection.invoke('StopTyping', fromUserId, toUserId)
      .catch(err => console.error('[ChatService] StopTyping hatası:', err));
  }

  // ============================================================
  // ✉️ Mesaj gönder
  // ============================================================
  async sendMessage(
    requestId: number,
    fromUserId: number,
    toUserId: number,
    message: string,
    callId?: number
  ): Promise<void> {
    if (!this.hubConnection) {
      console.error("[ChatService] ❌ Hub yok");
      return Promise.reject("Hub not initialized");
    }

    if (!fromUserId || !toUserId) {
      console.error("[ChatService] ❌ Geçersiz ID", { fromUserId, toUserId });
      return Promise.reject("Invalid IDs");
    }

    try {
      // 🔥 Chrome extension bug fix → MessageChannel çakışmasını kırar
      await Promise.resolve();

      // 🔥 Alternatif Chrome fix → microtask flush
      await new Promise(res => setTimeout(res, 0));

      // 🔥 Stabil SignalR çağrısı
      await this.hubConnection.invoke(
        "SendMessage",
        requestId,
        fromUserId,
        toUserId,
        message,
        callId ?? null
      );

      console.log(`[ChatService] 📤 Mesaj gönderildi → ${toUserId}`);

    } catch (err) {
      console.error("[ChatService] ❌ SendMessage Hatası:", err);
      throw err;
    }
  }

  // ============================================================
  // 👁 Okundu / tümü okundu
  // ============================================================
  markAsRead(messageId: number, userId: number) {
    if (!this.hubConnection) return;
    this.hubConnection
      .invoke('MarkMessageAsRead', messageId, userId)
      .catch(err => console.error('[ChatService] MarkMessageAsRead hatası:', err));
  }

  markAllAsRead(requestId: number, userId: number) {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn("[ChatService] markAllAsRead skipped → hub not ready");
      return;
    }

    this.hubConnection
      .invoke('MarkAllAsRead', requestId, userId)
      .catch(err => console.error('[ChatService] MarkAllAsRead hatası:', err));
  }

  // ============================================================
  // 🧲 Mesaj geçmişi yükle
  // ============================================================
  async loadMessageHistory(requestId: number): Promise<void> {
    await this.ensureConnected();
    this.hubConnection
      .invoke('GetMessageHistory', requestId)
      .catch(err => console.error('[ChatService] GetMessageHistory hatası:', err));
  }

  // Hub bağlı mı?
  private async ensureConnected(): Promise<void> {
    if (!this.hubConnection) throw new Error('Hub connection not initialized');

    let retries = 0;
    while (this.hubConnection.state !== signalR.HubConnectionState.Connected && retries < 10) {
      await new Promise(r => setTimeout(r, 300));
      retries++;
    }

    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR bağlantısı kurulamadı.');
    }
  }

  stopConnection() {
    this.hubConnection?.stop().then(() => console.log('[ChatService] 🔌 Chat bağlantısı kapatıldı.'));
  }

  // ============================================================
  // Customer → Agent atama
  // ============================================================
  private assignAgentToCustomer() {
    if (!this.hubConnection || !this.connectedUserId) return;
    this.hubConnection
      .invoke('AssignAgentToCustomer', this.connectedUserId)
      .catch(err => console.error('[ChatService] AssignAgentToCustomer hatası:', err));
  }

  // ============================================================
  // 🆕 Müşterinin atanmış temsilcisini getir
  // ============================================================
  getAssignedAgentId(customerId: number): number | null {
    const assigned = this.assignedAgentMap.get(customerId);
    console.log(`[ChatService] getAssignedAgentId(${customerId}) → ${assigned}`);
    return assigned ?? null;
  }
}
