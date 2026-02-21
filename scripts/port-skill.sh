#!/usr/bin/env bash
# port-skill.sh — Adapt an awesome-copilot SKILL.md for OpenClaw
#
# Usage:
#   ./scripts/port-skill.sh <skill-name> [emoji] [required-bin]
#
# Example:
#   ./scripts/port-skill.sh meeting-minutes 📝
#   ./scripts/port-skill.sh plantuml-ascii 📊 plantuml
#
# What it does:
#   1. Reads awesome-copilot/skills/<skill>/SKILL.md
#   2. Injects an OpenClaw metadata block into the YAML frontmatter
#   3. Writes the result to openclaws/skills/<skill>/SKILL.md
#   4. Copies any non-SKILL.md assets from the source skill directory

set -euo pipefail

SKILL="${1:-}"
EMOJI="${2:-🔧}"
BIN="${3:-}"

if [[ -z "$SKILL" ]]; then
  echo "Usage: $0 <skill-name> [emoji] [required-bin]" >&2
  exit 1
fi

SRC="$(dirname "$0")/../awesome-copilot/skills/$SKILL"
DST="$(dirname "$0")/../openclaws/skills/$SKILL"

if [[ ! -d "$SRC" ]]; then
  echo "ERROR: Source skill not found: $SRC" >&2
  exit 1
fi

if [[ ! -f "$SRC/SKILL.md" ]]; then
  echo "ERROR: No SKILL.md in $SRC" >&2
  exit 1
fi

mkdir -p "$DST"

# Build the metadata block
if [[ -n "$BIN" ]]; then
  META=$(cat <<EOF
metadata:
  {
    "openclaw":
      {
        "emoji": "$EMOJI",
        "requires": { "bins": ["$BIN"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "$BIN",
              "bins": ["$BIN"],
              "label": "Install $BIN (brew)",
            },
            {
              "id": "apt",
              "kind": "apt",
              "package": "$BIN",
              "bins": ["$BIN"],
              "label": "Install $BIN (apt)",
            },
          ],
      },
  }
EOF
)
else
  META=$(cat <<EOF
metadata:
  {
    "openclaw": { "emoji": "$EMOJI" },
  }
EOF
)
fi

# Read source SKILL.md, inject metadata after the last frontmatter field before ---
SKILL_SRC="$SRC/SKILL.md"
SKILL_DST="$DST/SKILL.md"

# Strategy: find the closing --- of frontmatter and insert metadata before it
python3 - "$SKILL_SRC" "$SKILL_DST" "$META" <<'PYEOF'
import sys

src_path, dst_path, meta = sys.argv[1], sys.argv[2], sys.argv[3]

with open(src_path) as f:
    content = f.read()

lines = content.split('\n')

# Find frontmatter: starts at line 0 with ---, ends at next ---
if lines[0].strip() != '---':
    # No frontmatter — prepend a minimal one with metadata injected
    out = f"---\n{meta}\n---\n\n" + content
else:
    # Find closing ---
    end = None
    for i, line in enumerate(lines[1:], 1):
        if line.strip() == '---':
            end = i
            break
    if end is None:
        # Malformed — just prepend
        out = content
    else:
        # Check if metadata block already exists
        fm_block = '\n'.join(lines[1:end])
        if 'openclaw' in fm_block:
            # Already has openclaw metadata, skip injection
            out = content
        else:
            # Remove any existing 'license:' or 'allowed-tools:' lines from frontmatter
            # (these are Copilot-specific fields not used by OpenClaw)
            filtered_fm = []
            for line in lines[1:end]:
                if line.startswith('license:') or line.startswith('allowed-tools:'):
                    continue
                filtered_fm.append(line)
            new_fm = '\n'.join(filtered_fm)
            # Strip trailing blank lines in frontmatter
            new_fm = new_fm.rstrip()
            body = '\n'.join(lines[end+1:])
            out = f"---\n{new_fm}\n{meta}\n---\n{body}"

with open(dst_path, 'w') as f:
    f.write(out)

print(f"Written: {dst_path}")
PYEOF

# Copy any bundled assets (scripts, templates, data) that aren't SKILL.md
find "$SRC" -maxdepth 1 -type f ! -name 'SKILL.md' | while read -r asset; do
  filename="$(basename "$asset")"
  cp "$asset" "$DST/$filename"
  echo "Copied asset: $filename"
done

echo "✅ Ported skill '$SKILL' → $DST"
