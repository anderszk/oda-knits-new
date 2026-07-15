# CLAUDE.md

Guidance for AI agents (and humans) working in this repo.

## What this is

Oda Knits: a portfolio + small-batch knitwear storefront for an independent
knitter. Visitors browse past projects, shop a small collection, and get in
touch; the shop owner manages products/projects/content through an admin
dashboard. Small, low-traffic, single-maintainer project — favor simple,
boring solutions over infrastructure that needs to earn its keep.

## Architecture

- **Frontend** (`frontend/src`): Vite + React 19 + TypeScript (strict). No
  BFF — the frontend calls the FastAPI backend directly via relative
  `/api/*` paths. In dev, Vite's dev-server proxy forwards `/api` to the
  backend container; in prod, Caddy does the same path-based routing in
  front of static files. There is no Node server in production.
- **Backend** (`backend/`, `database/`): FastAPI + SQLite. Layered as
  `routes/` (HTTP endpoints) → `services/` (auth, email, payments logic) →
  `repositories/` (SQLite data access) → `database/` (connection,
  migrations, `schema.sql`). Config is centralized and env-driven in
  `backend/config.py`.
- **Infra**: Docker Compose for dev (`docker-compose.yml`, hot reload via
  bind mounts + `--reload`/Vite HMR) and prod (`docker-compose.prod.yml`).
  Caddy terminates TLS and reverse-proxies. Deployed to a single
  DigitalOcean droplet via `deploy_application.sh` (rsync + remote
  `docker compose up`).

**Production frontend is a fully static build** — a one-shot container
writes the Vite build output to a volume and Caddy serves it directly, with
no Node process at runtime. Keep this in mind before adding anything that
assumes a live Node server (SSR, server components, API routes) — that
would be a deploy-pipeline change, not just a code change.

## Directory map

```
frontend/src/
  api/            thin fetch wrappers: apiClient (public), adminApiClient (bearer token)
  components/     grouped by domain (home, store, work, about, contact, admin, layout, shared/)
  context/        CartContext (cookie-backed cart), SiteDataContext (bootstrap fetch)
  lib/            small utils (cookies, viewport, color matching, formatting)
  models/         domain types + small pure helpers (cartLine, order, product, project, content)
backend/
  routes/         FastAPI endpoint modules (admin, contact, instagram, orders, payments)
  services/       security (admin tokens + rate limiting), email, payments
  repositories/   SQLite access per entity (products, projects, content, orders, contact_messages)
  models/         pydantic request/response models
  config.py       all env vars, single source of truth for config
database/         connection, migrations, schema.sql, seed data
```

## Commands

- Dev (full stack): `docker compose up --build` — app at `http://localhost:8000`
- Frontend only: `npm run dev` (Vite dev server)
- Typecheck: `npm run typecheck` (runs both app and node tsconfigs)
- Frontend build: `npm run build` (typecheck first, then `vite build`)
- Backend tests: `pytest` (see `pyproject.toml`; `testpaths = ["backend"]`)
- Prod deploy: `docker compose -f docker-compose.prod.yml up -d --build`
  (or `deploy_application.sh` to sync + run this remotely over SSH)

## Frontend conventions

- TypeScript strict mode, `noUnusedLocals`/`noUnusedParameters` enforced —
  don't leave dead code or unused params.
- Path alias `@/*` → `frontend/src/*`.
- **No ESLint/Prettier configured.** Match the existing style by hand
  (function components, named exports, Tailwind utility classes inline,
  minimal comments) rather than introducing a linter/formatter unprompted.
- **No frontend test suite exists.** Don't assume one; if you add tests,
  set up the runner as part of that change.
- No router library — routing is a hand-rolled `pathname` state in
  `App.tsx` (`pushState`/`popstate`) covering exactly three paths: `/`
  (single page, hash-anchor sections), `/checkout`, `/admin`. Work/product
  detail views are modals, not routes — known gap, not yet decided whether
  to address.
- Two API clients by design: `apiClient` (public endpoints, no auth) and
  `adminApiClient` (adds `Authorization: Bearer <token>` from
  `localStorage`, logs out on 401). Don't merge these or add a server-side
  proxy layer without discussion — the no-BFF setup is intentional.
- Env vars are `import.meta.env.VITE_*` (`VITE_API_URL`,
  `VITE_STRIPE_PUBLISHABLE_KEY`), not `process.env`.
- Checkout (`useCheckout.ts`) is deliberately fully client-side: cart in a
  cookie, pending-payment state in `sessionStorage` across Klarna/Vipps
  redirects, `window.location` navigation. This has to stay client-driven —
  don't try to move it server-side.
- `AboutCharmScene`, `YarnScene`, `StoreScene` are Three.js/WebGL and
  browser-only. If this app ever gains SSR, these must be lazy-loaded
  client-only (e.g. `next/dynamic({ ssr: false })` equivalent) — they will
  crash on the server otherwise.
- No SEO metadata exists yet (static `<title>` only, no description/OG
  tags) — known gap, not yet addressed.

