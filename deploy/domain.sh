#!/usr/bin/env bash
# Serves Hai Pantai at https://haipantai.online (and www.) on the VPS.
# Run once, after the domain's A records point at this server:
#   sudo bash pantai/deploy/domain.sh [domain] [email-for-letsencrypt]
# The old http://<ip>/pantai/ address keeps working.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Run with sudo."; exit 1; }
DOMAIN="${1:-haipantai.online}"
EMAIL="${2:-}"
SRC="$(cd "$(dirname "$0")" && pwd)"

command -v nginx >/dev/null || { echo "nginx is not installed."; exit 1; }
curl -fsS http://127.0.0.1:8791/api/state >/dev/null || { echo "Pantai is not running. Run setup.sh first."; exit 1; }

# DNS must already point here, or Let's Encrypt cannot issue the certificate
MYIP="$(curl -fsS -4 https://api.ipify.org || true)"
for h in "$DOMAIN" "www.$DOMAIN"; do
  got="$(getent ahostsv4 "$h" | awk 'NR==1{print $1}' || true)"
  if [ -z "$got" ]; then echo "$h does not resolve yet. Add an A record for it pointing at ${MYIP:-this server}, wait a few minutes, then run this again."; exit 1; fi
  if [ -n "$MYIP" ] && [ "$got" != "$MYIP" ]; then echo "$h points at $got, but this server is $MYIP. Fix the A record, then run this again."; exit 1; fi
done

SITE=/etc/nginx/sites-available/$DOMAIN
sed "s/__DOMAIN__/$DOMAIN/g" "$SRC/nginx-haipantai.conf" > "$SITE"
ln -sf "$SITE" /etc/nginx/sites-enabled/$DOMAIN
nginx -t && systemctl reload nginx
echo "http://$DOMAIN is live. Getting the HTTPS certificate..."

if ! command -v certbot >/dev/null; then apt-get update -qq && apt-get install -y certbot python3-certbot-nginx; fi
if [ -n "$EMAIL" ]; then MAIL=(-m "$EMAIL"); else MAIL=(--register-unsafely-without-email); fi
certbot --nginx --non-interactive --agree-tos "${MAIL[@]}" --redirect -d "$DOMAIN" -d "www.$DOMAIN"

curl -fsS "https://$DOMAIN/api/state" >/dev/null && echo "Done: https://$DOMAIN/ (certificate renews on its own)."
