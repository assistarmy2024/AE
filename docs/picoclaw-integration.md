# PicoClaw Integration — Go Ultra-Lite Runtime

[PicoClaw](https://github.com/sipeed/picoclaw) is a **Go-native, single-binary** AI assistant
from [Sipeed](https://sipeed.com) — the hardware company behind LicheeRV-Nano and RISC-V boards.

Repository included as git submodule at `./picoclaw/`.

---

## Position in the stack

| | OpenClaw | ZeroClaw | **PicoClaw** |
|-|----------|----------|--------------|
| **Language** | TypeScript | Rust | **Go** |
| **RAM** | >1 GB | <5 MB | **<10 MB** |
| **Startup** (0.6GHz) | >500 s | <10 ms | **<1 s** |
| **Cost** | Mac Mini $599 | $10 board | **$10 board** |
| **Config** | JSON | TOML | **JSON** |
| **Gateway port** | 18789 | 3000 | **18790** |
| **Channels** | 15+ | 14+ | **12** |
| **Hardware tools** | — | GPIO/STM32/USB | **I2C / SPI** |
| **Skill registry** | ClawhHub | open-skills | **ClawhHub** (same!) |

---

## Quick start

```bash
# Build from source (requires Go 1.21+)
cd picoclaw
make deps
make build
make install          # → ~/.local/bin/picoclaw

# Or download prebuilt binary (Linux arm64)
curl -fsSLO https://github.com/sipeed/picoclaw/releases/latest/download/picoclaw-linux-arm64
chmod +x picoclaw-linux-arm64 && mv picoclaw-linux-arm64 ~/.local/bin/picoclaw

# Supported targets: x86_64, arm64, riscv64, loong64, macOS arm64, Windows x86_64, Android (Termux)
```

```bash
# Onboarding
picoclaw onboard                          # Interactive wizard
# or: cp picoclaw/config/config.example.json ~/.picoclaw/config.json

# Chat
picoclaw agent -m "Hello!"               # One-shot
picoclaw agent                            # Interactive REPL

# Gateway (all channels, port 18790)
picoclaw gateway

# Status
picoclaw status
```

---

## Configuration (`~/.picoclaw/config.json`)

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.picoclaw/workspace",
      "model": "claude",
      "max_tokens": 8192,
      "temperature": 0.7,
      "max_tool_iterations": 20,
      "restrict_to_workspace": true
    }
  },
  "model_list": [
    {
      "model_name": "claude",
      "model": "anthropic/claude-sonnet-4-6",
      "api_key": "sk-ant-..."
    },
    {
      "model_name": "deepseek",
      "model": "deepseek/deepseek-chat",
      "api_key": "sk-..."
    },
    {
      "model_name": "local",
      "model": "ollama/llama3.2",
      "api_base": "http://localhost:11434/v1"
    }
  ],
  "channels": {
    "telegram": {
      "bot_token": "YOUR_BOT_TOKEN",
      "allowed_users": ["@yourhandle"]
    },
    "discord": {
      "bot_token": "YOUR_BOT_TOKEN",
      "allowed_users": ["123456789"]
    }
  },
  "tools": {
    "web": { "brave": { "api_key": "..." } },
    "skills": { "registries": { "clawhub": { "enabled": true } } }
  },
  "heartbeat": { "enabled": false, "interval": 30 },
  "gateway": { "host": "127.0.0.1", "port": 18790 }
}
```

### Supported channels (12)

| Channel | Notes |
|---------|-------|
| Telegram | Just a bot token |
| Discord | Bot token + intents |
| QQ | AppID + AppSecret |
| DingTalk | App credentials |
| LINE | Webhook (port 18791) |
| WeCom Bot | Webhook (port 18793) |
| WeCom App | App + webhook (port 18792) |
| Slack | Bot token + app token |
| WhatsApp | Bridge URL |
| OneBot | WebSocket (QQ/WeChat unified) |
| Feishu (Lark) | App credentials |
| MaixCAM | Local HTTP (port 18790) |

### Supported providers (20+)

PicoClaw uses a vendor-agnostic `model_list` with `vendor/model` format:

```json
"model": "anthropic/claude-sonnet-4-6"
"model": "openai/gpt-4o"
"model": "deepseek/deepseek-chat"
"model": "groq/llama-3.3-70b-versatile"
"model": "ollama/llama3.2"        // local
"model": "zhipu/glm-4-flash"
"model": "qwen/qwen-turbo"
```

---

## Hardware tools (Sipeed-specific)

PicoClaw's standout feature: **native I2C and SPI** tool support for Sipeed hardware:

```json
"tools": {
  "i2c": { "device": "/dev/i2c-1" },
  "spi": { "device": "/dev/spidev0.0" }
}
```

This lets the AI agent directly read sensors, control displays, and interface with
peripherals — no extra bridge software needed. Pairs perfectly with:
- LicheeRV-Nano (RISC-V)
- MaixCAM (camera AI board)
- Raspberry Pi Compute Module
- Any Linux SBC with I2C/SPI

---

## Skill registry (ClawhHub — same as OpenClaw!)

PicoClaw uses the **same ClawhHub skill registry** as OpenClaw. Skills installed in
OpenClaw can be referenced in PicoClaw config:

```json
"tools": {
  "skills": {
    "registries": {
      "clawhub": { "enabled": true, "url": "https://clawhub.ai" }
    }
  }
}
```

This means the 8 skills ported from awesome-copilot into `openclaws/skills/` are also
usable in PicoClaw by copying them to `~/.picoclaw/workspace/skills/`.

---

## Deployment with OpenClaw and ZeroClaw

### Three-tier architecture

```
╔══════════════════════════════════════════════════════════╗
║  Mac / Linux server                                      ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ OpenClaw (port 18789)                               │ ║
║  │  - WhatsApp, iMessage, Signal, Teams                │ ║
║  │  - Voice wake, macOS companion app                  │ ║
║  │  - Browser control, Canvas, 55+ skills              │ ║
║  └─────────────────────────────────────────────────────┘ ║
╠══════════════════════════════════════════════════════════╣
║  AEOS UI (port 5173) ← proxies all three runtimes       ║
╠══════════════════════════════════════════════════════════╣
║  Raspberry Pi / SBC                                      ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ ZeroClaw (port 3000)                                │ ║
║  │  - Telegram, Discord, Matrix (E2EE)                 │ ║
║  │  - <5MB RAM, GPIO/STM32/USB hardware               │ ║
║  └─────────────────────────────────────────────────────┘ ║
╠══════════════════════════════════════════════════════════╣
║  Sipeed board / MaixCAM / RISC-V device                  ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ PicoClaw (port 18790)                               │ ║
║  │  - QQ, DingTalk, LINE, WeCom, Feishu               │ ║
║  │  - <10MB RAM, I2C/SPI sensors, MaixCAM vision      │ ║
║  └─────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════╝
```

### AEOS connects to all three

The AEOS UI proxies all three gateway ports:

```
AEOS (5173) → /api/openclaw → OpenClaw (18789)
             → /api/zeroclaw → ZeroClaw (3000)
             → /api/picoclaw → PicoClaw (18790)
