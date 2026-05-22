# Campaign Delivery API (MVP)

This contract defines the first production slice of `MVP-BACK-004` for workspace-scoped campaign creation, queue-first dispatch, and per-recipient delivery tracking through the configured Laravel mail transport (Mailtrap in sandbox environments).

## Quick path

1. Authenticate with `POST /api/auth/login` and include `Authorization: Bearer <access_token>`.
2. Include `X-Workspace-Id: <workspace_id>` on all campaign endpoints.
3. Create campaign draft with recipients using `POST /api/campaigns`.
4. Enqueue recipient delivery jobs using `POST /api/campaigns/{campaign}/dispatch`.
5. Read minimal delivery status using `GET /api/campaigns/{campaign}/summary`.

## Endpoints

| Endpoint | Auth | Workspace header | Role | Purpose |
|---|---|---|---|---|
| `POST /api/campaigns` | Yes | Yes | Owner, Editor | Create campaign draft from template/version and recipient selection |
| `POST /api/campaigns/{campaign}/dispatch` | Yes | Yes | Owner, Editor | Enqueue pending recipients for delivery |
| `GET /api/campaigns/{campaign}/summary` | Yes | Yes | Owner, Editor, Viewer | Read minimal campaign status and counters |

## Create campaign request

### Body

```json
{
  "name": "Launch Campaign",
  "template_id": "<template_uuid>",
  "template_version_number": 1,
  "recipient_ids": ["<contact_uuid>", "<contact_uuid>"]
}
```

### Validation rules

| Field | Rule |
|---|---|
| `name` | required, string, max 120 |
| `template_id` | required UUID in current workspace |
| `template_version_number` | required integer >= 1, must be `published` |
| `recipient_ids` | required array with at least one UUID |
| `recipient_ids.*` | each contact must exist in current workspace |

### Successful response (`201`)

`data` includes campaign identity and initial status:

- `status`: `draft`
- `recipient_count`
- `sent_count` and `failed_count` initialized to `0`

## Dispatch contract

- Dispatch only accepts campaign states `draft` or `failed`.
- Dispatch returns `409 campaign.invalid_state` when campaign is already queued/running/completed/sent or any non-dispatchable state.
- Dispatch enqueues one `SendCampaignRecipientJob` per recipient with status `pending` for the accepted transition.
- Campaign status is updated to `queued` and `dispatched_at` is set.

## Delivery orchestration behavior

| Area | Decision |
|---|---|
| Queue strategy | One job per recipient (`SendCampaignRecipientJob`) |
| Attempts policy | max 2 retries, 3 total attempts (`tries = 3`) |
| Recipient transitions | `pending` -> `sending` -> `sent` OR `failed` (or back to `pending` before final retry) |
| Sending lease recovery | `sending` claims use `last_attempt_at` as a lease heartbeat; stale leases older than 15 minutes can be reclaimed |
| Attempt ledger | Each send attempt is persisted to `delivery_attempts` |
| Campaign counters | `sent_count`, `failed_count`, and terminal `status` are recalculated after each attempt |

### Sending lease semantics (MVP safety)

- Recipient claim is atomic and accepts either:
  - `status = pending`, or
  - `status = sending` with an expired lease (`last_attempt_at <= now() - 15 minutes`) or missing lease timestamp.
- Fresh `sending` leases are treated as active and no-op.
- `sent` and `failed` remain terminal no-op states for claim.
- A conservative 15-minute lease timeout minimizes duplicate-send risk while still recovering recipients abandoned by worker/process crashes.

### Delivery validation scope

- Automated test coverage uses Laravel fake mail transport (`Mail::fake`) to validate dispatch/job behavior deterministically.
- Real Mailtrap sandbox inbox verification is a separate manual smoke step and is not implied by automated test success.
- Runtime smoke procedure and evidence log are tracked in `docs/validation/mail-delivery-sandbox-validation.md`.
- Readiness boundary for this branch: implementation-ready, acceptance-pending until live sandbox smoke evidence is recorded.

## Summary contract

`GET /api/campaigns/{campaign}/summary` returns:

- campaign identity and lifecycle fields (`status`, `dispatched_at`, `completed_at`)
- aggregate counters (`recipient_count`, `sent_count`, `failed_count`)
- workspace-scoped counts:
  - `pending_recipients_count`
  - `sent_recipients_count`
  - `failed_recipients_count`

## Error codes

| Code | Status | Meaning |
|---|---|---|
| `campaign.forbidden` | 403 | Role is not Owner/Editor for mutating endpoints |
| `campaign.not_found` | 404 | Campaign does not belong to workspace |
| `campaign.invalid_state` | 409 | Campaign cannot be dispatched in current status |
| `campaign.recipients_invalid` | 422 | One or more recipient IDs are invalid for workspace |
| `template.not_found` | 404 | Template does not exist in workspace |
| `template.version_not_found` | 404 | Requested template version is not published |
| `validation.failed` | 422 | Input validation failed |
