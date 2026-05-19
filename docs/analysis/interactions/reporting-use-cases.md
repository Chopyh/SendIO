# Reporting Use Cases

This diagram specifies reporting interactions, including periodic dashboard refresh and role-based export restrictions.

```mermaid
flowchart LR
  Owner([Owner])
  Editor([Editor])
  Viewer([Viewer])

  subgraph SendIOReporting[SendIO Reporting Module]
    UC1((Open Campaign Reporting Dashboard))
    UC2((Auto-refresh Metrics every 60s))
    UC3((Inspect Delivery Breakdown))
    UC4((Export Metrics to CSV))
    UC5((Deny CSV Export for Viewer))
  end

  Owner --> UC1
  Editor --> UC1
  Viewer --> UC1
  UC1 --> UC2
  UC2 --> UC3
  Owner --> UC4
  Editor --> UC4
  Viewer --> UC5
```

- Reporting dashboards are available to all roles for read access.
- Data refresh cadence is fixed at 60 seconds.
- CSV export is restricted to Owner and Editor roles.
- Viewer export attempts are explicitly denied by authorization policy.
