import { create } from "zustand";
import {
  GatewayClient,
  type GatewayEventFrame,
  type GatewayHelloOk,
  type ChatEventPayload,
  type AgentEventPayload,
  type ExecApprovalPayload,
} from "@/services/gatewayClient";

// ─── Types ─────────────────────────────────────────────────────────────────

export type Runtime = "openclaw" | "zeroclaw" | "picoclaw";
export type ActivityKind = "browser" | "email" | "file" | "terminal" | "screenshot" | "canvas" | "idle";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "auto";

export interface Message {
  id: string;
  role: "user" | "syd" | "system";
  text: string;
  timestamp: Date;
  activity?: Activity;
  streaming?: boolean;
}

export interface Activity {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  url?: string;
  screenshotUrl?: string;
  status: "running" | "waiting" | "done" | "error";
  approval: ApprovalStatus;
  tool?: string;
  toolArgs?: unknown;
  toolOutput?: string;
  execApprovalId?: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  runtime: Runtime[];
  category: "channel" | "tool" | "skill" | "memory";
}

export interface GatewaySettings {
  url: string;
  token: string;
  sessionKey: string;
}

// ─── State interface ───────────────────────────────────────────────────────

interface AEOSState {
  // Gateway
  gatewaySettings: GatewaySettings;
  gatewayConnected: boolean;
  gatewayConnecting: boolean;
  gatewayError: string | null;
  gatewayHello: GatewayHelloOk | null;
  _client: GatewayClient | null;

  // UI
  sydExpanded: boolean;
  sidePanelOpen: boolean;
  activePanel: "plugins" | "activity" | "settings" | "cua";
  autoApprove: boolean;

  // Chat
  messages: Message[];
  isThinking: boolean;
  voiceActive: boolean;
  videoActive: boolean;
  chatRunId: string | null;
  sessionKey: string;

  // Activity / CUA
  currentActivity: Activity | null;
  activityQueue: Activity[];
  toolStreamById: Map<string, Activity>;

  // Runtime
  activeRuntime: Runtime;
  runtimeStatus: Record<Runtime, "online" | "offline" | "busy">;

  // Plugins
  plugins: Plugin[];

  // ─── Actions ───────────────────────────────────────────────────────────
  connectGateway: () => void;
  disconnectGateway: () => void;
  updateGatewaySettings: (s: Partial<GatewaySettings>) => void;
  setSydExpanded: (v: boolean) => void;
  setSidePanelOpen: (v: boolean) => void;
  setActivePanel: (p: AEOSState["activePanel"]) => void;
  setAutoApprove: (v: boolean) => void;
  sendMessage: (text: string) => void;
  setVoiceActive: (v: boolean) => void;
  setVideoActive: (v: boolean) => void;
  approveActivity: (id: string) => void;
  rejectActivity:  (id: string) => void;
  setActiveRuntime: (r: Runtime) => void;
  togglePlugin: (id: string) => void;
}

// ─── Plugin defaults ───────────────────────────────────────────────────────

