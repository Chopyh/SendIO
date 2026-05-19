# Auth and Workspace Onboarding UI

- **Branch State:** `front/feat-auth-workspace-onboarding`

## Scope

Implement frontend MVP flows for sign-in and workspace selection/bootstrap to establish a valid workspace session before feature access.

## UI Stack Requirement

- Mandatory: **PrimeNG** components + **TailwindCSS** utilities.

## Deliverables

- Authentication screens and workspace selection/onboarding steps.
- Session management integration with backend auth/workspace API.
- Guarded routing for workspace-scoped sections.

## Acceptance Criteria

- Users can sign in and enter a workspace context.
- Unauthorized access is redirected to auth/onboarding flow.
- UI supports English and Spanish labels for core onboarding steps.
- UI implementation uses PrimeNG components and TailwindCSS utility classes.

## Dependencies

- `back/feat-auth-workspace-bootstrap`

## Validation

- Run frontend tests for auth guards and onboarding transitions.
- Validate i18n rendering for `en` and `es` in MVP views.

## Checklist

- [x] Build auth and workspace onboarding screens.
- [x] Integrate token/session lifecycle and route guards.
- [x] Add i18n keys for onboarding text (`en`, `es`).
- [x] Validate acceptance flows with automated tests.

## Implementation Notes

- Registration owner-account API endpoint is still an explicit backend gap. The wizard step is fully implemented at UI/state level and bootstrap submission is encapsulated in `AuthApiService`.
