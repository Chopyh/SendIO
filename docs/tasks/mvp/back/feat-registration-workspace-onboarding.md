# Registration and Workspace Onboarding API

- **Branch State:** `back/feat-registration-workspace-onboarding`

## Scope

Implement a single authenticated registration endpoint that creates a user account, account, workspace, and owner membership in one atomic transaction, returning a JWT token for immediate use.

## Deliverables

- `POST /api/auth/register` unauthenticated endpoint.
- Atomic transaction: user + account + workspace + owner membership.
- Automatic workspace name derivation when `workspace_name` is absent.
- JWT token returned in the same response with user and workspace context.
- No dependency on `preferred_language` field.

## Dependencies

- `infra/chore-docker-mailtrap-env`

## Acceptance Criteria

- Registration creates user, account, workspace, and owner membership atomically.
- If `workspace_name` is absent, it is derived as `{first_name}-workspace`.
- Response includes `access_token`, user identity, and workspace context.
- Duplicate email returns a validation error without creating partial records.
- Token returned allows immediate authenticated calls.

## Validation

- Run backend tests for registration happy path and rejection path.
- Verify atomic transaction behavior on duplicate email.

## Checklist

- [x] Implement `POST /api/auth/register` endpoint.
- [x] Add route without auth middleware.
- [x] Use `DB::transaction` for atomicity.
- [x] Derive workspace name from `first_name` when absent.
- [x] Return JWT token + user + workspace in single response.
- [x] Add tests for happy path, duplicate email, and automatic workspace name.