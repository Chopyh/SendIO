# State: Campaign Lifecycle

This state machine models campaign orchestration from draft preparation to terminal completion or cancellation under queue-control constraints.

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> ValidatingPreSend: Start campaign
  ValidatingPreSend --> Draft: Validation failed
  ValidatingPreSend --> Queued: Validation passed
  Queued --> Running: Worker consumption starts
  Running --> Paused: Pause command
  Paused --> Running: Resume command
  Running --> Canceling: Cancel command
  Queued --> Canceling: Cancel command
  Canceling --> Canceled: Current batch finished
  Running --> Completed: Queue exhausted
  Completed --> [*]
  Canceled --> [*]
```

- Pre-send validation includes mandatory `unsubscribe_url` verification.
- Pause and resume act on queue progression, preserving accumulated delivery history.
- Cancel transitions to an intermediate `Canceling` state to finish in-flight work safely.
- Campaign reaches `Completed` only after queue exhaustion with no pending recipients.