const defaultPlugins: Plugin[] = [
  { id: "github",   name: "GitHub",   description: "Issues, PRs, CI via gh CLI",               icon: "🐙", enabled: true,  runtime: ["openclaw","zeroclaw"],           category: "skill"   },
  { id: "telegram", name: "Telegram", description: "Send & receive Telegram messages",          icon: "✈️", enabled: true,  runtime: ["openclaw","zeroclaw","picoclaw"], category: "channel" },
  { id: "discord",  name: "Discord",  description: "Discord bot with voice support",            icon: "🎮", enabled: false, runtime: ["openclaw","zeroclaw"],           category: "channel" },
  { id: "browser",  name: "Browser",  description: "Full browser control via Playwright",       icon: "🌐", enabled: true,  runtime: ["openclaw"],                      category: "tool"    },
  { id: "memory",   name: "Memory",   description: "Long-term vector + keyword memory",         icon: "🧠", enabled: true,  runtime: ["openclaw","zeroclaw"],           category: "memory"  },
  { id: "himalaya", name: "Email",    description: "Read, compose, send email",                 icon: "📧", enabled: true,  runtime: ["openclaw"],                      category: "skill"   },
  { id: "prd",      name: "PRD",      description: "Product Requirements Document generator",   icon: "📋", enabled: true,  runtime: ["openclaw","zeroclaw"],           category: "skill"   },
  { id: "meeting",  name: "Meetings", description: "Auto-generate meeting minutes",             icon: "📝", enabled: false, runtime: ["openclaw","zeroclaw"],           category: "skill"   },
  { id: "canvas",   name: "Canvas",   description: "A2UI visual workspace for drawing & notes", icon: "🎨", enabled: true,  runtime: ["openclaw"],                      category: "tool"    },
  { id: "gpio",     name: "GPIO",     description: "Raspberry Pi hardware control",             icon: "🔌", enabled: false, runtime: ["zeroclaw"],                      category: "tool"    },
  { id: "ollama",   name: "Ollama",   description: "Local LLM inference (zero API cost)",       icon: "🦙", enabled: false, runtime: ["zeroclaw","picoclaw"],           category: "tool"    },
  { id: "plantuml", name: "Diagrams", description: "ASCII art diagrams via PlantUML",          icon: "📊", enabled: true,  runtime: ["openclaw","zeroclaw"],           category: "skill"   },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

let msgCounter = 10;
let actCounter = 10;
const nextMsgId = () => String(++msgCounter);
const nextActId = () => String(++actCounter);

function toolKind(tool: string): ActivityKind {
  const t = tool.toLowerCase();
  if (t.includes("browser") || t.includes("navigate") || t.includes("click") || t.includes("page")) return "browser";
  if (t.includes("email") || t.includes("mail") || t.includes("himalaya")) return "email";
  if (t.includes("bash") || t.includes("terminal") || t.includes("exec") || t.includes("command")) return "terminal";
  if (t.includes("file") || t.includes("read") || t.includes("write") || t.includes("glob")) return "file";
  if (t.includes("screen") || t.includes("screenshot")) return "screenshot";
  if (t.includes("canvas") || t.includes("draw")) return "canvas";
  return "idle";
}

function toolTitle(name: string, args: unknown): string {
  const a = args as Record<string, unknown> | null;
  if (!a) return name;
  if (typeof a.url === "string") return a.url.slice(0, 60);
  if (typeof a.command === "string") return a.command.slice(0, 60);
  if (typeof a.path === "string") return a.path.slice(0, 60);
  if (typeof a.query === "string") return a.query.slice(0, 60);
  return name;
}

function systemWelcome(): Message[] {
  return [
    { id: "1", role: "system", text: "AEOS online. Syd is ready.", timestamp: new Date(Date.now() - 60000) },
    { id: "2", role: "syd",   text: "Hey! I'm Syd — your AI assistant. I can browse the web, manage your email, control apps, write code, and a lot more. What would you like to do?", timestamp: new Date(Date.now() - 55000) },
  ];
}

const DEFAULT_SETTINGS: GatewaySettings = { url: "ws://localhost:18789", token: "", sessionKey: "main" };

function loadSettings(): GatewaySettings {
  try {
    const s = localStorage.getItem("aeos:gateway");
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) as Partial<GatewaySettings> };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useAEOSStore = create<AEOSState>((set, get) => {

  function handleEvent(evt: GatewayEventFrame) {
    const { autoApprove } = get();

    // Chat streaming
    if (evt.event === "chat") {
      const p = evt.payload as ChatEventPayload | undefined;
      if (!p) return;

      if (p.state === "delta" && typeof p.delta === "string") {
        set((s) => {
          const last = s.messages[s.messages.length - 1];
          if (last?.role === "syd" && last.streaming) {
            return { messages: [...s.messages.slice(0, -1), { ...last, text: last.text + p.delta }] };
          }
          return {
            isThinking: false,
            messages: [...s.messages, { id: nextMsgId(), role: "syd" as const, text: p.delta ?? "", timestamp: new Date(), streaming: true }],
          };
        });
        return;
      }

      if (p.state === "final") {
        set((s) => {
          const last = s.messages[s.messages.length - 1];
          if (last?.role === "syd" && last.streaming) {
            return { isThinking: false, chatRunId: null, messages: [...s.messages.slice(0, -1), { ...last, streaming: false }] };
          }
          const msg = p.message as Record<string, unknown> | null;
          let text = "";
          if (msg?.content) {
            if (typeof msg.content === "string") text = msg.content;
            else if (Array.isArray(msg.content)) {
              text = (msg.content as Array<{ type: string; text?: string }>).filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n");
            }
          }
          if (!text) return { isThinking: false, chatRunId: null };
          return { isThinking: false, chatRunId: null, messages: [...s.messages, { id: nextMsgId(), role: "syd" as const, text, timestamp: new Date() }] };
        });
        return;
      }

      if (p.state === "error" || p.state === "aborted") {
        const errText = p.errorMessage ?? (p.state === "aborted" ? "Request aborted." : "An error occurred.");
        set((s) => ({
          isThinking: false,
          chatRunId: null,
          messages: [...s.messages.filter((m) => !m.streaming), { id: nextMsgId(), role: "system" as const, text: errText, timestamp: new Date() }],
        }));
        return;
      }
    }

    // Agent / CUA tool stream
    if (evt.event === "agent") {
      const p = evt.payload as AgentEventPayload | undefined;
      if (!p?.stream) return;
      const { stream, data = {} } = p;

      if (stream === "tool_start") {
        const name = String(data.name ?? "tool");
        const toolCallId = String(data.toolCallId ?? data.id ?? nextActId());
        const args = data.args ?? data.input;
        const kind = toolKind(name);
        const activity: Activity = {
          id: toolCallId,
          kind,
          title: toolTitle(name, args),
          description: `${name} — running`,
          url: typeof (args as Record<string, unknown> | null)?.url === "string" ? String((args as Record<string, unknown>).url) : undefined,
          status: "running",
          approval: autoApprove ? "auto" : "approved",
          tool: name,
          toolArgs: args,
        };
        set((s) => ({
          currentActivity: activity,
          activityQueue: [activity, ...s.activityQueue.slice(0, 19)],
          toolStreamById: new Map(s.toolStreamById).set(toolCallId, activity),
        }));
        return;
      }

      if (stream === "tool_end") {
        const id = String(data.toolCallId ?? data.id ?? "");
        const output = typeof data.output === "string" ? data.output : JSON.stringify(data.output ?? "");
        set((s) => {
          const ex = s.toolStreamById.get(id);
          if (!ex) return {};
          const updated: Activity = { ...ex, status: "done", toolOutput: output.slice(0, 2000), description: `${ex.tool ?? "tool"} — done` };
          const m = new Map(s.toolStreamById); m.set(id, updated);
          return { toolStreamById: m, activityQueue: s.activityQueue.map((a) => a.id === id ? updated : a), currentActivity: s.currentActivity?.id === id ? updated : s.currentActivity };
        });
        return;
      }

      if (stream === "tool_error") {
        const id = String(data.toolCallId ?? data.id ?? "");
        set((s) => {
          const ex = s.toolStreamById.get(id);
          if (!ex) return {};
          const updated: Activity = { ...ex, status: "error", description: String(data.error ?? "Tool error") };
          const m = new Map(s.toolStreamById); m.set(id, updated);
          return { toolStreamById: m, activityQueue: s.activityQueue.map((a) => a.id === id ? updated : a), currentActivity: s.currentActivity?.id === id ? updated : s.currentActivity };
        });
        return;
      }
    }

    // Exec approval
    if (evt.event === "exec.approval.requested") {
      const p = evt.payload as ExecApprovalPayload | undefined;
      if (!p) return;
      const activity: Activity = {
        id: p.id,
        kind: "terminal",
        title: p.command,
        description: p.description ?? `Run: ${p.command}${p.args?.length ? " " + p.args.join(" ") : ""}`,
        status: "waiting",
        approval: "pending",
        tool: "bash",
        toolArgs: { command: p.command, args: p.args },
        execApprovalId: p.id,
      };
      set((s) => ({
        currentActivity: activity,
        activityQueue: [activity, ...s.activityQueue.filter((a) => a.id !== p.id).slice(0, 19)],
      }));
      const remaining = Math.max(0, p.expiresAtMs - Date.now());
      setTimeout(() => {
        set((s) => ({
          activityQueue: s.activityQueue.filter((a) => a.id !== p.id),
          currentActivity: s.currentActivity?.id === p.id ? null : s.currentActivity,
        }));
      }, remaining + 500);
      return;
    }

    if (evt.event === "exec.approval.resolved") {
      const p = evt.payload as { id?: string } | undefined;
      if (!p?.id) return;
      set((s) => ({
        activityQueue: s.activityQueue.filter((a) => a.id !== p.id),
        currentActivity: s.currentActivity?.id === p.id ? null : s.currentActivity,
      }));
      return;
    }
  }

  function buildClient(settings: GatewaySettings): GatewayClient {
    return new GatewayClient({
      url: settings.url,
      token: settings.token || undefined,
      onConnecting: () => set({ gatewayConnecting: true, gatewayConnected: false, gatewayError: null }),
      onHello: (hello) => {
        set({ gatewayConnected: true, gatewayConnecting: false, gatewayError: null, gatewayHello: hello, runtimeStatus: { openclaw: "online", zeroclaw: "online", picoclaw: "offline" } });
        // Load chat history
        get()._client?.chatHistory(get().sessionKey).then((res) => {
          if (!res.messages?.length) return;
          const msgs: Message[] = (res.messages as Array<Record<string, unknown>>).map((m) => {
            const role = m.role === "user" ? "user" as const : "syd" as const;
            let text = "";
            if (typeof m.content === "string") text = m.content;
            else if (Array.isArray(m.content)) {
              text = (m.content as Array<{ type: string; text?: string }>).filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n");
            }
            return { id: String(m.id ?? nextMsgId()), role, text, timestamp: m.timestamp ? new Date(m.timestamp as number) : new Date() };
          }).filter((m) => m.text);
          if (msgs.length) set({ messages: [...systemWelcome(), ...msgs] });
        }).catch(() => { /* ignore */ });
      },
      onClose: ({ code, reason }) => {
        set({
          gatewayConnected: false,
          gatewayConnecting: false,
          gatewayError: code === 4008 ? "Auth failed — check your token." : `Disconnected (${code}): ${reason || "no reason"}`,
          runtimeStatus: { openclaw: "offline", zeroclaw: "offline", picoclaw: "offline" },
        });
      },
      onEvent: handleEvent,
    });
  }

  const initialSettings = loadSettings();

  return {
    // Gateway
    gatewaySettings: initialSettings,
    gatewayConnected: false,
    gatewayConnecting: false,
    gatewayError: null,
    gatewayHello: null,
    _client: null,

    // UI
    sydExpanded: false,
    sidePanelOpen: true,
    activePanel: "activity",
    autoApprove: false,

    // Chat
    messages: systemWelcome(),
    isThinking: false,
    voiceActive: false,
    videoActive: false,
    chatRunId: null,
    sessionKey: initialSettings.sessionKey,

    // Activity
    currentActivity: null,
    activityQueue: [],
    toolStreamById: new Map(),

    // Runtime
    activeRuntime: "openclaw",
    runtimeStatus: { openclaw: "offline", zeroclaw: "offline", picoclaw: "offline" },

    plugins: defaultPlugins,

    // ── Actions ────────────────────────────────────────────────────────────

    connectGateway: () => {
      const { _client, gatewaySettings } = get();
      _client?.stop();
      const client = buildClient(gatewaySettings);
      set({ _client: client, gatewayConnecting: true, gatewayError: null });
      client.start();
    },

    disconnectGateway: () => {
      get()._client?.stop();
      set({ _client: null, gatewayConnected: false, gatewayConnecting: false, runtimeStatus: { openclaw: "offline", zeroclaw: "offline", picoclaw: "offline" } });
    },

    updateGatewaySettings: (s) => {
      const next = { ...get().gatewaySettings, ...s };
      try { localStorage.setItem("aeos:gateway", JSON.stringify(next)); } catch { /* ignore */ }
      set({ gatewaySettings: next, sessionKey: next.sessionKey });
    },

    setSydExpanded:   (v) => set({ sydExpanded: v }),
    setSidePanelOpen: (v) => set({ sidePanelOpen: v }),
    setActivePanel:   (p) => set({ activePanel: p }),
    setAutoApprove:   (v) => set({ autoApprove: v }),
    setVoiceActive:   (v) => set({ voiceActive: v }),
    setVideoActive:   (v) => set({ videoActive: v }),
    setActiveRuntime: (r) => set({ activeRuntime: r }),
    togglePlugin: (id) => set((s) => ({ plugins: s.plugins.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p) })),

    sendMessage: (text) => {
      const { _client, gatewayConnected, sessionKey, autoApprove } = get();
      const userMsg: Message = { id: nextMsgId(), role: "user", text, timestamp: new Date() };
      set((s) => ({ messages: [...s.messages, userMsg], isThinking: true }));

      if (!_client || !gatewayConnected) {
        setTimeout(() => {
          const activity: Activity = {
            id: nextActId(), kind: "browser", title: `"${text.slice(0, 40)}${text.length > 40 ? "…" : ""}"`,
            description: "Connect to gateway to run real actions", status: "waiting",
            approval: autoApprove ? "auto" : "pending", tool: "browser.navigate",
          };
          set((s) => ({
            messages: [...s.messages, { id: nextMsgId(), role: "syd" as const, text: "Gateway offline. Configure & connect in Settings to run real actions.", timestamp: new Date(), activity }],
            isThinking: false, currentActivity: activity, activityQueue: [activity, ...s.activityQueue.slice(0, 9)],
          }));
        }, 700);
        return;
      }

      _client.chatSend(sessionKey, text).catch((err: Error) => {
        set((s) => ({
          isThinking: false,
          messages: [...s.messages, { id: nextMsgId(), role: "system" as const, text: `Error: ${err.message}`, timestamp: new Date() }],
        }));
      });
    },

    approveActivity: (id) => {
      const { _client, gatewayConnected, activityQueue } = get();
      const act = activityQueue.find((a) => a.id === id);
      if (_client && gatewayConnected && act?.execApprovalId) {
        _client.approveExec(act.execApprovalId).catch(() => { /* ignore */ });
      }
      set((s) => ({
        activityQueue: s.activityQueue.map((a) => a.id === id ? { ...a, approval: "approved" as const, status: "running" as const } : a),
        currentActivity: s.currentActivity?.id === id ? { ...s.currentActivity, approval: "approved" as const, status: "running" as const } : s.currentActivity,
      }));
    },

    rejectActivity: (id) => {
      const { _client, gatewayConnected, activityQueue } = get();
      const act = activityQueue.find((a) => a.id === id);
      if (_client && gatewayConnected && act?.execApprovalId) {
        _client.rejectExec(act.execApprovalId).catch(() => { /* ignore */ });
      }
      set((s) => ({
        activityQueue: s.activityQueue.map((a) => a.id === id ? { ...a, approval: "rejected" as const, status: "error" as const } : a),
        currentActivity: s.currentActivity?.id === id ? { ...s.currentActivity, approval: "rejected" as const, status: "error" as const } : s.currentActivity,
      }));
    },
  };
});
