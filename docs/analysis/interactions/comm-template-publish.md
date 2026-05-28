# Communication: Template Publish Collaboration

This collaboration diagram expresses the ordered message exchange for template publication with mandatory unsubscribe validation and immutable snapshot persistence.

```mermaid
flowchart LR
  A["<u>:OwnerOrEditor</u>"]
  B["<u>:TemplateUI</u>"]
  C["<u>:TemplateAPI</u>"]
  D["<u>:SnapshotService</u>"]
  E["<u>:VariableResolver</u>"]
  F["<u>:PublishValidator</u>"]
  G["<u>:TemplateRepository</u>"]

  A -->|1. Request publish| B
  B -->|2. Send publish command| C
  C -->|3. Freeze components| D
  D -->|4. Return snapshot| C
  C -->|5. Resolve placeholders| E
  E -->|6. Return catalog mapping| C
  C -->|7. Validate unsubscribe_url| F
  F -->|8. Validation result| C
  C -->|9. Persist immutable version| G
  G -->|10. Published version id| C
  C -->|11. Publish response| B
  B -->|12. User feedback| A
```

- Message ordering enforces validation before repository persistence.
- Catalog resolution step anchors variable semantics to Contact, Workspace, and System sources.
- Missing variable values are handled at render time as empty string.
- Publish is rejected whenever `unsubscribe_url` validation fails.
