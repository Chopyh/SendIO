# Contacts Import Pipeline API (MVP)

This contract defines MVP-BACK-002 for CSV-based contact import with workspace-scoped deduplication and summary feedback.

## Quick path

1. Authenticate with `POST /api/auth/login` and include `Authorization: Bearer <access_token>`.
2. Send `POST /api/contacts/import` with `multipart/form-data` and `file` (CSV).
3. Include `X-Workspace-Id: <workspace_id>` to enforce workspace isolation.

## Endpoint

| Endpoint | Auth | Workspace header | Purpose |
|---|---|---|---|
| `POST /api/contacts/import` | Yes | Yes | Import contacts from CSV into selected workspace |

## Input contract

### Request content type

- `multipart/form-data`

### Required file field

- `file`: CSV file

### Required CSV header order

```text
email,first_name,last_name,phone
```

Rows are processed after the header with these rules:

- `email`: required, valid email format.
- `first_name`: optional.
- `last_name`: optional.
- `phone`: optional.

## Deduplication behavior (MVP)

| Rule | Decision |
|---|---|
| Dedup scope | Per workspace only |
| Identity key | Lowercased email (`email_normalized`) |
| Existing match in same workspace | Skip row and report in `details.skipped` |
| Same email in different workspace | Allowed and processed |

## Response summary contract

```json
{
  "data": {
    "summary": {
      "processed": 2,
      "skipped": 1,
      "failed": 1,
      "details": {
        "skipped": [
          {
            "row": 3,
            "email": "ana@example.com",
            "reason": "Duplicate email in workspace."
          }
        ],
        "failed": [
          {
            "row": 4,
            "email": "invalid-email",
            "reason": "Invalid email format."
          }
        ]
      }
    }
  }
}
```

## Error handling

Standard API errors continue using the shared contract:

- `validation.failed` (422) when `file` is missing or invalid.
- Workspace and auth guards are enforced by existing middleware (`auth.unauthenticated`, `workspace.required`, `workspace.forbidden`).
