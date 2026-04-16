export interface VoiceCall {
  id: number;
  requestId?: number;
  fromUserId?: number;
  toUserId?: number;
  startedAt: string;
  endedAt?: string;
  status: string;
  callerName?: string;
  receiverName?: string;
}
