# Dokploy Single Backend Production Container

## Scope

Make the production backend deployable in Dokploy without requiring `backend/vendor` or source-code bind mounts on the host.

## Decision

Production uses one backend HTTP container named `app`. It runs nginx and PHP-FPM in the same image, exposes internal port `80`, and serves `/api` traffic routed by Dokploy. The `queue-worker` service reuses the same built image but overrides the command to run Laravel's Redis queue worker.

## Deliverables

- Backend Docker image installs Composer dependencies during build.
- Backend entrypoint repairs missing Composer dependencies at runtime if a platform mount hides the built `vendor` directory.
- Queue worker command also performs the Composer autoload guard before running Artisan.
- Backend Docker image includes nginx config for Laravel public entrypoint routing.
- Production compose removes backend source bind mounts.
- Production compose reads backend configuration from environment variables injected by Dokploy.
- Production compose removes the separate `web` service.
- Production Dokploy route contract is `/` to `frontend:80` and `/api` to `app:80`.

## Acceptance Criteria

- `docker compose -f docker-compose.yml config` renders successfully.
- `docker compose -f docker-compose.yml build app` creates an image with `vendor/autoload.php` inside `/var/www/html`.
- `queue-worker` can run `php artisan queue:work` without a missing Composer autoloader error.
- `queue-worker` and `app` use the same `sendio-backend:production` image.
- Compose uses `pull_policy: build` for backend services to reduce stale image reuse in Dokploy.
- Dokploy does not need to execute `composer install` manually after deployment.
- Dokploy does not need to mount a Laravel `.env` file into the backend container.
- Local development compose remains compatible with the existing separate `web` service.

## Checklist

- [x] Install backend Composer dependencies during Docker build.
- [x] Add a runtime entrypoint guard for missing `vendor/autoload.php`.
- [x] Add the same Composer guard directly to the production queue worker command.
- [x] Add production backend nginx config using local PHP-FPM.
- [x] Remove backend code bind mounts from production compose.
- [x] Use Compose environment interpolation instead of mounting `.env` into production backend containers.
- [x] Remove the production-only separate `web` service.
- [x] Document the updated Dokploy route targets.
