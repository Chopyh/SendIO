# Sequence: Reporting Refresh and Export

This sequence models reporting reads with periodic refresh and role-aware CSV export authorization.

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as Reporting UI
  participant API as Reporting API
  participant Auth as Authorization Service
  participant Metrics as Metrics Service
  participant Export as CSV Export Service

  User->>UI: Open campaign reporting
  UI->>API: Request initial metrics
  API->>Metrics: Aggregate latest campaign metrics
  Metrics-->>API: Metrics snapshot
  API-->>UI: Render dashboard

  loop Every 60 seconds
    UI->>API: Refresh metrics request
    API->>Metrics: Recompute/lookup metrics
    Metrics-->>API: Updated snapshot
    API-->>UI: Refresh dashboard values
  end

  User->>UI: Request CSV export
  UI->>API: Export command
  API->>Auth: Authorize export by role
  alt Role is Owner or Editor
    Auth-->>API: Allowed
    API->>Export: Build CSV artifact
    Export-->>API: File reference
    API-->>UI: Deliver download
  else Role is Viewer
    Auth-->>API: Denied
    API-->>UI: Return permission error
  end
```

- Dashboard refresh interval is fixed to 60 seconds.
- Export path always checks role authorization before generating files.
- Viewer role can view metrics but cannot export CSV.
- Owner and Editor can export full reporting snapshots.
