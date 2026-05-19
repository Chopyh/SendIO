# State Diagrams

This section groups state-oriented design artifacts for SendIO. These diagrams formalize lifecycle transitions for campaigns and recipient-level delivery execution.

## Contents

- [Campaign Lifecycle State Diagram](state-campaign-lifecycle.md)
- [Recipient Delivery Lifecycle State Diagram](state-delivery-recipient-lifecycle.md)

## Notes

- Campaign controls include pause, resume, and cancel behavior.
- Delivery states preserve `pending`, `sent`, and `failed` with bounded retry semantics (initial send + up to 2 retries, max 3 attempts).
- Cancel behavior blocks future enqueue while allowing current in-flight batch completion.
