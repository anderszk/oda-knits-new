# Oda Knits

A portfolio + small-batch knitwear storefront for an independent knitter.

## Tech stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Three.js
- **Backend**: FastAPI, SQLite
- **Infrastructure**: Docker, Docker Compose, Caddy

## Dev

```sh
docker compose up --build
```

- App: http://localhost:8000
- API is proxied by Vite at http://localhost:8000/api/work
- Hot reload is enabled through Vite, Uvicorn `--reload`, and bind mounts.

## Production deploy

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

This build runs Caddy on ports 80/443, the React app internally, and FastAPI internally.

- App: `https://yourdomain.no`
- API: `https://yourdomain.no/api/work`
