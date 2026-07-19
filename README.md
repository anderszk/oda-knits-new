# Oda Knits

[![Test](https://github.com/anderszk/oda-knits-new/actions/workflows/test.yml/badge.svg)](https://github.com/anderszk/oda-knits-new/actions/workflows/test.yml)

A full-stack e-commerce site, live at **[odaknits.no](https://odaknits.no)**,
built solo end-to-end - architecture, backend, frontend, payments integration,
CI/CD, and production infra. It's a real storefront for an independent knitter
(product catalog, portfolio gallery, admin dashboard, live payments), and just
as much a write-up of the engineering decisions behind it.

This README documents it from that angle: what's in the stack, how the pieces
fit together, and the tradeoffs made along the way.

## Engineering highlights

- **Real payment processing, not a demo integration.** Four live methods -
  Card, Apple Pay, and Klarna via Stripe, plus Vipps (Norway's dominant mobile
  payment method) via its ePayment API. `POST /api/orders` independently
  re-verifies each payment's status *and* charged amount against the
  provider before an order is ever created - the client's post-payment
  callback is never trusted on its own.
- **Server is the only source of truth for money.** Prices/subtotals are
  always recomputed from repository data server-side; the client only ever
  sends item ids and quantities.
- **No BFF, by design.** The React frontend calls FastAPI directly over
  relative `/api/*` paths - Vite's dev proxy and Caddy's prod routing both
  do the same path-based forwarding, so there's no Node process sitting
  between browser and API in either environment.
- **Fully static production frontend.** A one-shot build container writes
  the Vite output to a shared volume; Caddy serves it directly. No Node
  runtime in production at all.
- **CI/CD via GitHub Actions**: every PR runs backend tests (`pytest`) and a
  full frontend typecheck + build; merges to `main` are blocked until both
  pass (branch protection), and a merge to `main` triggers an automatic
  deploy - SSH + `rsync` to a DigitalOcean droplet, rebuild via Docker
  Compose.
- **Defense-in-depth on public endpoints**: sliding-window rate limiting on
  auth/payment/contact routes, honeypot spam fields on public forms, strict
  regex validation of any client-supplied external id (Stripe/Vipps
  references) before it's used in a lookup.
- **Strict TypeScript across the frontend** (`noUnusedLocals`/
  `noUnusedParameters` on), layered backend (`routes → services →
  repositories → database`) on the Python side.

## Tech stack

| Layer | Choices |
|---|---|
| Frontend | React 19, TypeScript (strict), Vite 6, Tailwind CSS 4, Framer Motion, Three.js (WebGL decorative scenes) |
| Backend | FastAPI, Pydantic, PostgreSQL (`psycopg` 3, pooled via `psycopg_pool`) |
| Payments | Stripe (Card, Apple Pay, Klarna via Stripe Elements + Payment Request Button), Vipps ePayment API |
| Infra | Docker Compose (dev + prod), Caddy (TLS termination, reverse proxy, static file serving, CSP/security headers, access logging), DigitalOcean droplet |
| CI/CD | GitHub Actions - test gate on PRs, auto-deploy on merge to `main` |
| Testing | `pytest` against a real Postgres service container (backend, direct route/service calls via `unittest`), `tsc` strict typecheck (frontend) |

## Architecture

```
Browser
  │
  ▼
Caddy (TLS, :80/:443, CSP + security headers, access log)
  ├─ /api/*  ──────────►  FastAPI (Uvicorn) ──► Postgres (pooled connections)
  └─ everything else ──►  static build (Vite output, shared volume)
```

- **Dev**: `docker compose up` - Vite dev server + Uvicorn `--reload`, both
  bind-mounted for hot reload; Vite's own dev-server proxy forwards `/api`
  to the backend container; a `postgres` service backs the database.
- **Prod**: a `frontend-build` container compiles once into a shared volume
  and exits; Caddy and the FastAPI backend are the only two long-running
  app containers (plus `postgres`). There is no server-side rendering and
  no Node process at runtime. The backend exposes `GET /api/health` (a
  round-trip DB query), which Docker's healthcheck and the deploy script's
  post-deploy smoke test both use to confirm the stack is actually serving
  traffic, not just that containers started.
- **Deploys are rollback-safe**: before rebuilding, `deploy_application.sh`
  tags the currently-running `backend`/`frontend-build` images so
  `rollback_application.sh` can re-point Compose at them without a rebuild
  if a deploy goes bad.
- **Migrations are tracked, not idempotent-only**: `database/migrate.py`
  runs each numbered file in `database/migrations/` at most once, recorded
  in a `schema_migrations` table - `000_schema.sql` is the baseline, every
  later structural change is its own new numbered file.

## Directory structure

```
frontend/src/
  api/            thin fetch wrappers: apiClient (public), adminApiClient (bearer token)
  components/     grouped by domain (home, store, work, about, contact, admin, layout, shared/)
  context/        CartContext (cookie-backed cart), SiteDataContext (bootstrap fetch)
  lib/            small utils (cookies, router, viewport, color matching, formatting)
  models/         domain types + small pure helpers (cartLine, order, product, project, content)
backend/
  routes/         FastAPI endpoint modules (admin, contact, instagram, orders, payments)
  services/       security (admin tokens + rate limiting), email, payments
  repositories/   Postgres access per entity (products, projects, content, orders, contact_messages)
  models/         pydantic request/response models
  config.py       all env vars, single source of truth for config
database/         connection.py (pooled), migrate.py, migrations/*.sql (numbered, tracked), seed data
.github/workflows/  CI (test.yml) and CD (deploy.yml)
```

## Pages

No router library - `frontend/src/lib/router.ts` is a ~30-line hand-rolled
`pathname` state (`pushState`/`popstate`) that `App.tsx` reads directly:

| Path | Renders | Notes |
|---|---|---|
| `/` | The single-page site: Hero → Work gallery → Instagram carousel → Store → About → Contact, in one `<main>` | Sections are anchor-linked (`#work`, `#store`, ...), not separate routes |
| `/work/:id`, `/store/:id` | Same home page, with a `ProjectModal`/`ProductModal` overlaid | Real, shareable/back-button-able URLs (`workPath`/`storePath` + `parseModalRoute`), but there's no dedicated detail page component behind them - a known gap, not yet decided whether to address |
| `/checkout` | `CheckoutPage`, lazy-loaded | Desktop checkout entry point; mobile uses a `CheckoutModal` over `/` instead of navigating here |
| `/admin` | `AdminDashboard`, lazy-loaded | Full CRUD for products/projects/content; unmounts the public site entirely rather than rendering alongside it |

`AdminDashboard` and both checkout components are `React.lazy()`-loaded so a
first-time homepage visitor never downloads the Stripe SDK or the admin CRUD
UI.

## Features (product side)

- **Store** - browse and buy knitwear; basket + checkout (dedicated page on
  desktop, modal on mobile), real payments via Card, Apple Pay, Klarna, Vipps
- **Work** - portfolio gallery of finished and in-progress knitting projects
- **About / Contact** - editable content sections and a contact form
- **Instagram** - a carousel of recent posts pulled from the Instagram API
- **Admin dashboard** - manage products, projects, and site content without
  touching code or redeploying (confirms before destructive deletes)

## Running locally

```sh
docker compose up --build
```

- App: http://localhost:8000
- API: http://localhost:8000/api/work (proxied by Vite in dev)
- Health check: http://localhost:8000/api/health
- Hot reload via bind mounts + Vite HMR + Uvicorn `--reload`
- Postgres runs as its own `postgres` Compose service; `init_db()` applies
  any un-run files in `database/migrations/` on backend startup

### Environment variables

Create a `.env` at the repo root (see `backend/config.py` for the full list).
Nothing is required to browse locally with placeholder data - admin login,
contact/order emails, the Instagram carousel, and each payment method all
activate individually once their own env vars are set, and stay
hidden/disabled otherwise. Compose reads `.env` automatically.

## Testing & CI

- Backend: `pytest` (`pyproject.toml`, `testpaths = ["backend"]`)
- Frontend: `npm run typecheck` (runs automatically before `npm run build`)
- No frontend test suite yet - a known gap, not an oversight.
- Both run in [`test.yml`](.github/workflows/test.yml) on every PR against
  `main`; `main` is protected and requires both jobs to pass before a merge
  is allowed.

## Deployment

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

Merging to `main` runs this automatically via
[`deploy.yml`](.github/workflows/deploy.yml): the test suite runs again as a
safety net, then `deploy_application.sh` `rsync`s the repo to the droplet,
rebuilds and restarts the prod Compose stack over SSH, and finally smoke-tests
`https://odaknits.no/api/health` from outside the droplet before declaring
success. If a deploy ships something broken, `./rollback_application.sh`
re-points Compose at the previous `backend`/`frontend-build` images (tagged
automatically by the prior deploy) with no rebuild needed.

**Going live with real payments** means switching `STRIPE_SECRET_KEY`/
`VITE_STRIPE_PUBLISHABLE_KEY` to live keys and `VIPPS_BASE_URL` to
`https://api.vipps.no` with production Vipps credentials - real customer
money moves at that point, so double-check server-side payment verification
first (see `docs/codebase-audit.md` if present locally).

## Deliberate scope decisions

Worth calling out since they read as gaps at first glance but are considered
tradeoffs for a small, single-maintainer, low-traffic project:

- **No router library** - see [Pages](#pages); work/product detail views get
  a real URL but render as a modal over `/`, not a dedicated page.
- **In-memory admin auth** (tokens + rate limits) - doesn't survive a
  process restart or scale past one backend replica. Fine for a
  single-operator internal tool; would need Redis/DB-backed storage before
  ever running more than one backend process.
- **No migration framework, but tracked migrations** - numbered SQL files in
  `database/migrations/` run at most once each, tracked in a
  `schema_migrations` table; still written idempotently
  (`IF NOT EXISTS`) as a safety net, but that's a backstop, not how repeat
  runs are prevented.
- **No Next.js/BFF migration planned** - the server-fetchable surface is
  basically one `/api/bootstrap` call, which doesn't justify a framework
  migration. If SSR is ever needed (e.g. OG tags for social-preview
  crawlers), React Router's framework mode is the preferred next step over
  adopting Next.
