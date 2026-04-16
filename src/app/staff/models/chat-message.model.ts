export interface ChatMessage {
  id: number;              // DB'deki mesaj Id
  requestId?: number;       // Request ilişkisi
  callId?: number | null;   // Opsiyonel CallId
  fromUserId: number;
  toUserId: number;
  message: string;
  messageType?: string;
  fileUrl?: string | null;
  sentAt: Date;
  isRead?: boolean;         // Okundu bilgisi
}
