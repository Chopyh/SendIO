# Observability and Audit Baseline

- **Branch State:** `infra/chore-observability-audit-baseline`

## Scope

Establish infrastructure-level baseline for logging, traceability, and audit retention conventions required for campaign and user action auditing.

## Deliverables

- Baseline logging and correlation ID conventions documentation.
- Audit retention policy draft for MVP operations.
- Environment checklist for enabling audit-supporting services.

## Acceptance Criteria

- Audit-related logs are consistently identifiable.
- Retention and access guidance is documented for MVP scope.
- Baseline is usable by backend reporting/audit task without redefining conventions.

## Dependencies

- `infra/chore-docker-mailtrap-env`

## Validation

- Verify logs include request correlation metadata.
- Verify documented retention settings can be applied in Docker environments.

## Evidence

- Request correlation is implemented in Laravel middleware and covered by `backend/tests/Feature/RequestCorrelationTest.php`.
- Baseline conventions are documented in `docs/devops/observability-audit-baseline.md` and indexed from `docs/README.md`.
- Environment examples set `LOG_STACK=daily` and `LOG_DAILY_DAYS=30` so Laravel's daily retention setting is active by default.
- Verification: `./sendio.ps1 composer exec -- pint` passed.
- Verification: `./sendio.ps1 artisan test tests/Feature/RequestCorrelationTest.php tests/Feature/AuthWorkspaceBootstrapTest.php tests/Feature/ContactsImportPipelineTest.php` passed with 13 tests and 60 assertions.
- Notion mirror: https://www.notion.so/3662fdf17ec7813ebad2e93763bfb43d

## Checklist

- [x] Define observability naming conventions.
- [x] Define MVP audit retention and access constraints.
- [x] Document infra prerequisites for audit-ready backend features.
- [x] Validate log correlation across at least one end-to-end flow.
