# Variable Catalog API

This document defines the endpoint for retrieving the catalog of allowed template variable placeholders supported by the SendIO platform.

## Endpoint

| Endpoint | Auth | Workspace header | Purpose |
|---|---|---|---|
| `GET /api/variables/catalog` | Yes | Yes | Retrieve the full catalog of allowed variables grouped by category |

## Response Contract

```json
{
  "data": {
    "categories": [
      {
        "name": "Contact",
        "variables": [
          { "name": "contact.first_name", "description": "First name of the recipient" },
          { "name": "contact.last_name", "description": "Last name of the recipient" },
          { "name": "contact.email", "description": "Email address of the recipient" },
          { "name": "contact.phone", "description": "Phone number of the recipient" }
        ]
      },
      {
        "name": "Workspace",
        "variables": [
          { "name": "workspace.name", "description": "Name of the active workspace" }
        ]
      },
      {
        "name": "System",
        "variables": [
          { "name": "unsubscribe_url", "description": "Direct unsubscribe link" },
          { "name": "system.unsubscribe_url", "description": "System-provided unsubscribe link" }
        ]
      }
    ]
  }
}
```

## Placeholder Syntax in Templates

All variables must be inserted using double curly-brace syntax in template `content` or `url` fields:

```
Hello {{contact.first_name}} {{contact.last_name}}!
<a href="{{unsubscribe_url}}">Unsubscribe</a>
```

## Catalog Usage Rules

- Only variables listed in this catalog are allowed in templates.
- Templates containing unlisted variable names will be **rejected at publication time** with error code `template.invalid_placeholders`.
- At least one of `{{unsubscribe_url}}` or `{{system.unsubscribe_url}}` MUST be present in every published template. Violation is rejected with error code `template.missing_unsubscribe`.
