# Communication: Campaign Delivery Collaboration

This collaboration diagram captures message-level coordination for campaign pre-send checks, queue-driven dispatch, provider feedback, and bounded retries.

```mermaid
flowchart LR
  A["<u>:OwnerOrEditor</u>"]
  B["<u>:CampaignAPI</u>"]
  C["<u>:PreSendValidator</u>"]
  D["<u>:QueueService</u>"]
  E["<u>:DeliveryWorker</u>"]
  F["<u>:MailtrapProvider</u>"]
  G["<u>:DeliveryRepository</u>"]

  A -->|1. Start campaign| B
  B -->|2. Validate template and unsubscribe_url| C
  C -->|3. Validation outcome| B
  B -->|4. Enqueue recipients as pending| D
  D -->|5. Queue accepted| B
  E -->|6. Pull pending delivery| D
  E -->|7. Send email| F
  F -->|8. Success or failure| E
  E -->|9. Update sent or failed| G
  E -->|10. Requeue failed if total attempts < 3| D
  B -->|11. Execution status| A
```

- Delivery collaboration starts only after pre-send checks pass.
- Mailtrap is the sole provider endpoint in MVP flow.
- Failed deliveries can return to queue while total attempts remain below 3 (initial attempt + 2 retries).
- State repository is the source of truth for pending/sent/failed progression.
