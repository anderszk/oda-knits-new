#!/usr/bin/env bash
set -euo pipefail

SERVER="${SERVER:-root@206.189.239.37}"
APP_DIR="${APP_DIR:-/opt/oda-knits}"

rsync -az --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  --exclude .env \
  --exclude '*.db' \
  --exclude '__pycache__' \
  --exclude '.venv' \
  --exclude '.DS_Store' \
  --exclude 'odaknits-ssh*' \
  ./ "$SERVER:$APP_DIR/"

ssh "$SERVER" "cd '$APP_DIR' && \
  docker compose -f docker-compose.prod.yml up -d --build && \
  docker compose -f docker-compose.prod.yml run --rm --no-deps --user root --entrypoint chown backend -R 1000:1000 /data && \
  docker compose -f docker-compose.prod.yml restart backend caddy && \
  docker compose -f docker-compose.prod.yml ps"
