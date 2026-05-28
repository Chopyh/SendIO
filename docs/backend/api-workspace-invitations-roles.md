# API: Workspace Invitations and Roles (MVP)

## Scope

This API covers owner-driven membership governance for a workspace:

- Invite users with fixed roles: `editor` or `viewer`
- Resolve invitation token before authentication flow
- Send invitation emails through configured Laravel mail transport (Mailtrap-ready)
- Accept invitation as an authenticated user with matching email
- List members and invitations
- Update member role (`editor`/`viewer`) and remove members

Owner transfer and fine-grained permission matrices are out of MVP scope.

## Endpoints

### Invitations

- `GET /api/workspaces/invitations` (auth + workspace context)
- `POST /api/workspaces/invitations` (owner only)
- `POST /api/workspaces/invitations/{invitation}/revoke` (owner only)
- `GET /api/workspaces/invitations/resolve/{token}` (public precheck)
- `POST /api/workspaces/invitations/accept` (auth required)

### Members

- `GET /api/workspaces/members` (auth + workspace context)
- `PATCH /api/workspaces/members/{member}` (owner only)
- `DELETE /api/workspaces/members/{member}` (owner only)

## Invitation Lifecycle

- `pending`: invitation can be accepted until `expires_at`
- `accepted`: accepted by matching authenticated email; cannot be accepted again
- `revoked`: revoked by owner; cannot be accepted
- `expired`: represented by `pending` invitation with `expires_at` in the past

## Invitation Email Delivery

- Invitation creation sends an email to the invitee using Laravel mail transport.
- The email includes the frontend acceptance link: `/invitations/accept?token=...`.
- URL base is resolved from `FRONTEND_URL` when configured, otherwise falls back to app URL defaults.
- Token persistence remains hash-only (`token_hash` in database); the plain token is used only to build the invitation email link and is never returned by the API.

## Resolve Contract

`GET /api/workspaces/invitations/resolve/{token}` returns safe metadata for auth-aware routing:

- `workspace_id`
- `workspace_name`
- `email`
- `role`
- `status`
- `expires_at`
- `has_account` (boolean indicating if invited email already exists as a user)

Sensitive fields like `token_hash` and `email_normalized` are never exposed.

## Authorization Rules

- Owner-only mutations:
  - Create/revoke invitation
  - Update/remove member
- Accept invitation requires:
  - Valid pending token
  - Authenticated user
  - `authenticated_user.email` equals invitation email (case-insensitive)

## Audit Events

- `workspace.invitation.created`
- `workspace.invitation.revoked`
- `workspace.invitation.accepted`
- `workspace.member.role_updated`
- `workspace.member.removed`

## Known MVP Limits

- No ownership transfer endpoint
- No per-feature ACL beyond fixed role checks
