# Docker Mailtrap Environment Baseline

- **Branch State:** `infra/chore-docker-mailtrap-env`

## Scope

Define Docker-first environment configuration for mail sandboxing with Mailtrap, including safe local defaults and team-shared setup guidance.

## Deliverables

- Docker environment variables contract for Mailtrap integration.
- Updated environment setup documentation for local and CI usage.
- Health verification steps for mail transport in containerized runtime.

## Acceptance Criteria

- Mail transport points to Mailtrap in non-production environments.
- No local non-Docker execution path is required.
- Setup instructions are reproducible by a new team member.

## Dependencies

- None.

## Validation

- Run Docker stack and verify mail config resolution inside container.
- Execute a smoke mail send using application flow and confirm capture in Mailtrap inbox.

## Implementation Notes

- Environment variable contract documented in `docs/devops/docker-mailtrap-env.md`.
- Local and CI usage paths documented with Docker-only commands.
- Verification evidence matrix recorded in `docs/validation/mail-delivery-sandbox-validation.md`.

## Checklist

- [x] Define Mailtrap environment variable matrix.
- [x] Document Docker usage for mail sandbox configuration.
- [x] Validate end-to-end local mail capture in Mailtrap.
- [x] Record verification evidence in docs.
