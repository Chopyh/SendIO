# Communication: Auth Refresh Reuse Collaboration

This collaboration diagram details refresh-token rotation interaction and the defensive branch that revokes sessions when token reuse is detected.

```mermaid
flowchart LR
  A[User]
  B[Auth API]
  C[Token Service]
  D[Session Store]
  E[Session Service]

  A -->|1. Login request| B
  B -->|2. Validate identity| E
  E -->|3. Identity result| B
  B -->|4. Issue access and refresh| C
  C -->|5. Token pair| B
  B -->|6. Store refresh fingerprint| D
  B -->|7. Return tokens| A

  A -->|8. Refresh request| B
  B -->|9. Verify refresh status| D
  D -->|10. Active or reused| B
  B -->|11. Rotate token if active| C
  C -->|12. New token pair| B
  B -->|13. Revoke previous token| D
  B -->|14. Revoke session/device if reused| D
  B -->|15. Return tokens or force re-login| A
```

- Rotation and revocation are persisted through refresh fingerprint tracking.
- Access lifetime remains 1 hour and refresh lifetime remains 1 month.
- Reuse branch revokes session and device context to contain compromise.
- Collaboration path is role-agnostic for authenticated users.
