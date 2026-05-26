# Reporting and Audit API (MVP)

This contract defines `MVP-BACK-005` for workspace-scoped reporting endpoints and persistent audit events.

## Quick path

1. Authenticate with `POST /api/auth/login` and include `Authorization: Bearer <access_token>`.
2. Include `X-Workspace-Id: <workspace_id>` on every reporting and audit request.
3. Query campaign list with `GET /api/reports/campaigns`.
4. Query campaign metrics with `GET /api/reports/campaigns/{campaign}/metrics`.
5. Query audit history with `GET /api/audit/events` and optional filters.

## Endpoints

| Endpoint | Auth | Workspace header | Purpose |
|---|---|---|---|
| `GET /api/reports/campaigns` | Yes | Yes | Paginated campaign list for reporting views |
| `GET /api/reports/campaigns/{campaign}/metrics` | Yes | Yes | Campaign-level delivery metrics |
| `GET /api/audit/events` | Yes | Yes | Paginated workspace audit trail with filters |

## Reporting contracts

### `GET /api/reports/campaigns`

- Query params:
  - `per_page` (optional, default `20`, max `100`)
- Response format follows Laravel paginator JSON (`data`, `total`, `per_page`, `current_page`, `last_page`, links).
- Workspace isolation is strict: campaigns from other workspaces are never included.

### `GET /api/reports/campaigns/{campaign}/metrics`

Returns:

- `campaign_id`
- `status`
- `recipient_count`
- `sent_count`
- `failed_count`
- `pending_recipients_count`
- `sent_recipients_count`
- `failed_recipients_count`
- `attempts_total`
- `dispatched_at`
- `completed_at`

If the campaign does not belong to the workspace, response is `404 campaign.not_found`.

## Audit persistence

### Table

- `audit_events`
  - `id` (UUID)
  - `workspace_id` (UUID, required)
  - `actor_user_id` (UUID, nullable for system/queue events)
  - `event_key` (string)
  - `context_json` (JSONB)
  - `occurred_at` (timestamp)

### Event keys included in MVP

- `campaign.dispatch.requested`
- `campaign.dispatch.queued`
- `contacts.import.completed`
- `contacts.import.rejected_schema`
- `template.version.published`

### Context policy (MVP)

Context is restricted to IDs/counts/status fields only.

- Allowed examples: `campaign_id`, `template_id`, `status_before`, `status_after`, `processed_count`.
- Forbidden examples: raw contact emails, CSV row payloads, or full template bodies.

## Audit read contract

### `GET /api/audit/events`

Supported query params:

- `event_key` exact match
- `actor_user_id` exact match
- `campaign_id` via context lookup
- `from` ISO datetime lower bound on `occurred_at`
- `to` ISO datetime upper bound on `occurred_at`
- `per_page` (optional, default `20`, max `100`)

Response format follows Laravel paginator JSON and includes actor projection (`id`, `name`, `email`) when available.

## Error codes

| Code | Status | Meaning |
|---|---|---|
| `campaign.not_found` | 404 | Campaign does not belong to workspace |
| `auth.unauthenticated` | 401 | Missing or invalid token |
| `workspace.required` | 400 | Missing `X-Workspace-Id` header |
| `workspace.forbidden` | 403 | User is not member of requested workspace |
