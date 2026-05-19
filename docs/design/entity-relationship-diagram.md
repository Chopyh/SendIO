# Entity Relationship Diagram

This ERD translates the domain model into a relational perspective suitable for persistence design. It preserves workspace isolation, role assignment, campaign processing, and reporting traceability.

```mermaid
erDiagram
    ACCOUNTS ||--|{ WORKSPACES : owns
    USERS ||--o{ WORKSPACE_MEMBERS : belongs_to
    WORKSPACES ||--o{ WORKSPACE_MEMBERS : has
    WORKSPACES ||--o| SENDER_PROFILES : configures
    WORKSPACES ||--o{ COMPONENT_LIBRARY_ITEMS : defines
    WORKSPACES ||--o{ TEMPLATES : stores
    TEMPLATES ||--|{ TEMPLATE_VERSIONS : versions
    TEMPLATE_VERSIONS ||--o{ TEMPLATE_VARIABLE_USAGES : references
    WORKSPACES ||--o{ CONTACTS : stores
    WORKSPACES ||--o{ CONTACT_IMPORT_JOBS : logs
    WORKSPACES ||--o{ CAMPAIGNS : runs
    TEMPLATE_VERSIONS ||--o{ CAMPAIGNS : used_by
    CAMPAIGNS ||--|{ CAMPAIGN_RECIPIENTS : targets
    CAMPAIGN_RECIPIENTS ||--o{ DELIVERY_ATTEMPTS : records
    USERS ||--o{ SESSIONS : opens
    SESSIONS ||--|{ REFRESH_ROTATIONS : rotates

    ACCOUNTS {
      uuid id PK
      string name
      datetime created_at
    }

    WORKSPACES {
      uuid id PK
      uuid account_id FK
      string name
      string timezone
      string locale_default
      datetime created_at
    }

    USERS {
      uuid id PK
      string email
      string full_name
      bool active
      datetime created_at
    }

    WORKSPACE_MEMBERS {
      uuid id PK
      uuid workspace_id FK
      uuid user_id FK
      string role
      datetime joined_at
    }

    SENDER_PROFILES {
      uuid id PK
      uuid workspace_id FK
      string display_name
      string sender_email
      datetime updated_at
    }

    COMPONENT_LIBRARY_ITEMS {
      uuid id PK
      uuid workspace_id FK
      string scope
      string name
      string component_type
      text schema_json
      datetime updated_at
    }

    TEMPLATES {
      uuid id PK
      uuid workspace_id FK
      string name
      datetime created_at
    }

    TEMPLATE_VERSIONS {
      uuid id PK
      uuid template_id FK
      int version_number
      string state
      text snapshot_json
      bool compliance_unsubscribe_url
      datetime created_at
    }

    TEMPLATE_VARIABLE_USAGES {
      uuid id PK
      uuid template_version_id FK
      string placeholder_name
      string category
      bool required
    }

    CONTACTS {
      uuid id PK
      uuid workspace_id FK
      string email
      string normalized_email
      string first_name
      string last_name
      datetime created_at
    }

    CONTACT_IMPORT_JOBS {
      uuid id PK
      uuid workspace_id FK
      string format
      int rows_read
      int inserted_count
      int duplicate_count
      int invalid_count
      datetime executed_at
    }

    CAMPAIGNS {
      uuid id PK
      uuid workspace_id FK
      uuid template_version_id FK
      string name
      string status
      datetime scheduled_at_utc
      string scheduled_timezone
      bool dst_adjusted
      bool pre_send_compliance_passed
      datetime created_at
    }

    CAMPAIGN_RECIPIENTS {
      uuid id PK
      uuid campaign_id FK
      uuid contact_id FK
      string delivery_state
      int retry_count
      datetime last_attempt_at
    }

    DELIVERY_ATTEMPTS {
      uuid id PK
      uuid campaign_recipient_id FK
      int attempt_number
      string result
      string error_code
      datetime attempted_at
    }

    SESSIONS {
      uuid id PK
      uuid user_id FK
      string device_id
      datetime access_expires_at
      datetime refresh_expires_at
      bool revoked
      datetime created_at
    }

    REFRESH_ROTATIONS {
      uuid id PK
      uuid session_id FK
      string token_hash
      bool reused
      datetime rotated_at
    }
```

## Design Notes

- `WORKSPACE_MEMBERS.role` must be constrained to `Owner`, `Editor`, or `Viewer`.
- `CONTACTS.normalized_email` supports case-insensitive deduplication.
- `CAMPAIGN_RECIPIENTS.retry_count` enforces retry maximum of 2.
- `REFRESH_ROTATIONS.reused` is the audit trigger for forced session revocation.
- `TEMPLATE_VERSIONS` are immutable snapshots; campaigns reference a fixed version.
- `TEMPLATE_VARIABLE_USAGES.placeholder_name` follows `{{variable_name}}` semantics and allowed categories: Contact, Workspace, System.
- Missing variable values render as empty string at compile time.
- Sender email is format-validated only in MVP (ownership verification deferred).
