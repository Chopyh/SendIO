# Dokploy Production Split

Dokploy production runs SendIO with a frontend container and a single HTTP backend container. The frontend container builds the Angular application and serves static SPA files through nginx. The backend `app` container installs Laravel dependencies at image build time and runs nginx plus PHP-FPM in the same container so production does not depend on `backend/vendor` existing on the host.

## Quick Path

1. Build the production compose model with `docker compose -f docker-compose.yml config`.
2. Build the production images with `docker compose -f docker-compose.yml build app frontend`.
3. Configure Dokploy external routing so `/` goes to `frontend:80` and `/api` goes to `app:80`.
4. Keep local frontend development on Angular dev server with `pnpm start` / `ng serve`.

## Runtime Contract

| Area | Production Decision |
|---|---|
| Frontend container | Builds `frontend/` with `pnpm@11.1.3` through Corepack, runs `pnpm build`, and serves the compiled Angular output with nginx. |
| Frontend nginx | Serves static files from `/usr/share/nginx/html` and falls back to `/index.html` for SPA routes. |
| API routing | No `/api` proxy exists in the frontend nginx config. Dokploy owns external routing between frontend and backend/API. |
| Backend app container | Runs nginx and PHP-FPM in one image, exposes internal port `80`, and serves Laravel API traffic for Dokploy `/api` routing. |
| Backend dependencies | Composer dependencies are installed during Docker build. The entrypoint also checks `vendor/autoload.php` at runtime and runs `composer install --no-dev --optimize-autoloader` if a platform mount hides or removes `vendor`. |
| Backend environment | Production compose reads required values from the Compose environment, so Dokploy can inject secrets through deployment variables without mounting `.env` into the image. |
| Queue worker | Reuses the backend image and overrides the command with `php artisan queue:work redis --sleep=1 --tries=3 --timeout=120`. |
| Development frontend | Stays on Angular dev server (`ng serve`) and is not replaced by production nginx. |
| Host ports | Production compose does not publish `80:80`; Dokploy owns the public listener and routes to container-internal exposed ports. |

## Files

| File | Purpose |
|---|---|
| `frontend/Dockerfile` | Multi-stage production frontend image: Node build stage and nginx runtime stage. |
| `frontend/nginx/default.conf` | Frontend-only nginx config with SPA fallback and static asset cache headers. |
| `frontend/pnpm-workspace.yaml` | pnpm 11 build-script allowlist required for reproducible Docker installs. |
| `backend/Dockerfile` | Production-capable Laravel image with Composer dependencies, PHP-FPM, and nginx. |
| `backend/docker/entrypoint.sh` | Runtime guard that restores Composer dependencies before `app` or `queue-worker` starts if `vendor/autoload.php` is missing. |
| `backend/docker/nginx/default.conf` | Backend nginx config for the single-container production backend. |
| `docker-compose.yml` | Production compose entries for frontend, backend app, queue worker, and data services without code bind mounts. |
| `docker-compose.dev.yml` | Development compose keeps the separate `web` nginx service and bind-mounted backend source. |

## Verification

```bash
docker compose -f docker-compose.yml config
docker compose -f docker-compose.yml build app frontend
```

Expected results:

- The compose config renders successfully.
- The backend image builds without needing `backend/vendor` on the host.
- The backend app and queue worker use the same `sendio-backend:production` image.
- Dokploy provides `APP_KEY`, database, MongoDB, Redis, JWT, and mail variables through deployment environment settings.
- The frontend image builds without needing local Node or pnpm.
- The generated frontend container serves Angular routes through nginx with `/index.html` fallback.
- No service attempts to bind host port `80`; Dokploy should be the only public reverse proxy.

## Follow-Ups

- Configure Dokploy domains/routes explicitly in the deployment UI or environment-specific deployment settings: `/` to `frontend:80`, `/api` to `app:80`.
- Keep API base URLs environment-driven in Angular so the production SPA targets the backend route managed by Dokploy.
