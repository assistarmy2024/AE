# Awesome Copilot ↔ OpenClaw Integration

This document describes how the [awesome-copilot](https://github.com/assistarmy2024/awesome-copilot)
library is integrated with [OpenClaw](https://github.com/assistarmy2024/openclaws).

Both repositories are included as git submodules in this AE repo.

---

## What was integrated

### Phase 1 — Skill porting (done)

8 high-value skills from awesome-copilot were adapted and added to `openclaws/skills/`:

| Skill | Emoji | Description |
|-------|-------|-------------|
| `meeting-minutes` | 📝 | Generate structured meeting minutes with action items and decisions |
| `prd` | 📋 | Create Product Requirements Documents from vague ideas |
| `refactor` | 🔨 | Surgical code refactoring without changing behavior |
| `webapp-testing` | 🧪 | Web app test automation and quality assurance |
| `plantuml-ascii` | 📊 | ASCII art diagrams via PlantUML (requires `plantuml` bin) |
| `web-design-reviewer` | 🎨 | Review and critique web designs for UX/UI quality |
| `markdown-to-html` | 📄 | Convert Markdown documents to styled HTML |
| `mcp-cli` | 🔌 | Interact with MCP servers directly via CLI |

The adapter script at `scripts/port-skill.sh` handles the conversion automatically.

### Phase 2 — MCP Bridge (instructions below)

awesome-copilot ships an official MCP server that exposes its full library
(168 agents + 142 prompts + 52 skills) as callable tools.

OpenClaw's `mcporter` skill can connect to it, making the entire library
available from within any messaging channel (WhatsApp, Telegram, Slack, etc.).

---

## Porting more skills

Use the adapter script to port any skill from awesome-copilot:

```bash
# Port a skill with no binary requirement
./scripts/port-skill.sh <skill-name> <emoji>

# Port a skill that requires a system binary
./scripts/port-skill.sh <skill-name> <emoji> <binary-name>

# Examples
./scripts/port-skill.sh meeting-minutes 📝
./scripts/port-skill.sh plantuml-ascii 📊 plantuml
./scripts/port-skill.sh pdftk-server 📑 pdftk
```

The script:
1. Reads `awesome-copilot/skills/<skill>/SKILL.md`
2. Strips Copilot-specific fields (`license:`, `allowed-tools:`)
3. Injects the OpenClaw `metadata` block (emoji, requires, install)
4. Copies any bundled assets (scripts, templates)
5. Writes to `openclaws/skills/<skill>/SKILL.md`

---

## MCP Bridge setup (Phase 2)

Connect OpenClaw to the awesome-copilot MCP server to access its full library
of 168 agents, 142 prompts, and 52 skills from any messaging channel.

### Prerequisites

- Docker installed and running
- OpenClaw gateway running (`openclaw gateway`)
- `mcporter` installed (`npm install -g mcporter`)

### Configure the MCP server

Add to `~/.openclaw/openclaw.json`:

```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-6"
  },
  "mcporter": {
    "servers": {
      "awesome-copilot": {
        "type": "stdio",
        "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "ghcr.io/microsoft/mcp-dotnet-samples/awesome-copilot:latest"
        ]
      }
    }
  }
}
```

Or add via CLI:

```bash
mcporter config add awesome-copilot \
  --type stdio \
  --command docker \
  --args 'run,-i,--rm,ghcr.io/microsoft/mcp-dotnet-samples/awesome-copilot:latest'
```

### Verify connection

```bash
# List available tools from the MCP server
mcporter list awesome-copilot

# Search for a prompt
mcporter call awesome-copilot.search query="code review"

# Install a prompt into your workspace
mcporter call awesome-copilot.install name="conventional-commit"
```

### Use from messaging channels

Once configured, you can invoke awesome-copilot tools directly from WhatsApp,
Telegram, Slack, etc. through your OpenClaw agent:

```
"Use the awesome-copilot PRD skill to write requirements for a user auth system"
"Find me a code review prompt from awesome-copilot"
"Run the conventional-commit agent on my staged changes"
```

---

## Content map

| awesome-copilot | OpenClaw equivalent | Integration method |
|-----------------|---------------------|--------------------|
| Skills (52) | `openclaws/skills/` | Direct port via `scripts/port-skill.sh` |
| Agents (168) | Agent mode via skills | Wrap as OpenClaw skill that sets system persona |
| Prompts (142) | Skill commands | Available via MCP bridge or manually |
| Instructions (170) | Workspace context | Place in `~/.openclaw/workspace/skills/` |
| Hooks (3) | OpenClaw cron/webhooks | Map session hooks to OpenClaw lifecycle |
| Plugins (45) | Extension bundles | Group ported skills as OpenClaw plugin |
| MCP server | mcporter bridge | Configure in `openclaw.json` (Phase 2) |

---

## Skills not ported (overlap with existing OpenClaw skills)

| awesome-copilot skill | OpenClaw equivalent |
|-----------------------|---------------------|
| `gh-cli` | `skills/github` |
| `github-issues` | `skills/gh-issues` |
| `git-commit` | `skills/coding-agent` |
| `nano-banana-pro-openrouter` | `skills/nano-banana-pro` |

---

## Resources

- awesome-copilot repo: `./awesome-copilot/`
- OpenClaw repo: `./openclaws/`
- Adapter script: `./scripts/port-skill.sh`
- awesome-copilot MCP server: `ghcr.io/microsoft/mcp-dotnet-samples/awesome-copilot:latest`
- OpenClaw mcporter skill: `openclaws/skills/mcporter/SKILL.md`
