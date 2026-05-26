# Contact Import Use Cases

This diagram models contact ingestion behavior for supported formats and the mandatory normalization, deduplication, and invalid-record reporting rules.

```mermaid
flowchart LR
  Owner[Owner]
  Editor[Editor]
  Viewer[Viewer]

  subgraph SendIOImport[SendIO Contact Import Module]
    UC1([Upload Import File or List])
    UC2([Parse CSV JSON Semicolon List])
    UC3([Normalize Contact Fields])
    UC4([Case-insensitive Deduplication])
    UC5([Skip Invalid Records])
    UC6([Generate Import Report])
  end

  Owner --> UC1
  Editor --> UC1
  UC1 --> UC2
  UC2 --> UC3
  UC3 --> UC4
  UC4 --> UC5
  UC5 --> UC6
  Viewer -. no permission .-> UC1
```

- Supported input shapes are CSV, JSON, and semicolon-delimited list payloads.
- Normalization is applied before deduplication to reduce canonical-form mismatches.
- Deduplication is case-insensitive, preserving a single canonical contact identity.
- Invalid rows are skipped and surfaced in an explicit import report.
