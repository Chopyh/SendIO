# Auth and Session Use Cases

This diagram defines role-independent authentication and session control behaviors, emphasizing JWT issuance, refresh rotation, and defensive revocation when refresh reuse is detected.

```mermaid
flowchart LR
  Owner([Owner])
  Editor([Editor])
  Viewer([Viewer])

  subgraph SendIOAuth[SendIO Auth and Session Module]
    UC1((Authenticate Credentials))
    UC2((Issue Access Token 1h))
    UC3((Issue Refresh Token 1 month))
    UC4((Refresh Session with Rotation))
    UC5((Detect Refresh Reuse))
    UC6((Revoke Session and Device))
    UC7((Logout Current Session))
  end

  Owner --> UC1
  Editor --> UC1
  Viewer --> UC1

  UC1 --> UC2
  UC1 --> UC3
  UC4 --> UC2
  UC4 --> UC3
  UC4 --> UC5
  UC5 --> UC6
  Owner --> UC7
  Editor --> UC7
  Viewer --> UC7
```

- Access tokens are short-lived (1 hour) and are re-issued through successful refresh.
- Refresh tokens live for 1 month and are rotated on every refresh operation.
- Reuse detection on a rotated refresh token triggers immediate session and device revocation.
- Session controls apply uniformly to Owner, Editor, and Viewer.
