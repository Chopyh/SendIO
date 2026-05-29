# Dokploy Frontend Production Container

## Scope

Add the production frontend container contract for Dokploy deployments without changing the local Angular development workflow.

## Deliverables

- Production `frontend/Dockerfile` with a Node build stage and nginx runtime stage.
- Frontend-scoped nginx config for static Angular SPA hosting.
- Production compose frontend service that builds and exposes the nginx runtime.
- DevOps documentation for the Dokploy backend/frontend split.

## Acceptance Criteria

- The frontend image builds Angular with `pnpm@11.1.3` through Corepack.
- The nginx runtime serves compiled Angular files with SPA fallback to `/index.html`.
- The frontend nginx config does not proxy `/api` or any backend route.
- Dokploy remains responsible for external routing between frontend and backend/API.
- Development keeps using Angular `ng serve`; `docker-compose.dev.yml` is not changed for frontend nginx.

## Validation

- `docker compose -f docker-compose.yml config` succeeds.
- `docker compose -f docker-compose.yml build frontend` succeeds when Docker is available.

## Checklist

- [x] Add production frontend Dockerfile.
- [x] Add frontend nginx SPA config.
- [x] Update production compose frontend service.
- [x] Document the Dokploy production split.
- [x] Index the task and documentation files.
