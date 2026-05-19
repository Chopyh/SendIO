# Sequence: Contact Import Processing

This sequence formalizes input ingestion across supported formats and the processing pipeline for normalization, deduplication, and invalid-record reporting.

```mermaid
sequenceDiagram
  autonumber
  actor Operator as Owner/Editor
  participant UI as Import UI
  participant API as Import API
  participant Parser as Format Parser
  participant Normalizer as Normalization Service
  participant Dedup as Deduplication Service
  participant Repo as Contact Repository
  participant Report as Import Report Service

  Operator->>UI: Upload CSV/JSON/semicolon list
  UI->>API: Submit import payload
  API->>Parser: Parse according to detected format
  Parser-->>API: Parsed rows
  API->>Normalizer: Normalize fields (email/name/custom)
  Normalizer-->>API: Canonical rows
  API->>Dedup: Deduplicate case-insensitively
  Dedup-->>API: Unique rows + duplicates
  API->>Repo: Persist valid unique contacts
  Repo-->>API: Persistence result
  API->>Report: Build invalid/duplicate/accepted summary
  Report-->>API: Import report
  API-->>UI: Return processed counts and report link
```

- Parser accepts CSV, JSON, and semicolon-delimited list structures.
- Normalization precedes deduplication to ensure canonical comparison.
- Deduplication is case-insensitive for identity keys such as email.
- Invalid rows are skipped, not blocking valid row ingestion.
- Import report includes accepted, duplicate, and invalid breakdown.
