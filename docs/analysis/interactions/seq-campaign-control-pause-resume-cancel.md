# Sequence: Campaign Control (Pause, Resume, Cancel)

This sequence documents operational controls that affect queue progression while preserving in-flight batch consistency.

```mermaid
sequenceDiagram
  autonumber
  actor Operator as Owner/Editor
  participant API as Campaign Control API
  participant Queue as Queue Service
  participant Worker as Delivery Worker
  participant Repo as Campaign Repository

  Operator->>API: Pause campaign
  API->>Queue: Set queue state to paused
  Queue-->>API: Pending dequeue halted
  API->>Repo: Persist campaign paused state
  API-->>Operator: Pause acknowledged

  Operator->>API: Resume campaign
  API->>Queue: Set queue state to active
  Queue-->>API: Pending dequeue resumed
  API->>Repo: Persist campaign active state
  API-->>Operator: Resume acknowledged

  Operator->>API: Cancel campaign
  API->>Queue: Stop future enqueue operations
  API->>Repo: Persist campaign canceling state
  loop For active workers in current batch
    Worker->>Repo: Complete in-flight delivery updates
  end
  API->>Repo: Persist campaign canceled state
  API-->>Operator: Cancel completed
```

- Pause impacts only pending queue consumption, not completed records.
- Resume restarts consumption from remaining pending deliveries.
- Cancel blocks all future enqueue operations.
- Current in-flight batch is allowed to finish before terminal cancel state.
