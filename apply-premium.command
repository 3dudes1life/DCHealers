#!/bin/bash
set -e
cd "$(dirname "$0")"

# The folder containing this script should be placed inside the DCHealers repo.
if [ ! -f "style.css" ] || [ ! -f "index.html" ]; then
  echo ""
  echo "DC Healers files were not found."
  echo "Place this update's files inside the main DCHealers repository folder,"
  echo "then double-click apply-premium.command again."
  echo ""
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi

cp style.css "style.backup-before-premium.css"

# Remove an earlier copy if this installer is run again.
python3 - <<'PY'
from pathlib import Path
style = Path('style.css')
text = style.read_text(encoding='utf-8')
marker = '/* =========================================================\n   DC HEALERS — PREMIUM UX PASS v12'
pos = text.find(marker)
if pos != -1:
    text = text[:pos].rstrip() + '\n'
style.write_text(text, encoding='utf-8')
PY

printf '\n\n' >> style.css
cat dc-premium-ux.css >> style.css

# Cache-bust every HTML page that loads style.css.
python3 - <<'PY'
from pathlib import Path
import re
for path in Path('.').glob('*.html'):
    text = path.read_text(encoding='utf-8')
    text = re.sub(r'(/style\.css)(?:\?v=\d+)?', r'\1?v=12', text)
    path.write_text(text, encoding='utf-8')
PY

echo ""
echo "✅ DC Healers Premium UX v12 has been installed."
echo "✅ Original CSS saved as style.backup-before-premium.css"
echo "✅ Stylesheet cache version updated to v12"
echo ""
read -n 1 -s -r -p "Press any key to close..."
