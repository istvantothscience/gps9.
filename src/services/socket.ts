import { SessionData, LessonStage, TaskResponse, Participant } from '../types/index.ts';

type StateListener = (session: SessionData) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private code: string = '';
  private participantId?: string;
  private isTeacher: boolean = false;
  private listeners: Set<StateListener> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private currentSession: SessionData | null = null;

  public subscribe(
    code: string,
    participantId?: string,
    isTeacher: boolean = false,
    callback?: StateListener
  ) {
    this.code = code.toUpperCase();
    this.participantId = participantId;
    this.isTeacher = isTeacher;

    if (callback) {
      this.listeners.add(callback);
      if (this.currentSession) {
        callback(this.currentSession);
      }
    }

    this.connectWs();
    this.startPolling(); // fallback poll in background
  }

  public unsubscribe(callback: StateListener) {
    this.listeners.delete(callback);
    if (this.listeners.size === 0) {
      this.disconnect();
    }
  }

  private connectWs() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'subscribe',
            code: this.code,
            participantId: this.participantId,
            isTeacher: this.isTeacher,
          }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'session_update' && data.session) {
            this.handleSessionUpdate(data.session);
          }
        } catch (e) {
          console.error('Socket message parse error', e);
        }
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // Will trigger onclose
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connectWs();
    }, 3000);
  }

  private startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(async () => {
      if (!this.code) return;
      try {
        const res = await fetch(`/api/sessions/${this.code}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.session) {
            this.handleSessionUpdate(data.session);
          }
        }
      } catch {
        // Network silent error
      }
    }, 3000);
  }

  private handleSessionUpdate(session: SessionData) {
    this.currentSession = session;
    for (const listener of this.listeners) {
      listener(session);
    }
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  // REST actions
  public async createSession(title?: string): Promise<{ success: boolean; session?: SessionData; message?: string }> {
    const res = await fetch('/api/sessions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return res.json();
  }

  public async joinSession(
    code: string,
    teamName: string,
    studentId?: string
  ): Promise<{ success: boolean; participant?: Participant; session?: SessionData; message?: string }> {
    const res = await fetch(`/api/sessions/${code.toUpperCase()}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, studentId }),
    });
    const data = await res.json();
    if (data.success && data.session) {
      this.handleSessionUpdate(data.session);
    }
    return data;
  }

  public async setStage(code: string, stage: LessonStage): Promise<{ success: boolean; session?: SessionData }> {
    const res = await fetch(`/api/sessions/${code.toUpperCase()}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    const data = await res.json();
    if (data.success && data.session) {
      this.handleSessionUpdate(data.session);
    }
    return data;
  }

  public async submitResponse(
    code: string,
    participantId: string,
    taskId: string,
    rawAnswer: Record<string, unknown>
  ): Promise<{ success: boolean; response?: TaskResponse; totalScore?: number; badges?: string[]; session?: SessionData }> {
    const res = await fetch(`/api/sessions/${code.toUpperCase()}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, taskId, rawAnswer }),
    });
    const data = await res.json();
    if (data.success && data.session) {
      this.handleSessionUpdate(data.session);
    }
    return data;
  }

  public async overrideScore(
    code: string,
    participantId: string,
    taskId: string,
    score: number
  ): Promise<{ success: boolean }> {
    const res = await fetch(`/api/sessions/${code.toUpperCase()}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, taskId, score }),
    });
    const data = await res.json();
    if (data.success && data.session) {
      this.handleSessionUpdate(data.session);
    }
    return data;
  }

  public async setLessonWorkScore(
    code: string,
    participantId: string,
    score: number
  ): Promise<{ success: boolean }> {
    const res = await fetch(`/api/sessions/${code.toUpperCase()}/lesson-work`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, score }),
    });
    const data = await res.json();
    if (data.success && data.session) {
      this.handleSessionUpdate(data.session);
    }
    return data;
  }
}

export const realtimeClient = new RealtimeClient();
