# Campaign Delivery Use Cases

This diagram defines campaign execution and control behaviors across pre-send checks, queuing, dispatch, retry policy, and operator controls.

```mermaid
flowchart LR
  Owner([Owner])
  Editor([Editor])
  Viewer([Viewer])

  subgraph SendIOCampaign[SendIO Campaign Delivery Module]
    UC1((Prepare Campaign from Template Version))
    UC2((Validate unsubscribe_url Before Send))
    UC3((Enqueue Pending Deliveries))
    UC4((Dispatch via Mailtrap Provider))
    UC5((Track States pending sent failed))
    UC6((Retry Failed Deliveries max 2))
    UC7((Pause Campaign Queue))
    UC8((Resume Campaign Queue))
    UC9((Cancel Future Enqueue and Finish Current Batch))
  end

  Owner --> UC1
  Editor --> UC1
  UC1 --> UC2
  UC2 --> UC3
  UC3 --> UC4
  UC4 --> UC5
  UC5 --> UC6
  Owner --> UC7
  Editor --> UC7
  Owner --> UC8
  Editor --> UC8
  Owner --> UC9
  Editor --> UC9
  Viewer -. no control permission .-> UC7
```

- Campaign execution is blocked unless `unsubscribe_url` is present at pre-send.
- Delivery starts in `pending`, transitions to `sent` or `failed`, and allows up to two retries (maximum three total attempts including the first send).
- Pause and resume operate on pending queue items only.
- Cancel prevents future enqueue and lets the active batch complete safely.
