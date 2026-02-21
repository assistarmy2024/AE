# AEOS — AI Operating System UI

A beautiful, glassy neomorphic AI OS interface powered by OpenClaw, ZeroClaw, and PicoClaw.

## Vision

> A chat/voice/video assistant — "Syd" — that pops up and operates your device like you. It browses the web, renders email, controls apps, and shows you everything it's doing in a live simulation pane. You approve or auto-approve actions. It's not just a chatbot — it's an AI OS.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite + TypeScript |
| 3D | Spline (`@splinetool/react-spline` + `@splinetool/viewer`) |
| Animation | Framer Motion |
| State | Zustand |
| Styling | Tailwind CSS + custom glassmorphic CSS |
| Icons | Lucide React |
| Backend | OpenClaw gateway (ws://localhost:18789) |

## Design System

**Glassmorphism** — `backdrop-filter: blur(24px)`, `rgba(255,255,255,0.04)` backgrounds, subtle inset borders.

**Neomorphism** — deep shadows (`rgba(0,0,0,0.55)`) with faint light highlights for depth.

**Color palette:**
| Name | Hex | Use |
|------|-----|-----|
| `void` | `#07070f` | Background |
| `surface` | `#0d0d1a` | Card base |
| `cyan` | `#00d4ff` | Primary accent, OpenClaw |
| `violet` | `#7b2fff` | Secondary, gradient |
| `rose` | `#ff2d6b` | Danger, reject |
| `green` | `#00ff88` | Online, approve, ZeroClaw |
| `amber` | `#ffb347` | Pending, PicoClaw |

## Features

- **Syd avatar** — Spline 3D orb, collapses to bubble, expands to panel
- **Chat window** — rich messages with embedded activity cards, thinking animation
- **Activity pane** — live simulation of what Syd is doing (browser, email, file, terminal)
- **Approval flow** — Approve / Reject each action, or enable Auto-approve
- **Plugin panel** — toggle skills and channels, filter by runtime compatibility
- **Runtime switcher** — OpenClaw / ZeroClaw / PicoClaw in the top bar
- **Spline 3D background** — abstract particles/glass shards scene

## Quick start

```bash
cd aeos
npm install
npm run dev
# opens at http://localhost:5173
```

## Spline 3D Setup

1. Go to [app.spline.design](https://app.spline.design)
2. Create or open a scene
3. Export → "Spline Viewer" → copy the `.splinecode` URL
4. Replace `SCENES.*` URLs in `src/components/SplineScene.tsx`

### Syd avatar scene tips
- Create a glassy orb with orbit rings
- Add a "Speaking" state (scale + glow up)
- Name objects: `Orb`, `Ring1`, `Ring2` — control via `spline.emitEvent()`
- Add a Variable `isSpeaking: boolean` for reactive animations

### Programmatic control (from `SplineScene.tsx`)
```ts
// After onLoad gives you the Application ref:
import { triggerSplineEvent, setSplineVariable } from "@/components/SplineScene";

triggerSplineEvent(spline, "mouseDown", "Orb");  // trigger animation
setSplineVariable(spline, "isSpeaking", true);    // set reactive variable
```

## Connecting to OpenClaw / ZeroClaw / PicoClaw

The Vite dev server proxies `/api` → OpenClaw gateway at `localhost:18789`
and `/ws` → WebSocket. To connect to a different runtime:

```ts
// In store/useAEOSStore.ts, update sendMessage() to call:
const ws = new WebSocket("ws://localhost:18789/ws");
ws.send(JSON.stringify({ type: "message", text }));
```

## File structure

```
aeos/src/
├── components/
│   ├── SplineScene.tsx     # Spline 3D integration (react-spline + viewer)
│   ├── SplineBackground.tsx# Full-screen 3D background (web component)
│   ├── SydAvatar.tsx       # Floating avatar popup with Spline
│   ├── ChatWindow.tsx      # Main chat interface
│   ├── ActivityCard.tsx    # Reusable activity card (browser/email/file preview)
│   ├── ActivityPane.tsx    # Live activity queue + approval
│   ├── PluginPanel.tsx     # Plugin management
│   ├── SidePanel.tsx       # Right panel (activity / plugins / settings)
│   └── TopBar.tsx          # OS menu bar with runtime switcher
├── layouts/
│   └── AIDesktop.tsx       # Root layout (OS shell)
├── store/
│   └── useAEOSStore.ts     # Zustand state (messages, activities, plugins…)
└── styles/
    └── globals.css         # Glass/neo CSS utilities + animations
```
