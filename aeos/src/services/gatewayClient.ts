/**
 * GatewayClient — lightweight WebSocket client for the OpenClaw gateway.
 *
 * Protocol:
 *   Server → { type: "event", event: "connect.challenge", payload: { nonce } }
 *   Client → { type: "req", id, method: "connect", params: { ... } }
 *   Server → { type: "res", id, ok: true, payload: { type: "hello-ok", ... } }
 *
 *   Client → { type: "req", id, method: "chat.send", params: { sessionKey, message } }
 *   Server → { type: "event", event: "chat", payload: { state, runId, ... } }
 *   Server → { type: "event", event: "agent", payload: { stream, data, ... } }
 *   Server → { type: "event", event: "exec.approval.requested", payload: { ... } }
 */

export type GatewayEventFrame = {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
};

export type GatewayResponseFrame = {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: string; message: string };
};

export type GatewayHelloOk = {
  type: "hello-ok";
  protocol: number;
  features?: { methods?: string[]; events?: string[] };
  snapshot?: unknown;
};

export type ChatEventPayload = {
  runId: string;
  sessionKey: string;
  state: "delta" | "final" | "aborted" | "error";
  /** Streamed text chunk (delta state) */
  delta?: string;
  /** Full message (final state) */
  message?: unknown;
  errorMessage?: string;
};

export type AgentEventPayload = {
  runId: string;
  seq: number;
  stream: string;
  ts: number;
  sessionKey?: string;
  data: Record<string, unknown>;
};

export type ExecApprovalPayload = {
  id: string;
  runId: string;
  sessionKey?: string;
  command: string;
  args?: string[];
  description?: string;
  expiresAtMs: number;
};

type Pending = {
  resolve: (v: unknown) => void;
  reject: (err: Error) => void;
};

export type GatewayClientOptions = {
  url: string;
  token?: string;
  onHello?: (hello: GatewayHelloOk) => void;
  onEvent?: (evt: GatewayEventFrame) => void;
  onClose?: (info: { code: number; reason: string }) => void;
  onConnecting?: () => void;
};

function uuid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, Pending>();
  private closed = false;
  private connectSent = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffMs = 1000;

  constructor(private opts: GatewayClientOptions) {}

  start() {
    this.closed = false;
    this.backoffMs = 1000;
    this.connect();
  }

  stop() {
    this.closed = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.flushPending(new Error("client stopped"));
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private connect() {
    if (this.closed) return;
    this.opts.onConnecting?.();
    try {
      this.ws = new WebSocket(this.opts.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws.addEventListener("open", () => {
      // wait for connect.challenge
    });
    this.ws.addEventListener("message", (ev) => this.handleMessage(String(ev.data ?? "")));
    this.ws.addEventListener("close", (ev) => {
      this.ws = null;
      this.flushPending(new Error(`gateway closed (${ev.code})`));
      this.opts.onClose?.({ code: ev.code, reason: String(ev.reason ?? "") });
      this.scheduleReconnect();
    });
    this.ws.addEventListener("error", () => {
      // close handler will fire
    });
  }

  private scheduleReconnect() {
    if (this.closed) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 1.8, 20_000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private flushPending(err: Error) {
    for (const [, p] of this.pending) p.reject(err);
    this.pending.clear();
  }

  private send(obj: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(obj));
      } catch {
        /* ignore */
      }
    }
  }

  private sendConnect() {
    if (this.connectSent) return;
    this.connectSent = true;

    const id = uuid();
    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: "aeos-ui",
        version: "1.0.0",
        platform: "web",
        mode: "webchat",
      },
      role: "operator",
      scopes: ["operator.admin", "operator.approvals"],
      auth: this.opts.token ? { token: this.opts.token } : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "aeos/1.0",
      locale: typeof navigator !== "undefined" ? navigator.language : "en",
    };

    const p = new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.send({ type: "req", id, method: "connect", params });

    p.then((payload) => {
      this.backoffMs = 1000;
      this.opts.onHello?.(payload as GatewayHelloOk);
    }).catch(() => {
      this.ws?.close(4008, "connect failed");
    });
  }

  private handleMessage(raw: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    const frame = parsed as { type?: unknown };

    if (frame.type === "event") {
      const evt = parsed as GatewayEventFrame;

      if (evt.event === "connect.challenge") {
        const payload = evt.payload as { nonce?: unknown } | undefined;
        const nonce = typeof payload?.nonce === "string" ? payload.nonce : null;
        if (nonce) {
          this.connectSent = false;
          this.sendConnect();
        }
        return;
      }

      try {
        this.opts.onEvent?.(evt);
      } catch (err) {
        console.error("[gateway] event handler error:", err);
      }
      return;
    }

    if (frame.type === "res") {
      const res = parsed as GatewayResponseFrame;
      const pending = this.pending.get(res.id);
      if (!pending) return;
      this.pending.delete(res.id);
      if (res.ok) {
        pending.resolve(res.payload);
      } else {
        pending.reject(new Error(res.error?.message ?? "request failed"));
      }
      return;
    }
  }

  async request<T = unknown>(method: string, params?: unknown): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("gateway not connected");
    }
    const id = uuid();
    const p = new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (v) => resolve(v as T),
        reject,
      });
    });
    this.send({ type: "req", id, method, params });
    return p;
  }

  // Convenience helpers
  async chatSend(sessionKey: string, message: string, idempotencyKey?: string) {
    return this.request("chat.send", {
      sessionKey,
      message,
      deliver: false,
      idempotencyKey: idempotencyKey ?? uuid(),
    });
  }

  async chatHistory(sessionKey: string, limit = 50) {
    return this.request<{ messages?: unknown[]; thinkingLevel?: string }>("chat.history", {
      sessionKey,
      limit,
    });
  }

  async approveExec(id: string) {
    return this.request("exec.approval.approve", { id });
  }

  async rejectExec(id: string) {
    return this.request("exec.approval.reject", { id });
  }
}
