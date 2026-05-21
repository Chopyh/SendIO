# Component Library API

This document defines the CRUD endpoints for managing reusable content blocks (components) in the SendIO component library, scoped per workspace.

## Endpoints

| Endpoint | Auth | Workspace header | Purpose |
|---|---|---|---|
| `GET /api/components` | Yes | Yes | List all components available in the workspace |
| `POST /api/components` | Yes | Yes | Create a new workspace component |
| `GET /api/components/{id}` | Yes | Yes | Retrieve a specific component |
| `PUT /api/components/{id}` | Yes | Yes | Update a workspace component |
| `DELETE /api/components/{id}` | Yes | Yes | Delete a workspace component |

## Component Scopes

| Scope | Description |
|---|---|
| `workspace` | Owned and editable by the workspace. Default scope for new components. |
| `global` | Platform-level components available to all workspaces. Read-only for workspaces. |

## Request Contract (store / update)

```json
{
  "name": "My Heading Block",
  "component_type": "text",
  "schema_json": {
    "default_text": "Your title here",
    "font_size": 24
  },
  "scope": "workspace"
}
```

| Field | Required | Rules |
|---|---|---|
| `name` | Yes | string, max 120 chars |
| `component_type` | Yes | string, max 50 chars (e.g. `text`, `image`, `button`, `separator`) |
| `schema_json` | Yes | JSON object |
| `scope` | No | `workspace` (default) or `global` |

## Response Contract

```json
{
  "data": {
    "id": "01966a12-...",
    "workspace_id": "01966a12-...",
    "scope": "workspace",
    "name": "My Heading Block",
    "component_type": "text",
    "schema_json": { "default_text": "Your title here", "font_size": 24 },
    "created_at": "2026-05-21T09:00:00Z",
    "updated_at": "2026-05-21T09:00:00Z"
  }
}
```

## Workspace Isolation Rules

- Components with `scope: workspace` are **only accessible within the workspace that created them**.
- Components with `scope: global` are **readable by all workspaces** but cannot be edited or deleted by any workspace.
- Attempting to edit or delete a component from another workspace returns `403 Forbidden`.

## Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `validation.failed` | 422 | Request payload is invalid |
| `component.not_found` | 404 | Component ID does not exist |
| `component.forbidden` | 403 | Workspace does not own this component |
