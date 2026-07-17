# Oda Knits

A portfolio + small-batch knitwear storefront for an independent knitter. Visitors can browse past projects, shop a small collection of knitwear, and get in touch — while the shop owner manages everything through a simple admin dashboard.

## Features

- **Store** — browse and buy knitwear, with a basket and checkout (desktop gets a dedicated checkout page, mobile uses a basket modal). Checkout takes real payments via Card, Apple Pay, Klarna, and Vipps.
- **Work** — a portfolio gallery of finished and in-progress knitting projects
- **About / Contact** — editable content sections and a contact form
- **Instagram** — a carousel of recent posts pulled from Instagram
- **Admin dashboard** — manage products, projects, and site content without touching code

## Tech stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion for animation, Three.js for the decorative 3D scenes
- **Backend**: FastAPI with SQLite for storage
- **Payments**: Stripe (Card, Apple Pay, Klarna) and Vipps ePayment API — each payment method is only shown once its provider credentials are configured (see Environment variables below)
- **Infrastructure**: Docker and Docker Compose for local dev and deployment, Caddy as the reverse proxy/TLS layer, hosted on a DigitalOcean Droplet (VPS)

## Dev

```sh
docker compose up --build
```

- App: http://localhost:8000
- API is proxied by Vite at http://localhost:8000/api/work
- Hot reload is enabled through Vite, Uvicorn `--reload`, and bind mounts, so changes on the host are picked up immediately by the running containers.

## Environment variables

Create a `.env` at the repo root with what you need (see `backend/config.py` for the full list). Nothing is required just to browse the site locally with placeholder data — admin login, contact-form/order emails, the Instagram carousel, and each payment method (Card/Apple Pay/Klarna via Stripe, Vipps) all activate individually once their own env vars are set, and stay hidden/disabled otherwise. `docker-compose.yml`/`docker-compose.prod.yml` read `.env` automatically via Compose's built-in variable substitution.

## Testing & checks

- Backend tests: `pytest` (see `pyproject.toml`; `testpaths = ["backend"]`)
- Frontend typecheck: `npm run typecheck` (runs both the app and node tsconfigs; also runs automatically before `npm run build`)
- No frontend test suite exists yet.

## Production deploy

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

This build runs Caddy on ports 80/443 for TLS termination. The frontend is compiled once by a `frontend-build` container into a static bundle (a shared volume), which Caddy serves directly — it isn't a running server. API requests under `/api/*` are reverse-proxied to the FastAPI backend; everything else falls back to the frontend's `index.html` for client-side routing. The app is deployed to a DigitalOcean Droplet — `deploy_application.sh` syncs the repo to the server and re-runs the production Compose stack over SSH.

- App: `https://yourdomain.no`
- API: `https://yourdomain.no/api/work`

**Going live with real payments**: switching `STRIPE_SECRET_KEY`/`VITE_STRIPE_PUBLISHABLE_KEY` to `sk_live_`/`pk_live_` keys and `VIPPS_BASE_URL` to `https://api.vipps.no` with production Vipps credentials means real customer money moves — see `docs/codebase-audit.md` (if present locally) for known gaps worth addressing first, particularly around server-side payment verification.
