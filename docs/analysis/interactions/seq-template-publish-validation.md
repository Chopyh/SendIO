# Sequence: Template Publish Validation

This sequence describes the publish-time validation path for templates, preserving immutable versioning, component snapshots, variable rules, and unsubscribe enforcement.

```mermaid
sequenceDiagram
  autonumber
  actor Operator as Owner/Editor
  participant UI as Template UI
  participant API as Template API
  participant Snapshot as Snapshot Service
  participant Variable as Variable Resolver
  participant Validator as Publish Validator
  participant Repo as Template Repository

  Operator->>UI: Request publish for draft template
  UI->>API: Publish command with draft id
  API->>Snapshot: Freeze component snapshot
  Snapshot-->>API: Snapshot artifact
  API->>Variable: Validate {{variable_name}} references
  Variable-->>API: Catalog map (Contact/Workspace/System)
  API->>Validator: Check unsubscribe_url presence
  alt unsubscribe_url present
    Validator-->>API: Validation passed
    API->>Repo: Create immutable version with snapshot
    Repo-->>API: Published version id
    API-->>UI: Publish success
  else unsubscribe_url missing
    Validator-->>API: Validation failed
    API-->>UI: Reject publish with error
  end
```

- Publish operation snapshots components and stores an immutable version.
- Variable placeholders must follow `{{variable_name}}` and resolve against supported catalogs.
- Missing runtime variable values are rendered as empty string in delivery context.
- `unsubscribe_url` is mandatory and publish is rejected if absent.
