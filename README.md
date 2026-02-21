# AE

## Submodules

| Repo | Path | Purpose |
|------|------|---------|
| [openclaws](https://github.com/assistarmy2024/openclaws) | `./openclaws/` | Full-featured self-hosted AI assistant (TypeScript, Node.js) |
| [zeroclaw](https://github.com/openagen/zeroclaw) | `./zeroclaw/` | Lite/edge AI assistant runtime (Rust, <5MB RAM, single binary) |
| [awesome-copilot](https://github.com/assistarmy2024/awesome-copilot) | `./awesome-copilot/` | Community library of agents, prompts, skills |

**Integration guides:**
- [docs/zeroclaw-integration.md](docs/zeroclaw-integration.md) — ZeroClaw as a lite/edge runtime, deployment patterns with OpenClaw
- [docs/awesome-copilot-integration.md](docs/awesome-copilot-integration.md) — porting skills and MCP bridge setup

---

## OpenClaw System

This repository includes the [OpenClaw](https://github.com/assistarmy2024/openclaws) personal AI assistant system, cloned into the `openclaws/` directory.

---

## What is OpenClaw?

**OpenClaw** is a self-hosted, privacy-focused personal AI assistant that runs on your own devices and integrates with messaging channels you already use.

- Connects to WhatsApp, Telegram, Slack, Discord, iMessage, Signal, Teams, Matrix, and more
- Always-on with voice wake + talk mode (macOS/iOS/Android)
- Controls browser, canvas, cameras, system commands, cron jobs, webhooks
- Single WebSocket Gateway control plane for all clients, channels, and tools
- Extensible with plugins/skills and custom channels

---

## Quick Start

### Install (global npm)

```bash
npm install -g openclaw@latest
# or
pnpm add -g openclaw@latest

# Run onboarding wizard
openclaw onboard --install-daemon
```

### Install from source

```bash
cd openclaws

# Install dependencies (requires pnpm + Node 22+)
pnpm install

# Build
pnpm build

# Run onboarding
pnpm openclaw onboard --install-daemon
```

### Start the Gateway

```bash
openclaw gateway --port 18789 --verbose
```

The Gateway control plane starts at `http://localhost:18789` and serves the WebChat UI.

---

## Configuration

1. Copy `.env.example` to `~/.openclaw/.env` and fill in your API keys:

```bash
cp openclaws/.env.example ~/.openclaw/.env
```

2. Set at least one model provider API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
# or
GEMINI_API_KEY=...
```

3. Optional — set a gateway auth token (recommended if binding beyond loopback):

```bash
OPENCLAW_GATEWAY_TOKEN=change-me-to-a-long-random-token
```

4. Minimal agent config (`~/.openclaw/openclaw.json`):

```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-6"
  }
}
```

---

## Key Commands

| Command | Description |
|---------|-------------|
| `openclaw onboard --install-daemon` | Interactive setup wizard, installs daemon |
| `openclaw gateway` | Start the WebSocket control plane |
| `openclaw agent --message "..."` | Send a message to the AI agent |
| `openclaw channels login` | Link messaging channels |
| `openclaw channels status` | Check channel health |
| `openclaw config set` | Modify configuration |
| `openclaw doctor` | Troubleshoot and run migrations |
| `openclaw message send` | Send a message via a channel |

---

## In-Chat Commands

Once connected via any messaging channel:

| Command | Effect |
|---------|--------|
| `/status` | Show session status |
| `/new` or `/reset` | Reset conversation |
| `/think <level>` | Set thinking level: off / minimal / low / medium / high / xhigh |
| `/verbose on\|off` | Toggle verbose output |
| `/usage off\|tokens\|full` | Show token/cost tracking |
| `/restart` | Restart the gateway |

---

## Architecture Overview

```
Messaging Channels (WhatsApp, Telegram, Slack, Discord, iMessage...)
                        |
                  Gateway (WebSocket)
                  ws://localhost:18789
                        |
        ┌───────────────┼───────────────┐
        |               |               |
   Pi Agent (RPC)   WebChat UI     macOS App
   CLI Commands                   (menu bar)
                                       |
                              iOS / Android Nodes
```

- **Gateway** — single WS control plane, handles auth, sessions, channels, cron, webhooks
- **Channels** — messaging platform connectors (core + 39 extension plugins)
- **Skills** — 55+ bundled tools (GitHub, Discord, Canvas, 1Password, etc.)
- **Sessions** — `main` for direct chats + isolated per-group/channel sessions

---

## Development

```bash
pnpm install          # Install dependencies
pnpm build            # Type-check + build
pnpm check            # Format check + lint + typecheck
pnpm format:fix       # Auto-format
pnpm test             # Run unit tests
pnpm gateway:watch    # Dev mode (auto-reload)
pnpm ui:dev           # Dev UI server
```

---

## Stack

- **Runtime**: Node.js 22+ / TypeScript / ESM
- **Package manager**: pnpm (monorepo workspace)
- **AI providers**: Anthropic (Claude), OpenAI, Google Gemini, AWS Bedrock, OpenRouter
- **Channels**: Baileys (WhatsApp), Grammy (Telegram), Bolt (Slack), discord.js, LINE
- **Browser**: Playwright
- **UI**: Lit + Vite
- **Tests**: Vitest

---

## Repository Structure

```
openclaws/
├── src/          # Core TypeScript source (commands, gateway, channels, agents)
├── extensions/   # 39 channel/tool extension plugins
├── skills/       # 55+ bundled skills
├── apps/         # macOS, iOS, Android companion apps
├── packages/     # Shared workspace packages
├── ui/           # WebChat UI (Vite + Lit)
├── docs/         # Documentation (Mintlify)
└── scripts/      # Build & automation scripts
```
