#!/usr/bin/env bash
# Installs or updates Hai Pantai on the VPS. Run from the unpacked release:
#   tar xzf pantai.tgz && sudo bash pantai/deploy/setup.sh
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Run with sudo."; exit 1; }
SRC="$(cd "$(dirname "$0")/.." && pwd)"
APP=/opt/pantai; DATA=/var/lib/pantai; ENVF=/etc/pantai/pantai.env

# Node 20 or newer
major=0; command -v node >/dev/null && major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$major" -lt 20 ]; then
  echo "Installing Node 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

id pantai >/dev/null 2>&1 || useradd --system --home "$APP" --shell /usr/sbin/nologin pantai
mkdir -p "$APP" "$DATA" /etc/pantai
rm -rf "$APP/web" "$APP/assets"
cp "$SRC/server.mjs" "$SRC/seed.mjs" "$APP/"
cp -r "$SRC/web" "$SRC/assets" "$APP/"
chown -R pantai:pantai "$DATA"

# Claude key: keep the existing one, else reuse Kering's, else ask
if [ ! -f "$ENVF" ]; then
  KEY=""
  [ -f /etc/kering-relay/relay.env ] && KEY="$(grep -E '^ANTHROPIC_API_KEY=' /etc/kering-relay/relay.env | head -1 | cut -d= -f2- || true)"
  if [ -z "$KEY" ]; then read -r -s -p "Anthropic API key (Enter to skip; AI photo checks stay off): " KEY; echo; fi
  umask 077
  cat > "$ENVF" <<EOF
ANTHROPIC_API_KEY=$KEY
MODEL=claude-sonnet-5-5
PORT=8791
DATA_DIR=$DATA
WEB_DIR=$APP/web
ASSETS_DIR=$APP/assets
EOF
  chown root:pantai "$ENVF"; chmod 640 "$ENVF"
fi

# Demo data, first install only
if [ ! -f "$DATA/db.json" ]; then
  sudo -u pantai env DATA_DIR="$DATA" ASSETS_DIR="$APP/assets" node "$APP/seed.mjs" --reset
fi

cp "$SRC/deploy/pantai.service" /etc/systemd/system/pantai.service
systemctl daemon-reload
systemctl enable pantai >/dev/null 2>&1
systemctl restart pantai

if [ -d /etc/nginx/snippets ]; then cp "$SRC/deploy/nginx-pantai.conf" /etc/nginx/snippets/pantai.conf; fi

sleep 1
if curl -fsS http://127.0.0.1:8791/api/state >/dev/null; then echo "Pantai is running on 127.0.0.1:8791."; else echo "Pantai did not answer. Check: journalctl -u pantai -n 50"; exit 1; fi

if ! grep -rqs "snippets/pantai.conf" /etc/nginx/sites-enabled /etc/nginx/conf.d /etc/nginx/nginx.conf 2>/dev/null; then
  cat <<'EOF'

One step left: add this line inside the nginx server block (next to the /bali/ config),
    include snippets/pantai.conf;
then run:  sudo nginx -t && sudo systemctl reload nginx
EOF
else
  nginx -t && systemctl reload nginx && echo "nginx reloaded. Open http://<server>/pantai/"
fi
echo "To reset the demo data later: sudo systemctl stop pantai && sudo -u pantai env DATA_DIR=$DATA ASSETS_DIR=$APP/assets node $APP/seed.mjs --reset && sudo systemctl start pantai"
