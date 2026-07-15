# Oda Knits

A portfolio + small-batch knitwear storefront for an independent knitter. Visitors can browse past projects, shop a small collection of knitwear, and get in touch — while the shop owner manages everything through a simple admin dashboard.

## Features

- **Store** — browse and buy knitwear, with a basket and checkout (desktop gets a dedicated checkout page, mobile uses a basket modal)
- **Work** — a portfolio gallery of finished and in-progress knitting projects
- **About / Contact** — editable content sections and a contact form
- **Instagram** — a carousel of recent posts pulled from Instagram
- **Admin dashboard** — manage products, projects, and site content without touching code

## Tech stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion for animation, Three.js for the decorative 3D scenes
- **Backend**: FastAPI with SQLite for storage
- **Infrastructure**: Docker and Docker Compose for local dev and deployment, Caddy as the reverse proxy/TLS layer, hosted on a DigitalOcean Droplet (VPS)

## Dev

```sh
docker compose up --build
```

- App: http://localhost:8000
- API is proxied by Vite at http://localhost:8000/api/work
- Hot reload is enabled through Vite, Uvicorn `--reload`, and bind mounts, so changes on the host are picked up immediately by the running containers.

## Production deploy

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

This build runs Caddy on ports 80/443 for TLS termination. The frontend is compiled once by a `frontend-build` container into a static bundle (a shared volume), which Caddy serves directly — it isn't a running server. API requests under `/api/*` are reverse-proxied to the FastAPI backend; everything else falls back to the frontend's `index.html` for client-side routing. The app is deployed to a DigitalOcean Droplet — `deploy_application.sh` syncs the repo to the server and re-runs the production Compose stack over SSH.

- App: `https://yourdomain.no`
- API: `https://yourdomain.no/api/work`
