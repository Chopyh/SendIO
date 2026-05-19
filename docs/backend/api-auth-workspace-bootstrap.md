# Auth and Workspace Bootstrap API (MVP)

This contract defines the minimum backend flow for JWT auth and workspace context enforcement in MVP-BACK-001.

## Quick path

1. `POST /api/auth/login` with `email` and `password`.
2. Use `Authorization: Bearer <access_token>` for protected endpoints.
3. For workspace-scoped endpoints, also send `X-Workspace-Id: <workspace_id>`.

## Endpoints

| Endpoint | Auth | Workspace header | Purpose |
|---|---|---|---|
| `POST /api/auth/login` | No | No | Exchange credentials for JWT access token |
| `POST /api/auth/refresh` | Yes | No | Rotate access token |
| `GET /api/auth/me` | Yes | No | Retrieve current user and workspace memberships |
| `POST /api/workspaces/bootstrap` | Yes | No | Create first account/workspace and owner membership |
| `GET /api/workspaces/current` | Yes | Yes | Validate workspace context and membership |

## Request/response contracts

### Login request

```json
{
  "email": "owner@example.com",
  "password": "secret123"
}
```

### Token success response

```json
{
  "data": {
    "access_token": "<jwt>",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_ttl": 1209600
  }
}
```

### Bootstrap request

```json
{
  "account_name": "Acme Account",
  "workspace_name": "Acme Main",
  "timezone": "UTC",
  "locale_default": "en"
}
```

## Standardized errors

```json
{
  "error": {
    "code": "workspace.required",
    "message": "Workspace context is required.",
    "details": {
      "header": "X-Workspace-Id"
    }
  }
}
```

Codes currently used:

- `auth.unauthenticated` (401)
- `auth.invalid_credentials` (401)
- `auth.invalid_token` (401)
- `validation.failed` (422)
- `workspace.required` (400)
- `workspace.forbidden` (403)
- `workspace.bootstrap_conflict` (409)

## Constraints

- Workspace-scoped routes MUST include `X-Workspace-Id`.
- Access is denied when the authenticated user is not a member of the selected workspace.
- Bootstrap is one-time per user in MVP (users with memberships get conflict response).
- Supported bootstrap locales are `en` and `es`.
