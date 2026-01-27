export interface ChatMessage {
  id: number;              // DB'deki mesaj Id
  requestId?: number;       // Request ilişkisi
  callId?: number | null;   // Opsiyonel CallId
  fromUserId: number;
  toUserId: number;
  message: string;
  sentAt: Date;
  isRead?: boolean;         // Okundu bilgisi
}
