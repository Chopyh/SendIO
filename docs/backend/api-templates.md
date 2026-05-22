# Templates API

This document defines the CRUD endpoints for email template management, including versioning, snapshot layout validation, and publication compliance enforcement.

## Endpoints

| Endpoint | Auth | Workspace header | Purpose |
|---|---|---|---|
| `GET /api/templates` | Yes | Yes | List all templates for the workspace |
| `POST /api/templates` | Yes | Yes | Create a new template (auto-creates v1 draft) |
| `GET /api/templates/{id}` | Yes | Yes | Retrieve a template and its versions |
| `PUT /api/templates/{id}` | Yes | Yes | Update the template name |
| `DELETE /api/templates/{id}` | Yes | Yes | Delete template and all its versions |
| `POST /api/templates/{id}/versions` | Yes | Yes | Create a new draft version from the latest published |
| `PUT /api/templates/{id}/versions/{n}` | Yes | Yes | Update the canonical `content` payload of a draft version |
| `POST /api/templates/{id}/versions/{n}/publish` | Yes | Yes | Publish a draft version |

## Template Lifecycle

```
[Create Template]
      ↓
  [v1: draft]  ←── updateVersion (PUT content)
      ↓
[publishVersion] ── validates: structure + variables + unsubscribe_url
      ↓
  [v1: published] ← IMMUTABLE
      ↓
[createVersion] ── only allowed if latest version is published
      ↓
  [v2: draft] ← copies snapshot from v1
```

## Version Immutability

Published versions CANNOT be modified. Attempting to call `PUT /api/templates/{id}/versions/{n}` on a published version will return:

```json
{
  "error": {
    "code": "template.version_immutable",
    "message": "Published versions are immutable. You must create a new draft version to edit."
  }
}
```

## Canonical Template Content Schema (`content`)

The `content` payload stores the visual layout of an email template. It MUST conform to the following required structure, derived from the `maquetador-emails` project schema. Sections may also include documented optional layout metadata used by the frontend editor to preserve richer layout state across save/load roundtrips.

```json
{
  "sections": [
    {
      "sectionName": "Header Section",
      "styles": {},
      "rowColumnCounts": [2, 1],
      "components": [
        {
          "blockId": 101,
           "blockName": "Welcome Text",
           "type": "text",
           "content": "Hello {{contact.first_name}}!",
           "posX": 0,
           "posY": 0,
           "sizeX": 1,
           "styles": {}
        },
        {
          "blockId": 102,
          "blockName": "Unsubscribe Button",
          "type": "button",
          "url": "{{unsubscribe_url}}",
          "styles": {}
        }
      ]
    }
  ]
}
```

### Optional Section Layout Metadata

| Field | Type | Purpose |
|---|---|---|
| `rowColumnCounts` | `number[]` | Optional per-row column count metadata used by the frontend editor to preserve heterogeneous row layouts. For example, `[2, 1]` means row 0 has two columns and row 1 has one column. |

`rowColumnCounts` is additive metadata. Older snapshots may omit it; the frontend falls back to inferring row shape from component `posX`/`posY` coordinates when it is absent.

### Validation Rules for `content`

| Rule | Constraint |
|---|---|
| Root key | MUST have a `sections` array |
| Each section | MUST have `sectionName` (string) and `components` (array) |
| Optional section metadata | MAY include `rowColumnCounts` (`number[]`) for editor layout roundtrip preservation |
| Each component | MUST have `blockId` (numeric), `blockName` (string), `type` (string) |
| Component layout | MUST have numeric `posX` and `posY`; `sizeX` is numeric when present and normalized to `1` when omitted |
| Component `type` | MUST be one of: `text`, `image`, `button`, `separator` |

### Compatibility

- Canonical API request field is `content`.
- During migration rollout, backend also accepts legacy `snapshot_json` requests.
- Backend storage remains `template_versions.snapshot_json`; API responses include canonical `content` in version resources.

## Publication Compliance Rules

When calling `POST /api/templates/{id}/versions/{n}/publish`, the backend will:

1. **Validate content structure** — reject if malformed.
2. **Extract all `{{variable}}` placeholders** from `content` and `url` fields of every component.
3. **Validate all variables are allowed** — allowed list:
   - `contact.first_name`, `contact.last_name`, `contact.email`, `contact.phone`
   - `workspace.name`
   - `unsubscribe_url`, `system.unsubscribe_url`
4. **Require at least one unsubscribe placeholder** — either `{{unsubscribe_url}}` or `{{system.unsubscribe_url}}` MUST be present.
5. **Store variable usages** in `template_variable_usages` table on successful publication.
6. **Mark version as published** and set `compliance_unsubscribe_url = true`.

## Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `validation.failed` | 422 | Payload or snapshot structure is invalid |
| `template.not_found` | 404 | Template not found in workspace |
| `template.version_not_found` | 404 | Version number not found for template |
| `template.version_immutable` | 409 | Cannot edit a published version |
| `template.draft_exists` | 409 | A draft version already exists for the template |
| `template.already_published` | 409 | Version is already published |
| `template.invalid_placeholders` | 422 | Template contains disallowed variable names |
| `template.missing_unsubscribe` | 422 | Template is missing an unsubscribe placeholder |
