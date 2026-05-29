# Dokploy Production Split

Dokploy production runs SendIO as separate backend and frontend containers. The frontend container builds the Angular application with Docker and serves only static SPA files through nginx; the backend containers remain responsible for Laravel, API, queue, and data services.

## Quick Path

1. Build the production compose model with `docker compose -f docker-compose.yml config`.
2. Build the frontend image with `docker compose -f docker-compose.yml build frontend`.
3. Configure Dokploy external routing so frontend traffic goes to the `frontend` service on port `80` and API/backend traffic goes to the Laravel nginx service.
4. Keep local frontend development on Angular dev server with `pnpm start` / `ng serve`.

## Runtime Contract

| Area | Production Decision |
|---|---|
| Frontend container | Builds `frontend/` with `pnpm@11.1.3` through Corepack, runs `pnpm build`, and serves the compiled Angular output with nginx. |
| Frontend nginx | Serves static files from `/usr/share/nginx/html` and falls back to `/index.html` for SPA routes. |
| API routing | No `/api` proxy exists in the frontend nginx config. Dokploy owns external routing between frontend and backend/API. |
| Backend web container | Continues using the backend-oriented nginx config under `config/nginx/default.conf` for Laravel/PHP-FPM. |
| Development frontend | Stays on Angular dev server (`ng serve`) and is not replaced by production nginx. |

## Files

| File | Purpose |
|---|---|
| `frontend/Dockerfile` | Multi-stage production frontend image: Node build stage and nginx runtime stage. |
| `frontend/nginx/default.conf` | Frontend-only nginx config with SPA fallback and static asset cache headers. |
| `frontend/pnpm-workspace.yaml` | pnpm 11 build-script allowlist required for reproducible Docker installs. |
| `docker-compose.yml` | Production compose entry for the frontend service; exposes nginx port `80` for platform routing. |
| `docker-compose.dev.yml` | Development compose remains backend-focused and does not run the production frontend nginx service. |

## Verification

```bash
docker compose -f docker-compose.yml config
docker compose -f docker-compose.yml build frontend
```

Expected results:

- The compose config renders successfully.
- The frontend image builds without needing local Node or pnpm.
- The generated frontend container serves Angular routes through nginx with `/index.html` fallback.

## Follow-Ups

- Configure Dokploy domains/routes explicitly in the deployment UI or environment-specific deployment settings.
- Keep API base URLs environment-driven in Angular so the production SPA targets the backend route managed by Dokploy.
