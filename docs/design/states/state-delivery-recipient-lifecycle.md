# State: Delivery Recipient Lifecycle

This state machine specifies recipient-level delivery transitions, including retry bounds and terminal outcomes.

```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Sending: Worker dequeues recipient
  Sending --> Sent: Provider accepted delivery
  Sending --> FailedAttempt1: Provider failure (attempt 1)
  FailedAttempt1 --> Pending: Retry enqueue
  Pending --> SendingRetry2: Worker dequeues retry 2
  SendingRetry2 --> Sent: Provider accepted delivery
  SendingRetry2 --> FailedAttempt2: Provider failure (attempt 2)
  FailedAttempt2 --> Pending: Retry enqueue
  Pending --> SendingRetry3: Worker dequeues retry 3
  SendingRetry3 --> Sent: Provider accepted delivery
  SendingRetry3 --> Failed: Provider failure (max retries reached)
  Sent --> [*]
  Failed --> [*]
```

- Initial state is always `Pending` before dispatch.
- Maximum retries are two after initial failure, leading to a final third send attempt.
- Successful provider acceptance yields terminal `Sent`.
- Exceeding retry budget yields terminal `Failed`.