```

The runtime switcher in the top bar selects which backend receives messages.

### Docker (run all together)

```yaml
# docker-compose.yml addition
services:
  picoclaw:
    build: ./picoclaw
    ports:
      - "18790:18790"
    volumes:
      - ~/.picoclaw:/root/.picoclaw
    command: gateway
```

---

## When to choose PicoClaw

| Scenario | Choose |
|----------|--------|
| Sipeed / MaixCAM hardware with I2C/SPI sensors | **PicoClaw** |
| QQ, DingTalk, WeCom, LINE, Feishu channels | **PicoClaw** |
| RISC-V or Loongarch Linux board | **PicoClaw** |
| Prefer Go toolchain over Rust | **PicoClaw** |
| Need ClawhHub skills on edge device | **PicoClaw** |
| Absolute minimum RAM (<5MB) | ZeroClaw |
| Mac/server with full feature set | OpenClaw |

---

## Build targets

```bash
make build-all       # all platforms in one command

# Individual:
GOOS=linux GOARCH=amd64   go build  # Linux x86_64
GOOS=linux GOARCH=arm64   go build  # Linux ARM64 (RPi, Sipeed)
GOOS=linux GOARCH=riscv64 go build  # RISC-V
GOOS=linux GOARCH=loong64 go build  # Loongarch
GOOS=darwin GOARCH=arm64  go build  # macOS M1/M2
GOOS=windows GOARCH=amd64 go build  # Windows x86_64
```

---

## Resources

- PicoClaw repo: `./picoclaw/`
- PicoClaw config example: `./picoclaw/config/config.example.json`
- PicoClaw docs: `./picoclaw/docs/`
- OpenClaw integration: `./docs/awesome-copilot-integration.md`
- ZeroClaw integration: `./docs/zeroclaw-integration.md`
- AEOS UI: `./aeos/` (proxies all three runtimes)
