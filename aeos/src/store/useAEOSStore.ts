import { create } from "zustand";

export type Runtime = "openclaw" | "zeroclaw" | "picoclaw";
export type ActivityKind = "browser" | "email" | "file" | "terminal" | "screenshot" | "idle";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "auto";

export interface Message {
  id: string;
  role: "user" | "syd" | "system";
  text: string;
  timestamp: Date;
  activity?: Activity;
  thinking?: boolean;
}

export interface Activity {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  url?: string;
  screenshotUrl?: string;
  htmlPreview?: string;
  status: "running" | "waiting" | "done" | "error";
  approval: ApprovalStatus;
  tool?: string;
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

interface AEOSState {
  // UI
  sydExpanded: boolean;
  sidePanelOpen: boolean;
  activePanel: "plugins" | "activity" | "settings";
  autoApprove: boolean;
  // Chat
  messages: Message[];
  isThinking: boolean;
  voiceActive: boolean;
  videoActive: boolean;
  // Activity
  currentActivity: Activity | null;
  activityQueue: Activity[];
  // Runtime
  activeRuntime: Runtime;
  runtimeStatus: Record<Runtime, "online" | "offline" | "busy">;
  // Plugins
  plugins: Plugin[];
  // Actions
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

// Demo activities
const demoActivities: Activity[] = [
  {
    id: "act-1",
    kind: "browser",
    title: "Searching documentation",
    description: "Browsing OpenClaw docs for Gateway configuration",
    url: "https://docs.openclaw.ai/gateway",
    status: "done",
    approval: "auto",
    tool: "browser.navigate",
  },
  {
    id: "act-2",
    kind: "email",
    title: "Reading inbox",
    description: "Scanning 3 unread emails from team",
    status: "waiting",
    approval: "pending",
    tool: "himalaya.list",
  },
];

const defaultPlugins: Plugin[] = [
  { id: "github",     name: "GitHub",      description: "Issues, PRs, CI via gh CLI",                   icon: "🐙", enabled: true,  runtime: ["openclaw","zeroclaw"], category: "skill"   },
  { id: "telegram",   name: "Telegram",    description: "Send & receive Telegram messages",               icon: "✈️", enabled: true,  runtime: ["openclaw","zeroclaw","picoclaw"], category: "channel" },
  { id: "discord",    name: "Discord",     description: "Discord bot with voice support",                 icon: "🎮", enabled: false, runtime: ["openclaw","zeroclaw"], category: "channel" },
  { id: "browser",    name: "Browser",     description: "Full browser control via Playwright",            icon: "🌐", enabled: true,  runtime: ["openclaw"],            category: "tool"    },
  { id: "memory",     name: "Memory",      description: "Long-term vector + keyword memory",              icon: "🧠", enabled: true,  runtime: ["openclaw","zeroclaw"], category: "memory"  },
  { id: "himalaya",   name: "Email",       description: "Read, compose, send email",                     icon: "📧", enabled: true,  runtime: ["openclaw"],            category: "skill"   },
  { id: "prd",        name: "PRD",         description: "Product Requirements Document generator",        icon: "📋", enabled: true,  runtime: ["openclaw","zeroclaw"], category: "skill"   },
  { id: "meeting",    name: "Meetings",    description: "Auto-generate meeting minutes",                  icon: "📝", enabled: false, runtime: ["openclaw","zeroclaw"], category: "skill"   },
  { id: "canvas",     name: "Canvas",      description: "A2UI visual workspace for drawing & notes",      icon: "🎨", enabled: true,  runtime: ["openclaw"],            category: "tool"    },
  { id: "gpio",       name: "GPIO",        description: "Raspberry Pi hardware control",                  icon: "🔌", enabled: false, runtime: ["zeroclaw"],            category: "tool"    },
  { id: "ollama",     name: "Ollama",      description: "Local LLM inference (zero API cost)",            icon: "🦙", enabled: false, runtime: ["zeroclaw","picoclaw"], category: "tool"    },
  { id: "plantuml",   name: "Diagrams",    description: "ASCII art diagrams via PlantUML",                icon: "📊", enabled: true,  runtime: ["openclaw","zeroclaw"], category: "skill"   },
];

// Simulated Syd responses
const sydReplies = [
  "On it. Let me pull that up for you.",
  "Sure — browsing now. I'll show you what I find.",
  "I can do that. Give me a moment to check.",
  "Looking into it. I'll render a preview so you can see exactly what I'm doing.",
  "Got it. I'll handle this step by step and show you each action before I proceed.",
];

let msgId = 10;
let actId = 10;

export const useAEOSStore = create<AEOSState>((set, get) => ({
  sydExpanded:    false,
  sidePanelOpen:  true,
  activePanel:    "activity",
  autoApprove:    false,

  messages: [
    {
      id: "1",
      role: "system",
      text: "AEOS online. Syd is ready.",
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: "2",
      role: "syd",
      text: "Hey! I'm Syd — your AI assistant. I can browse the web, manage your email, control apps, write code, and a lot more. What would you like to do?",
      timestamp: new Date(Date.now() - 55000),
    },
  ],
  isThinking:  false,
  voiceActive: false,
  videoActive: false,

  currentActivity: demoActivities[0],
  activityQueue:   demoActivities,

  activeRuntime: "openclaw",
  runtimeStatus: { openclaw: "online", zeroclaw: "online", picoclaw: "offline" },

  plugins: defaultPlugins,

  setSydExpanded:   (v) => set({ sydExpanded: v }),
  setSidePanelOpen: (v) => set({ sidePanelOpen: v }),
  setActivePanel:   (p) => set({ activePanel: p }),
  setAutoApprove:   (v) => set({ autoApprove: v }),
  setVoiceActive:   (v) => set({ voiceActive: v }),
  setVideoActive:   (v) => set({ videoActive: v }),
  setActiveRuntime: (r) => set({ activeRuntime: r }),

  sendMessage: (text) => {
    const userMsg: Message = {
      id: String(++msgId),
      role: "user",
      text,
      timestamp: new Date(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], isThinking: true }));

    // Simulate Syd thinking then responding with an activity
    setTimeout(() => {
      const activity: Activity = {
        id: String(++actId),
        kind: text.toLowerCase().includes("email") ? "email"
             : text.toLowerCase().includes("browse") || text.toLowerCase().includes("search") ? "browser"
             : text.toLowerCase().includes("file") ? "file"
             : "browser",
        title: `Processing: "${text.slice(0, 40)}${text.length > 40 ? "…" : ""}"`,
        description: `Syd is working on your request`,
        url: "https://example.com",
        status: "waiting",
        approval: get().autoApprove ? "auto" : "pending",
        tool: "browser.navigate",
      };
      const sydMsg: Message = {
        id: String(++msgId),
        role: "syd",
        text: sydReplies[Math.floor(Math.random() * sydReplies.length)],
        timestamp: new Date(),
        activity,
      };
      set((s) => ({
        messages: [...s.messages, sydMsg],
        isThinking: false,
        currentActivity: activity,
        activityQueue: [activity, ...s.activityQueue.slice(0, 9)],
      }));
    }, 1800);
  },

  approveActivity: (id) =>
    set((s) => ({
      activityQueue: s.activityQueue.map((a) =>
        a.id === id ? { ...a, approval: "approved", status: "running" } : a
      ),
      currentActivity:
        s.currentActivity?.id === id
          ? { ...s.currentActivity, approval: "approved", status: "running" }
          : s.currentActivity,
    })),

  rejectActivity: (id) =>
    set((s) => ({
      activityQueue: s.activityQueue.map((a) =>
        a.id === id ? { ...a, approval: "rejected", status: "error" } : a
      ),
      currentActivity:
        s.currentActivity?.id === id
          ? { ...s.currentActivity, approval: "rejected", status: "error" }
          : s.currentActivity,
    })),

  togglePlugin: (id) =>
    set((s) => ({
      plugins: s.plugins.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      ),
    })),
}));
