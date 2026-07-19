#!/usr/bin/env bash
set -euo pipefail

# Reverts to whatever was running immediately before the last deploy_application.sh
# run, using the tag snapshot it took. No rebuild, no rsync — this only re-points
# Docker image tags on the droplet and recreates the affected containers, so it's
# fast and can't be broken by the current state of the local working tree.
#
# Only one previous version is kept (not a full history) — deploy again to move
# forward once the issue is fixed.

SERVER="${SERVER:-root@206.189.239.37}"
APP_DIR="${APP_DIR:-/opt/oda-knits}"

ssh "$SERVER" bash -s -- "$APP_DIR" <<'REMOTE'
set -euo pipefail
cd "$1"
COMPOSE="docker compose -f docker-compose.prod.yml"

for svc in backend frontend-build; do
  if [ ! -s ".deploy/${svc}.tag" ] || ! docker image inspect "oda-knits-rollback-${svc}:previous" >/dev/null 2>&1; then
    echo "No previous deploy recorded for '${svc}' — nothing to roll back to." >&2
    exit 1
  fi
done

for svc in backend frontend-build; do
  tag="$(cat ".deploy/${svc}.tag")"
  docker tag "oda-knits-rollback-${svc}:previous" "$tag"
done

$COMPOSE up -d --no-build --force-recreate backend
$COMPOSE run --rm frontend-build
$COMPOSE run --rm --no-deps --user root --entrypoint chown backend -R 1000:1000 /data
$COMPOSE restart backend caddy
$COMPOSE ps
REMOTE
