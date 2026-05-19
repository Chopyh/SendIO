# Auth and Workspace Bootstrap API

- **Branch State:** `back/feat-auth-workspace-bootstrap`

## Scope

Implement backend MVP foundations for authentication and account-workspace bootstrap aligned with the project collaboration model.

## Deliverables

- Authentication endpoints and token/session handling contract.
- Workspace bootstrap flow for initial account and workspace assignment.
- API documentation for auth and workspace bootstrap lifecycle.

## Acceptance Criteria

- Users can authenticate and access workspace-scoped resources.
- Workspace context is mandatory for protected endpoints.
- Error responses for invalid auth/workspace context are standardized.

## Dependencies

- `infra/chore-docker-mailtrap-env`

## Validation

- Run backend tests for auth and workspace guards.
- Validate workspace-scoped authorization scenarios.

## Checklist

- [x] Define auth and workspace domain contracts.
- [x] Implement authentication and workspace bootstrap endpoints.
- [x] Add tests for happy path and rejection path.
- [x] Document API usage and constraints.