## Backend conventions

- Config only through `backend/config.py`, which reads env vars with local
  defaults — don't read `os.getenv` elsewhere.
- Admin auth is a bearer token issued by `POST /api/admin/login`, tracked
  in-memory (`services/security.py`: token store + rate limiting) — tokens
  don't survive a process restart and won't be shared across replicas if
  this ever runs on more than one backend process. This is an accepted
  tradeoff for a single-operator internal tool; don't "fix" it into
  something heavier without being asked.
- `backend/test_main.py` uses `unittest` and calls route/service functions
  directly rather than going through an ASGI `TestClient`. `init_db()` is
  called eagerly at import time in `main.py` specifically so these direct
  calls work without lifespan startup — don't remove that without updating
  the tests.
- CORS origins in `backend/main.py` are hardcoded to known local dev ports;
  update that list if a new dev host/port is introduced.
- Product/project images are served from the backend (`/api/uploads`, via
  admin file upload), not bundled as frontend assets — don't assume
  `next/image`-style local optimization would apply to them without
  whitelisting the backend host.

## Validation & security conventions (follow these for new endpoints/forms)

These patterns are already established across `orders`, `payments`, and
`contact` — match them rather than inventing new ones:

- **Never trust client-submitted money amounts.** Prices/subtotals are
  always recomputed server-side from repository data before being sent to
  a payment provider or persisted (see `revalidated_subtotal` in
  `services/payments.py`). The client sends item ids/quantities; the
  server is the only source of truth for price.
- **Rate-limit anything public and mutating**, especially
  auth/payment/contact endpoints: `check_rate_limit(name, client_key(request),
  limit, window_seconds)` from `services/security.py`. New endpoints in
  this category should call it too.
- **Honeypot anti-spam on public forms**: contact and order payloads carry
  a hidden `website` field that must stay empty (`reject_spam` validators).
  Any new public-facing form should follow the same pattern rather than
  adding CAPTCHAs or other heavier defenses.
- **Re-validate external identifiers with a strict regex** before using
  client-supplied references in a further call — e.g. Stripe payment
  intent ids and Vipps references are checked against an exact pattern
  before being used to look anything up. Don't pass client-supplied ids
  through to an external API or a DB query unchecked.
- **Feature flags via config-truthiness, not a separate flags system**:
  optional providers (Stripe, Vipps) are "enabled" simply by whether their
  secret/credentials env vars are set (e.g. `VIPPS_CONFIGURED`), surfaced
  to the frontend through a small `/api/payments/config`-style endpoint so
  the UI can hide what isn't configured. Reuse this shape for any new
  optional integration instead of adding a config service.
- **Shared pydantic bases**: `StrippedModel` (auto-trims string/list-of-string
  fields) and `ConfigDict(extra="forbid")` (rejects unknown fields) are the
  norm for request payloads — extend/apply these on new models rather than
  re-implementing trimming or strictness per-model.
- **Money is an integer in the smallest currency unit only at the payment-provider
  boundary** (multiply by 100 right at the Stripe/Vipps call); everywhere
  else in the app, prices are plain NOK integers. Keep that conversion
  localized rather than storing/passing pre-multiplied amounts.

## Data & IDs

- Products/projects get human-readable slug ids (`slugify` + `unique_id` in
  `repositories/base.py`), auto-suffixed on collision (`my-sweater-2`) —
  reuse this for new sluggable entities rather than switching to UUIDs.
- Entities that carry images keep a legacy singular `image` field in sync
  with a plural `images` list via model validators (`image` mirrors
  `images[0]`) for backward compatibility with older data/clients. Preserve
  both fields together if you touch product/project image handling — don't
  drop one.
- **Wire-shape boundary is explicit and intentional**: the backend speaks
  snake_case (matches Python/pydantic conventions), the frontend keeps
  camelCase in UI/form state, and a small mapper function does the
  conversion at the API boundary (see `toShippingPayload` in
  `frontend/src/models/order.ts`). Don't let snake_case leak into React
  state, and don't let camelCase leak into request bodies — map explicitly
  like the existing code does.
- **No migration framework** (no Alembic/etc). `database/schema.sql` is
  executed idempotently on every boot, and schema changes since the
  original shape are hand-written, guarded `ALTER TABLE` blocks appended to
  `database/migrations.py` (checked via `PRAGMA table_info` so they're safe
  to re-run). Follow this pattern for new columns/tables — don't introduce
  a migration tool for what's currently a single small SQLite file.

## Standing architectural decisions (don't relitigate without cause)

- No Next.js/BFF migration is planned. If revisited, the earlier discussion
  concluded: don't do a full framework migration for RSC alone (this app's
  server-fetchable surface is basically just the `/api/bootstrap` call);
  if real routes + SSR are ever needed (e.g. for social-preview crawlers,
  which don't execute JS and need OG tags in the initial HTML), prefer
  adding React Router and, if SSR becomes necessary, its framework mode —
  over adopting Next — since it preserves the direct-to-FastAPI model and
  the current static deploy for as long as possible.
