#!/usr/bin/env bash
# Builds release/pantai.tgz: the server bundle, the built web app and the deploy kit.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build -w web
npm run build -w server
rm -rf release && mkdir -p release/pantai
cp server/dist/server.mjs server/dist/seed.mjs release/pantai/
cp -r web/dist release/pantai/web
cp -r server/assets release/pantai/assets
cp -r deploy release/pantai/deploy
tar czf release/pantai.tgz -C release pantai
ls -lh release/pantai.tgz
