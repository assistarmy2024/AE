# ZeroClaw Integration — Lite / Edge Runtime

[ZeroClaw](https://github.com/openagen/zeroclaw) is a **Rust-native, single-binary**
AI assistant runtime that acts as the lightweight complement to OpenClaw.

Repository is included as a git submodule at `./zeroclaw/`.

---

## Why ZeroClaw?

ZeroClaw answers "what runs on a $10 Raspberry Pi?" while OpenClaw answers
"what runs on a full Mac/Linux server?"

| | OpenClaw | ZeroClaw |
|-|----------|----------|
| **Language** | TypeScript (Node.js) | Rust (static binary) |
| **RAM** | > 1 GB | < 5 MB |
| **Cold start** | > 500 s (0.8 GHz) | < 10 ms |
| **Binary size** | ~28 MB (dist) | ~8.8 MB |
| **Target hardware** | Mac Mini / Linux server | Raspberry Pi / $10 SBC |
| **Config format** | JSON (`openclaw.json`) | TOML (`config.toml`) |
| **Channels** | 15+ (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Teams, Matrix…) | Telegram, Discord, Matrix (E2EE), WhatsApp (optional), Slack, Mattermost, Nextcloud Talk, Lark, email |
| **Providers** | Anthropic, OpenAI, Gemini, OpenRouter, Bedrock, ZAI, Minimax | 30+ (OpenRouter, Anthropic, OpenAI, Gemini, Ollama local, DeepSeek, Groq, Mistral, Bedrock, Qwen, Moonshot, Venice, Cloudflare, xAI, Cohere, Perplexity…) |
| **Skills/plugins** | 55+ SKILL.md skills + 39 extensions | Trait-based plugins (Provider/Channel/Tool/Memory traits) |
| **Hardware** | iOS/Android nodes, browser, camera | Raspberry Pi GPIO, USB, STM32/Nucleo, RISC-V peripherals |
| **Voice** | Wake + talk mode (macOS/iOS) | — |
| **Browser control** | Playwright | Fantoccini (optional feature) |
| **Sandbox** | Docker, macOS TCC | Landlock, Bubblewrap, Docker |
| **Companion apps** | macOS, iOS, Android | — (terminal/daemon-first) |

---

## Quick Start (ZeroClaw)

```bash
# macOS
brew install zeroclaw

# Linux / one-click (reviews this before running in production)
./zeroclaw/bootstrap.sh

# Or build from source (requires Rust 1.87+)
cd zeroclaw
cargo build --release --locked
cargo install --path . --force --locked

# Onboard with an API key
zeroclaw onboard --api-key sk-... --provider openrouter

# Or guided interactive wizard
zeroclaw onboard --interactive

# Chat
zeroclaw agent -m "Hello!"

# Start gateway (webhook server, default port 3000)
zeroclaw gateway

# Run as always-on daemon
zeroclaw daemon

# Health check
zeroclaw status
zeroclaw doctor
zeroclaw channel doctor
```

---

## Configuration (`~/.zeroclaw/config.toml`)

```toml
# Minimal config
default_provider = "anthropic"
default_model    = "anthropic/claude-sonnet-4-6"

[agent]
max_tool_iterations  = 10
max_history_messages = 50

[channels_config]
cli = true

[channels_config.telegram]
bot_token    = "YOUR_BOT_TOKEN"
allowed_users = [123456789]

[channels_config.discord]
bot_token = "YOUR_DISCORD_BOT_TOKEN"
guild_ids  = [123456789]

[channels_config.matrix]
homeserver_url = "https://matrix.org"
user_id        = "@bot:matrix.org"
access_token   = "YOUR_TOKEN"
room_id        = "!roomid:matrix.org"
allowed_users  = ["@user:matrix.org"]
```

### Supported providers

```toml
# OpenRouter (routes to any model)
default_provider = "openrouter"
default_model    = "openrouter/auto"

# Direct Anthropic
default_provider = "anthropic"
default_model    = "claude-sonnet-4-6"

# Local Ollama (zero API cost)
default_provider = "ollama"
default_model    = "llama3.2"

# DeepSeek (cheap, fast)
default_provider = "deepseek"
default_model    = "deepseek-chat"
```

### Observability

```toml
[observability]
backend           = "otel"
otel_endpoint     = "http://localhost:4318"
otel_service_name = "zeroclaw-edge"
```

---

## In-chat commands (Telegram / Discord)

| Command | Effect |
|---------|--------|
| `/models` | List available providers and current selection |
| `/models <provider>` | Switch provider for this session |
| `/model` | Show current model |
| `/model <model-id>` | Switch model for this session |

---

## Full config reference

```toml
api_key          = "sk-..."
default_provider = "openrouter"
default_model    = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

[agent]
max_tool_iterations  = 10
max_history_messages = 50
compact_context      = false   # set true for small (13B) models

[memory]
backend            = "sqlite"  # "sqlite" | "postgres" | "markdown" | "none"
auto_save          = true
embedding_provider = "none"    # "none" | "openai" | "custom:https://..."
vector_weight      = 0.7
keyword_weight     = 0.3

[gateway]
port           = 3000
host           = "127.0.0.1"
require_pairing = true

[autonomy]
level           = "supervised"  # "readonly" | "supervised" | "full"
workspace_only  = true
allowed_commands = ["git", "npm", "cargo"]
forbidden_paths  = ["/etc", "~/.ssh", "~/.aws"]

[runtime]
kind = "native"   # "native" | "docker"

[tunnel]
provider = "none"  # "none" | "cloudflare" | "tailscale" | "ngrok"

[skills]
open_skills_enabled = false   # community skill registry
prompt_injection_mode = "full" # "compact" for low-context models

[heartbeat]
enabled           = false
interval_minutes  = 30

[observability]
backend           = "none"  # "none" | "log" | "prometheus" | "otel"
otel_endpoint     = "http://localhost:4318"
otel_service_name = "zeroclaw"
```

---

## Skills in ZeroClaw

ZeroClaw has its **own SKILL.md system** compatible with awesome-copilot's format.
Skills live in `~/.zeroclaw/workspace/skills/<name>/`:

```toml
# SKILL.toml manifest
[skill]
name        = "web-scraper"
description = "Extract data from web pages"
version     = "0.1.0"
tags        = ["web", "automation"]

[[tools]]
name        = "scrape_page"
description = "Scrape HTML from URL"
kind        = "http"   # "shell" | "script" | "http"
```

Skills can also carry a `SKILL.md` instructions file (same format as OpenClaw and
awesome-copilot). This means the 8 skills ported in
[awesome-copilot-integration.md](awesome-copilot-integration.md) and the
`scripts/port-skill.sh` adapter can target ZeroClaw too.

### Manage skills

```bash
zeroclaw skills list
zeroclaw skills install <name>
zeroclaw skills remove <name>
```

---

## Architecture

ZeroClaw uses **trait-driven, swappable** modules — everything is a replaceable
implementation of a core trait:

| Trait | Extension point |
|-------|----------------|
| `Provider` | AI model backends |
| `Channel` | Messaging platforms |
| `Tool` | Agent capabilities |
| `Memory` | Conversation storage (SQLite / Postgres) |
| `Observer` | Observability (Prometheus / OpenTelemetry) |
| `RuntimeAdapter` | Sandbox strategies (Docker / Landlock / Bubblewrap) |
| `Peripheral` | Hardware boards (RPi GPIO, STM32, USB) |

---

## Deployment Patterns with OpenClaw

### 1. Tiered deployment (recommended for home setups)

```
Mac / Linux server               Raspberry Pi / edge node
────────────────────             ────────────────────────
OpenClaw (full stack)            ZeroClaw (lean daemon)
  - WhatsApp                       - Telegram (low-resource)
  - iMessage                       - Local Ollama model
  - Voice wake                     - GPIO / hardware triggers
  - 55+ skills                     - <5MB RAM
  - Browser control
  - Canvas / macOS apps
```

The two can share the same Telegram/Discord bot tokens by running on
separate channels/ports, or route through different bots to the same human.

### 2. Provider-agnostic fallback

Both OpenClaw and ZeroClaw support OpenRouter as the provider, meaning you
can switch the underlying model (Claude → Llama → DeepSeek) without changing
the assistant config on either side.

### 3. Edge hardware + OpenClaw gateway

ZeroClaw's `robot-kit` crate (`./zeroclaw/crates/robot-kit/`) provides
hardware peripheral access (RPi GPIO, STM32, USB cameras) that maps directly
to what OpenClaw exposes through its `nodes.*` tool namespace.

Use ZeroClaw on-device for hardware control, pipe results back to OpenClaw's
gateway via webhook for higher-level reasoning and channel routing.

### 4. Memory migration (OpenClaw → ZeroClaw and back)

ZeroClaw ships a built-in migration command:

```bash
# Import OpenClaw conversation memory into ZeroClaw
zeroclaw migrate openclaw --source ~/.openclaw/workspace

# Both use SQLite by default; can also share a PostgreSQL backend
# config.toml: memory.backend = "postgres"
# openclaw.json: memory.backend = "postgres"
```

### 5. awesome-copilot skills on ZeroClaw

ZeroClaw has its own SKILL.md-compatible system. Use the same adapter script:

```bash
# Port from awesome-copilot → ZeroClaw workspace
cp -r openclaws/skills/meeting-minutes ~/.zeroclaw/workspace/skills/
cp -r openclaws/skills/prd ~/.zeroclaw/workspace/skills/
# etc.
```

Or inject agent content directly as a ZeroClaw system prompt override:

```toml
[agent]
system_prompt = """
<paste awesome-copilot agent/prompt content here>
"""
```

### 6. Run ZeroClaw as a system service

```bash
# Install as systemd / OpenRC service
zeroclaw service install

# Then manage with standard service tools
systemctl --user start zeroclaw
systemctl --user enable zeroclaw
systemctl --user status zeroclaw
```

### 7. Expose via tunnel (no port forwarding)

```toml
[tunnel]
provider = "cloudflare"   # or "tailscale" | "ngrok"
```

Then ZeroClaw's webhook gateway is reachable externally without opening router ports.

---

## Build features

ZeroClaw uses Cargo feature flags for optional components:

```bash
# Default lean build (no optional channels)
cargo build --release

# With WhatsApp Web support
cargo build --release --features whatsapp-web

# With Matrix E2EE
cargo build --release --features channel-matrix

# With Raspberry Pi GPIO
cargo build --release --features peripheral-rpi

# With native browser automation (fantoccini/WebDriver)
cargo build --release --features browser-native

# With OpenTelemetry
cargo build --release --features observability-otel

# With Lark (Feishu)
cargo build --release --features channel-lark

# Full hardware kit
cargo build --release --features hardware

# Multiple features
cargo build --release --features "channel-matrix,whatsapp-web,observability-otel"
```

---

## When to choose ZeroClaw over OpenClaw

| Scenario | Choose |
|----------|--------|
| Mac / high-end Linux with voice wake, iMessage, browser control | **OpenClaw** |
| Raspberry Pi, Orange Pi, rock board, $10 SBC | **ZeroClaw** |
| Running 20+ messaging channels with full plugin ecosystem | **OpenClaw** |
| Edge IoT device with GPIO / STM32 hardware peripherals | **ZeroClaw** |
| Rich skill library (55+ SKILL.md skills, ClawHub) | **OpenClaw** |
| Low RAM constraint (< 50 MB total system) | **ZeroClaw** |
| Local-only Ollama model, zero API cost | **ZeroClaw** (or either) |
| Companion macOS/iOS/Android app | **OpenClaw** |
| Multiple deployments, both are complementary | **Both** |

---

## Resources

- ZeroClaw repo: `./zeroclaw/`
- ZeroClaw config reference: `./zeroclaw/docs/config-reference.md`
- ZeroClaw channels reference: `./zeroclaw/docs/channels-reference.md`
- ZeroClaw providers reference: `./zeroclaw/docs/providers-reference.md`
- ZeroClaw hardware docs: `./zeroclaw/docs/hardware/`
- OpenClaw repo: `./openclaws/`
- awesome-copilot integration: `./docs/awesome-copilot-integration.md`
