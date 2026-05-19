# Sequence: Campaign Pre-send and Delivery

This sequence defines campaign execution from pre-send validation through queued dispatch and bounded retry handling with Mailtrap as the MVP provider.

```mermaid
sequenceDiagram
  autonumber
  actor Operator as Owner/Editor
  participant API as Campaign API
  participant Validator as Pre-send Validator
  participant Queue as Queue Service
  participant Worker as Delivery Worker
  participant Provider as Mailtrap Provider
  participant Repo as Delivery Repository

  Operator->>API: Start campaign delivery
  API->>Validator: Validate template version and unsubscribe_url
  alt Validation passed
    Validator-->>API: Ready to send
    API->>Queue: Enqueue recipients as pending
    Queue-->>API: Queue accepted
    loop Until queue exhausted or canceled
      Worker->>Queue: Pull next pending delivery
      Worker->>Provider: Send message
      alt Provider success
        Provider-->>Worker: Accepted
        Worker->>Repo: Mark delivery sent
      else Provider failure
        Provider-->>Worker: Failure reason
        Worker->>Repo: Mark failed attempt
        alt Attempts <= 2
          Worker->>Queue: Requeue delivery as pending
        else Attempts exceeded
          Worker->>Repo: Keep terminal failed state
        end
      end
    end
    API-->>Operator: Campaign execution summary
  else Validation failed
    Validator-->>API: Block send
    API-->>Operator: Pre-send error report
  end
```

- Campaign cannot start without a valid `unsubscribe_url`.
- Initial delivery status is `pending`, then `sent` or `failed`.
- Retry policy is capped at two retries per failed recipient (up to three total attempts including initial send).
- Mailtrap is the single configured provider in the MVP baseline.
