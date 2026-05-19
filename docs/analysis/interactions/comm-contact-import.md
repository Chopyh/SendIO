# Communication: Contact Import Collaboration

This collaboration diagram shows message ordering for multi-format contact import, normalization, deduplication, persistence, and reporting.

```mermaid
flowchart LR
  A[Owner or Editor]
  B[Import UI]
  C[Import API]
  D[Format Parser]
  E[Normalization Service]
  F[Deduplication Service]
  G[Contact Repository]
  H[Import Report Service]

  A -->|1. Upload source file or list| B
  B -->|2. Submit payload| C
  C -->|3. Parse CSV JSON or semicolon list| D
  D -->|4. Parsed rows| C
  C -->|5. Normalize fields| E
  E -->|6. Canonical rows| C
  C -->|7. Deduplicate case-insensitively| F
  F -->|8. Unique and duplicate sets| C
  C -->|9. Persist valid unique contacts| G
  G -->|10. Storage outcome| C
  C -->|11. Build import report| H
  H -->|12. Report summary| C
  C -->|13. Return results| B
  B -->|14. Present report| A
```

- Collaboration covers the full ingestion path from parsing to operator-visible report.
- Invalid rows are skipped and recorded without aborting accepted rows.
- Deduplication operates in case-insensitive mode by design.
- The report provides operational traceability for accepted, duplicate, and invalid records.
