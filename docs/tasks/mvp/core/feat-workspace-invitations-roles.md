# Workspace Invitations and Roles Management

- **Task ID:** `MVP-CORE-001`
- **Branch State:** `core/feat-workspace-invitations-roles`
- **Status:** `implemented`

## Scope

Implement SendIO workspace invitations and role management with the following MVP rules:

- Roles are fixed to `owner`, `editor`, and `viewer`.
- Invitation flow uses email token links but requires authenticated accept (`token + login/register`).
- A user can have pending invitations in multiple workspaces simultaneously.
- Only `owner` can invite users, change roles, and remove members.
- Ownership transfer is out of scope for this iteration.

## Dependencies

- `MVP-BACK-001` (auth and workspace bootstrap)
- `MVP-FRONT-001` (auth and workspace onboarding)
- `MVP-BACK-005` (audit pipeline)

## Deliverables

### Backend (Laravel)

- Add `workspace_invitations` persistence model with status lifecycle (`pending`, `accepted`, `revoked`, `expired`).
- Add invitation APIs: create, list, revoke, precheck/resolve token, accept invitation.
- Send real invitation emails with frontend acceptance links (`/invitations/accept?token=...`).
- Add workspace members APIs: list, change role (`editor`/`viewer`), remove member.
- Enforce authorization policies so only `owner` can mutate membership and invitations.
- Emit audit events for invitation and role/member mutations.

### Frontend (Angular)

- Add workspace members management screen for owner flows.
- Add invitation acceptance route and flow with account-aware login/register redirect and locked invite email handling.
- Add role update and remove member owner-only actions.
- Add i18n strings in `en` and `es` for invitation + roles flows.

### Documentation

- Update architecture and API docs for invitations and role governance.
- Record endpoint contracts and state transitions.
- Document known MVP limits (no ownership transfer, no fine-grained permissions).

## Acceptance Criteria

- Owner can invite users by email with `editor` or `viewer` role.
- Invite links require authentication and can only be accepted by matching email identity.
- Unauthenticated invitees are routed by account existence: login if account exists, registration otherwise.
- Invitation-driven login/registration locks email to the invited address and returns user to invitation accept.
- Accepting a valid invitation creates workspace membership with invited role.
- Expired/revoked/already-accepted invitations cannot be accepted.
- Owner can change member role between `editor` and `viewer`.
- Owner can remove members while preserving owner invariants.
- Non-owner users cannot invite, change roles, or remove members.
- Audit events are generated for invitation lifecycle and membership mutations.
- UI uses PrimeNG + TailwindCSS conventions and includes `en`/`es` translations.

## Validation

- Run backend feature tests for invitation lifecycle, role authorization, and member mutations.
- Run backend unit tests for token/hash validation and invitation status guards.
- Run frontend tests for owner/non-owner UI guards and accept-invitation flow.
- Run formatting/lint checks according to project standards.

## Checklist

- [x] Define invitation domain schema and migrations.
- [x] Implement backend invitation endpoints and policies.
- [x] Implement backend members role/update/remove endpoints and policies.
- [x] Emit and validate audit events for all mutations.
- [x] Implement frontend workspace members management UI.
- [x] Implement frontend invitation acceptance flow with auth redirect.
- [x] Add invitation email delivery and account-aware auth routing with locked email fields.
- [x] Add and validate i18n entries (`en`, `es`).
- [x] Update docs index and related architecture/API documentation.
- [x] Run validations and record evidence.

## Validation Evidence

### Backend

- Command: `.\sendio.ps1 artisan test --compact tests/Feature/WorkspaceInvitationsRolesApiTest.php tests/Unit/WorkspaceInvitationTest.php tests/Feature/RegistrationTest.php`
- Result: passed (`15 passed`, `84 assertions`).

### Frontend

- Command: `pnpm --dir "frontend" ng test --watch=false`
- Result: passed (`18 files`, `113 tests`).
