# Sequence: Authentication, Refresh, and Rotation

This sequence defines the secure token lifecycle from login to rotated refresh handling, including defensive revocation on refresh token reuse.

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant API as Auth API
  participant Session as Session Service
  participant Token as Token Service
  participant Store as Session Store

  User->>API: Submit credentials
  API->>Session: Validate identity and role
  Session-->>API: Identity verified
  API->>Token: Generate access(1h) and refresh(1 month)
  Token-->>API: Token pair
  API->>Store: Persist refresh token fingerprint by device
  API-->>User: Return access + refresh

  User->>API: Refresh with current refresh token
  API->>Store: Check token fingerprint status
  alt Valid and active
    API->>Token: Rotate refresh and issue new access
    Token-->>API: New token pair
    API->>Store: Revoke previous refresh, persist new fingerprint
    API-->>User: Return rotated tokens
  else Reuse detected
    API->>Store: Revoke session and device chain
    API-->>User: Reject refresh and force re-login
  end
```

- Access token lifetime is fixed to 1 hour.
- Refresh token lifetime is fixed to 1 month.
- Every refresh rotates token material and revokes predecessor token.
- Reuse of a rotated refresh token triggers immediate revocation of the session/device.
