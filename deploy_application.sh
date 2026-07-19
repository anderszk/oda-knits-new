#!/usr/bin/env bash
set -euo pipefail

SERVER="${SERVER:-root@206.189.239.37}"
APP_DIR="${APP_DIR:-/opt/oda-knits}"
SITE_URL="${SITE_URL:-https://odaknits.no}"

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

ssh "$SERVER" bash -s -- "$APP_DIR" <<'REMOTE'
set -euo pipefail
cd "$1"
COMPOSE="docker compose -f docker-compose.prod.yml"
mkdir -p .deploy

# Before building, snapshot whatever is currently running as the rollback target:
# save the exact image tag Compose expects for each service, then pin the current
# image under our own tag so the upcoming build can't cause it to be garbage
# collected. rollback_application.sh reverses this by re-pointing the saved tag
# back at the pinned image, with no rebuild involved.
for svc in backend frontend-build; do
  id="$($COMPOSE images -q "$svc" 2>/dev/null || true)"
  if [ -n "$id" ]; then
    docker inspect --format '{{index .RepoTags 0}}' "$id" > ".deploy/${svc}.tag" 2>/dev/null || rm -f ".deploy/${svc}.tag"
    docker tag "$id" "oda-knits-rollback-${svc}:previous"
  else
    rm -f ".deploy/${svc}.tag"
  fi
done

$COMPOSE up -d --build --remove-orphans
$COMPOSE run --rm --no-deps --user root --entrypoint chown backend -R 1000:1000 /data
$COMPOSE restart backend caddy
$COMPOSE ps
REMOTE

# Smoke test: confirm the deploy actually serves traffic over the real public path
# (DNS, TLS, Caddy routing, backend, DB — not just "containers exist"), the same way
# a customer would hit it. Run from here rather than the droplet so it's a true
# end-to-end check, not just a container-to-container one.
echo "Smoke-testing $SITE_URL/api/health ..."
for attempt in 1 2 3 4 5; do
  if curl -fsS --max-time 5 "$SITE_URL/api/health" >/dev/null; then
    echo "Smoke test passed."
    exit 0
  fi
  echo "Attempt $attempt/5 failed, retrying in 3s..."
  sleep 3
done
echo "Smoke test FAILED: $SITE_URL/api/health did not respond after deploy." >&2
echo "The deploy already happened — run ./rollback_application.sh to revert if needed." >&2
exit 1
