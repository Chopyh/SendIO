# Template Lifecycle Use Cases

This diagram captures template authoring and publish controls, including immutable versioning, component snapshots, variable catalog resolution, and unsubscribe enforcement.

```mermaid
flowchart LR
  Owner([Owner])
  Editor([Editor])
  Viewer([Viewer])

  subgraph SendIOTemplate[SendIO Template Lifecycle Module]
    UC1((Create or Edit Draft Template))
    UC2((Capture Component Snapshot))
    UC3((Resolve Variables from Catalogs))
    UC4((Substitute Missing Variable with Empty String))
    UC5((Validate unsubscribe_url Presence))
    UC6((Publish Immutable Template Version))
    UC7((View Published Versions))
  end

  Owner --> UC1
  Editor --> UC1
  UC1 --> UC2
  UC1 --> UC3
  UC3 --> UC4
  UC1 --> UC5
  UC5 --> UC6
  Owner --> UC7
  Editor --> UC7
  Viewer --> UC7
```

- Published versions are immutable and keep their exact component snapshot.
- Variable placeholders use `{{variable_name}}` and map to Contact, Workspace, and System catalogs.
- Missing variable values are replaced with empty string to keep rendering deterministic.
- `unsubscribe_url` is mandatory at publish time and blocks publication if missing.
