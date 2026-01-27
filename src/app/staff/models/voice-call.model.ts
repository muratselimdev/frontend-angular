export interface VoiceCall {
  id: number;
  startedAt: string;
  endedAt?: string;
  status: string;
  callerName?: string;
  receiverName?: string;
}
