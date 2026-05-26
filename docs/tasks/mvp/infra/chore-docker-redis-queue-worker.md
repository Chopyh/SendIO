# Docker Redis Queue Worker Baseline

- **Branch State:** `infra/chore-docker-redis-queue-worker`

## Scope

Add a simple Docker-managed Laravel Redis queue worker as the default baseline for both development and production compose stacks.

## Deliverables

- `queue-worker` service in `docker-compose.dev.yml`.
- `queue-worker` service in `docker-compose.yml`.
- Docker wrapper commands to inspect queue logs and restart queue workers.
- Updated operational docs for queue env contract and verification.
- Updated design diagrams to show Redis as the queue backend and `queue-worker` as the delivery process.

## Acceptance Criteria

- Queue worker starts with Docker stack in dev and production-base compose files.
- Worker command is `php artisan queue:work redis --sleep=1 --tries=3 --timeout=120`.
- Queue connection contract documents `QUEUE_CONNECTION=redis`.
- Team runbook includes worker log inspection and restart steps.
- Component and campaign delivery activity diagrams include the Docker-managed Redis queue worker.

## Dependencies

- `back/feat-campaign-delivery-mailtrap`

## Validation

- `docker compose -f docker-compose.dev.yml config` succeeds.
- `docker compose -f docker-compose.yml config` succeeds.
- Wrapper commands map to queue log tail and `queue:restart` behavior.

## Checklist

- [x] Add Docker queue worker service for dev compose.
- [x] Add Docker queue worker service for production-base compose.
- [x] Update queue env/worker operational documentation.
- [x] Add developer wrapper commands for queue logs and restart.
- [x] Update system design diagrams with the Redis queue worker.
