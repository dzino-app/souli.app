#!/usr/bin/env bash
# Wire a freshly-recorded demo.gif into the README, replacing the OG fallback.
# Usage: drop your GIF at app/public/readme/demo.gif, then run this script
# from the repo root.
set -euo pipefail

GIF=app/public/readme/demo.gif
README=README.md

if [ ! -f "$GIF" ]; then
  echo "❌ Expected GIF at $GIF — record it first with Kap or similar."
  exit 1
fi

# Replace the OG fallback img tag with the demo GIF
if grep -q "app/public/og.png" "$README"; then
  python3 - <<'PY'
import re
from pathlib import Path
p = Path("README.md")
s = p.read_text()
s = re.sub(
    r'<img src="app/public/og.png"[^>]*/>',
    '<img src="app/public/readme/demo.gif" alt="Souli demo — 6-second tour" width="800" />',
    s,
)
p.write_text(s)
print("✅ README updated — OG fallback swapped for demo.gif")
PY
else
  echo "ℹ️  README doesn't reference og.png — manual swap may be needed."
fi

echo ""
echo "Now: git add $GIF README.md && git commit -m 'Wire demo.gif into README'"
