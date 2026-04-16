import { Injectable, EventEmitter, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { VoiceCall } from '../../staff/models/voice-call.model';

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private readonly voiceApiUrl = `${environment.apiUrl}/api/agent/voice`;

  private hubConnection!: signalR.HubConnection;

  private peer?: RTCPeerConnection;
  private localStream?: MediaStream;
  private remoteStream?: MediaStream;

  // ICE + Answer queue
  private pendingIce: RTCIceCandidateInit[] = [];
  private pendingRemoteAnswer: RTCSessionDescriptionInit | null = null;

  // DOM audio refs
  private localAudioEl?: HTMLAudioElement;
  private remoteAudioEl?: HTMLAudioElement;

  // Active call tracking
  private currentRequestId?: number;
  private currentTargetId?: number;

  // Prevent duplicate apply
  private offerApplied = false;
  private answerApplied = false;

  // Events
  public incomingCall = new EventEmitter<any>();
  public callEnded = new EventEmitter<number>();
  public onCallActive = new EventEmitter<boolean>();

  constructor(
    private zone: NgZone,
    private http: HttpClient
  ) {}

  getVoiceCallsForRequest(requestId: number) {
    return this.http.get<unknown>(`${this.voiceApiUrl}/request/${requestId}`, {
      headers: new HttpHeaders({
        'X-Skip-Auth-Recovery': 'true'
      })
    });
  }

  startVoiceCallRequest(requestId: number, fromUserId: number, toUserId: number) {
    return this.http.post(`${this.voiceApiUrl}/${requestId}/start`, null, {
      params: {
        fromUserId,
        toUserId
      }
    });
  }

  endVoiceCallRequest(id: number) {
    return this.http.post(`${this.voiceApiUrl}/${id}/end`, null);
  }

  normalizeVoiceCalls(calls: unknown): VoiceCall[] {
    return this.extractCollection(calls)
      .map(call => this.normalizeVoiceCall(call))
      .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime());
  }


  // -------------------------------------------------------------
  // AUDIO ELEMENT SETTERS
  // -------------------------------------------------------------
  setLocalAudioElement(el: HTMLAudioElement) {
    this.localAudioEl = el;
  }

  setRemoteAudioElement(el: HTMLAudioElement) {
    this.remoteAudioEl = el;
  }


  // -------------------------------------------------------------
  // SIGNALR CONNECTION START
  // -------------------------------------------------------------
  async startConnection(token: string, role: 'agent' | 'customer', userId: number) {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected)
      return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/voice?role=${role}&userId=${userId}`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.registerHubEvents();

    await this.hubConnection.start().catch(err => {
      console.error('[VoiceService] ❌ Hub connect failed:', err);
    });

    console.log('[VoiceService] 🔗 VoiceHub connected');
  }


  // -------------------------------------------------------------
  // START CALL → Caller creates OFFER
  // -------------------------------------------------------------
  async startCall(requestId: number, targetUserId: number) {
    this.currentRequestId = requestId;
    this.currentTargetId = targetUserId;
    this.resetFlags();

    console.log(`[VoiceService] 📞 StartCall Req=${requestId} → To=${targetUserId}`);

    await this.preparePeer();

    const offer = await this.peer!.createOffer();
    await this.peer!.setLocalDescription(offer);

    await this.hubConnection.invoke('StartCall', requestId, this.getUserId(), targetUserId);
    await this.hubConnection.invoke('SendOffer', requestId, targetUserId, JSON.stringify(offer));

    this.onCallActive.emit(true);
  }


  // -------------------------------------------------------------
  // ACCEPT CALL → Answer generation is inside ReceiveOffer
  // -------------------------------------------------------------
  async acceptCall(requestId: number, fromUserId: number) {
    this.currentRequestId = requestId;
    this.currentTargetId = fromUserId;
    console.log('[VoiceService] ☑ acceptCall UI confirmed');
  }


  // -------------------------------------------------------------
  // PREPARE PEER + MIC
  // -------------------------------------------------------------
  private async preparePeer() {
    this.peer = this.createPeer(this.currentRequestId!, this.currentTargetId!);

    // ✔ Single getUserMedia (Android uyumlu)
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    this.localStream.getTracks().forEach(t => this.peer!.addTrack(t, this.localStream!));

    if (this.localAudioEl) {
      this.localAudioEl.srcObject = this.localStream;
      this.localAudioEl.muted = true;
      this.localAudioEl.autoplay = true;
      (this.localAudioEl as any).playsInline = true;
    }
  }


  // -------------------------------------------------------------
  // CREATE PEER (Android autoplay fix + Answer queue)
  // -------------------------------------------------------------
  private createPeer(requestId: number, targetUserId: number): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: [
            'turn:relay1.expressturn.com:3478?transport=udp',
            'turn:relay1.expressturn.com:3478?transport=tcp'
          ],
          username: '000000002079529594',
          credential: 'bGmbzhe2k0qYmBMqgLwv89Ru9UY='
        }
      ]
    });

    // 🔥 Answer erken gelirse → sıraya al
    pc.onsignalingstatechange = async () => {
      if (this.pendingRemoteAnswer && pc.signalingState === 'have-local-offer') {
        const ans = this.pendingRemoteAnswer;
        this.pendingRemoteAnswer = null;

        await pc.setRemoteDescription(new RTCSessionDescription(ans));
        this.answerApplied = true;
      }
    };

    pc.onicecandidate = e => {
      if (e.candidate) {
        this.hubConnection.invoke(
          'SendIceCandidate',
          requestId,
          targetUserId,
          JSON.stringify(e.candidate)
        );
      }
    };

    // ✔ Android hoparlör çalışmama FIX → autoplay + playsInline
    pc.ontrack = e => {
      this.remoteStream = e.streams[0];

      if (this.remoteAudioEl) {
        this.remoteAudioEl.srcObject = this.remoteStream;
        this.remoteAudioEl.autoplay = true;
        (this.remoteAudioEl as any).playsInline = true;

        // 🔥 Chrome Android autoplay fix
        this.remoteAudioEl.play().catch(() => {
          console.warn('[VoiceService] 🔇 Android autoplay blocked → manual play required');
        });
      }
    };

    return pc;
  }


  // -------------------------------------------------------------
  // REGISTER HUB EVENTS
  // -------------------------------------------------------------
  private registerHubEvents() {

    // ---------------------------------------------------------
    // 📥 INCOMING CALL POPUP
    // ---------------------------------------------------------
    this.hubConnection.on('VoiceIncomingCall', data => {
      this.zone.run(() => this.incomingCall.emit(data));
    });


    // ---------------------------------------------------------
    // 🎧 RECEIVE OFFER (callee)
    // ---------------------------------------------------------
    this.hubConnection.on('ReceiveOffer', async (requestId, fromUserId, sdp) => {
      this.zone.run(async () => {
        if (this.offerApplied) return;

        this.currentRequestId = requestId;
        this.currentTargetId = fromUserId;

        if (!this.peer) await this.preparePeer();

        await this.peer!.setRemoteDescription(
          new RTCSessionDescription(JSON.parse(sdp))
        );

        this.offerApplied = true;

        // apply buffered ice
        for (const ice of this.pendingIce) {
          await this.peer!.addIceCandidate(new RTCIceCandidate(ice));
        }
        this.pendingIce = [];

        // create answer
        const answer = await this.peer!.createAnswer();
        await this.peer!.setLocalDescription(answer);

        await this.hubConnection.invoke(
          'SendAnswer',
          requestId,
          fromUserId,
          JSON.stringify(answer)
        );

        this.onCallActive.emit(true);
      });
    });


    // ---------------------------------------------------------
    // 🔄 RECEIVE ANSWER (caller)
    // ---------------------------------------------------------
    this.hubConnection.on('ReceiveAnswer', async (requestId, _, sdp) => {
      this.zone.run(async () => {
        if (requestId !== this.currentRequestId) return;
        if (!this.peer) return;
        if (this.answerApplied) return;

        const answer = JSON.parse(sdp);

        if (this.peer!.signalingState !== 'have-local-offer') {
          this.pendingRemoteAnswer = answer;
          return;
        }

        await this.peer!.setRemoteDescription(new RTCSessionDescription(answer));
        this.answerApplied = true;
      });
    });


    // ---------------------------------------------------------
    // 🧊 RECEIVE ICE
    // ---------------------------------------------------------
    this.hubConnection.on('ReceiveIceCandidate', async (requestId, _, candidateStr) => {
      this.zone.run(async () => {
        if (requestId !== this.currentRequestId) return;

        const ice = JSON.parse(candidateStr);

        if (this.peer?.remoteDescription) {
          await this.peer.addIceCandidate(new RTCIceCandidate(ice));
        } else {
          this.pendingIce.push(ice);
        }
      });
    });


    // ---------------------------------------------------------
    // ❌ CALL ENDED
    // ---------------------------------------------------------
    this.hubConnection.on('VoiceCallEnded', () => {
      this.zone.run(() => {
        this.cleanup();
        this.callEnded.emit(1);
        this.onCallActive.emit(false);
      });
    });


    // ---------------------------------------------------------
    // 🔥 DOUBLE LOGIN PROTECTION
    // ---------------------------------------------------------
    this.hubConnection.on('ForceDisconnect', () => {
      this.cleanup();
    });
  }


  // -------------------------------------------------------------
  // END CALL
  // -------------------------------------------------------------
  async endCall(requestId?: number) {
    const req = requestId ?? this.currentRequestId;
    const user = this.getUserId();

    if (!req || !user) {
      console.error('[VoiceService] ❌ endCall called without valid req/user', {
        requestId,
        currentRequestId: this.currentRequestId,
        user
      });
      return;
    }

    console.log('[VoiceService] 📴 Ending call → Req:', req, 'User:', user);

    await this.hubConnection.invoke('EndCall', req, user).catch(err => {
      console.error('[VoiceService] hub EndCall error:', err);
    });

    this.cleanup();
  }

  // -------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------
  public cleanup() {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.peer?.close();

    this.peer = undefined;
    this.localStream = undefined;
    this.remoteStream = undefined;

    this.pendingIce = [];
    this.pendingRemoteAnswer = null;

    this.resetFlags();

    this.currentRequestId = undefined;
    this.currentTargetId = undefined;
  }

  private resetFlags() {
    this.offerApplied = false;
    this.answerApplied = false;
  }


  // -------------------------------------------------------------
  // TOKEN → USER ID
  // -------------------------------------------------------------
  private getUserId(): number {
    const token =
      localStorage.getItem('staffToken') ||
      localStorage.getItem('customerToken');

    if (!token) return 0;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      return Number(
        payload.sub ||
        payload.nameid ||
        payload.nameId ||
        payload.id ||
        payload.userId ||
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
        0
      );
    } catch (err) {
      console.error("[VoiceService] Token decode failed:", err);
      return 0;
    }
  }

  private normalizeVoiceCall(call: any): VoiceCall {
    return {
      id: Number(call?.id ?? call?.Id ?? 0),
      requestId: Number(call?.requestId ?? call?.RequestId ?? 0),
      fromUserId: Number(call?.fromUserId ?? call?.FromUserId ?? 0),
      toUserId: Number(call?.toUserId ?? call?.ToUserId ?? 0),
      startedAt: String(call?.startedAt ?? call?.StartedAt ?? ''),
      endedAt: call?.endedAt ?? call?.EndedAt,
      status: String(call?.status ?? call?.Status ?? ''),
      callerName: call?.callerName ?? call?.CallerName,
      receiverName: call?.receiverName ?? call?.ReceiverName
    };
  }

  private extractCollection(payload: any): any[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.$values)) {
      return payload.$values;
    }

    if (Array.isArray(payload?.items)) {
      return payload.items;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.voiceCalls)) {
      return payload.voiceCalls;
    }

    return [];
  }
}
