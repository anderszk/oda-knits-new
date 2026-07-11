# oda-knit

Pastel React/FastAPI portfolio site with Tailwind CSS, Framer Motion, and Three.js visuals.

## Dev

```sh
docker compose up --build
```

- App: http://localhost:8000
- API is proxied by Vite at http://localhost:8000/api/work
- Hot reload is enabled through Vite, Uvicorn `--reload`, and bind mounts.
- Contact submissions are stored in the persistent `oda-knit-data` Docker volume and emailed to `oda.hennissen@gmail.com` when SMTP is configured.

For contact emails, add SMTP settings to a local `.env` file before starting Docker:

```sh
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=oda.hennissen@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=oda.hennissen@gmail.com
ADMIN_PASSWORD=choose_a_long_unique_admin_password
```

## Production deploy

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

This build runs Caddy on ports 80/443, the React app internally, and FastAPI internally.

On the server, point your domain DNS `A` record to the server IP, then create `.env`:

```sh
DOMAIN=yourdomain.no
ADMIN_PASSWORD=choose_a_long_unique_admin_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=oda.hennissen@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=oda.hennissen@gmail.com
CONTACT_EMAIL_TO=oda.hennissen@gmail.com
```

- App: `https://yourdomain.no`
- API: `https://yourdomain.no/api/work`
