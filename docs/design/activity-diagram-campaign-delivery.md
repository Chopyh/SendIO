# Activity Diagram - Campaign Delivery Lifecycle

This activity diagram formalizes campaign execution behavior including schedule resolution, queue control, retry logic, and terminal states.

```mermaid
flowchart TD
    A((●)) --> B[Load campaign in scheduled state]
    B --> C{Is schedule due in workspace timezone?}
    C -- No --> D[Wait until due instant]
    D --> C
    C -- Yes --> E[Resolve local time to UTC]
    E --> F{DST invalid local instant?}
    F -- Yes --> G[Move to next valid instant and notify user]
    F -- No --> H[Create pending recipient queue]
    G --> H

    H --> H1[Enqueue recipient jobs in Redis]
    H1 --> H2[Docker queue-worker consumes Redis jobs]

    H2 --> I{Campaign paused?}
    I -- Yes --> J[Hold job processing for pending recipient]
    J --> I
    I -- No --> K{Campaign canceled?}
    K -- Yes --> L[Stop future enqueue]
    L --> M[Finish current in-flight batch]
    M --> N(((Canceled End)))
    K -- No --> O[Claim next pending recipient]

    O --> P[Send email attempt]
    P --> Q{Delivery success?}
    Q -- Yes --> R[Mark recipient sent]
    Q -- No --> S[Increment retry counter]
    S --> T{retry_count <= 2?}
    T -- Yes --> U[Requeue recipient as pending]
    U --> I
    T -- No --> V[Mark recipient failed]

    R --> W{Pending recipients remain?}
    V --> W
    W -- Yes --> I
    W -- No --> X(((Completed End)))
```

## Design Notes

- Cancel semantics intentionally preserve consistency by allowing in-flight batch completion.
- Pause/resume controls affect pending recipient processing performed by the `queue-worker` process.
- Retry policy caps additional attempts at 2 per recipient before terminal failure.
- Redis stores queued delivery jobs; the Docker-managed Laravel `queue-worker` service must be running for dispatched campaigns to leave the queued state and send emails.
