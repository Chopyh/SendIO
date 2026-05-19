# Domain Class Diagram

This class model describes the conceptual domain entities and key relationships that support SendIO business behavior. It emphasizes workspace scoping, access control, campaign lifecycle, and delivery observability.

```mermaid
classDiagram
    class Account {
      +UUID id
      +string name
      +datetime createdAt
    }

    class Workspace {
      +UUID id
      +string name
      +string timezone
      +string localeDefault
    }

    class User {
      +UUID id
      +string email
      +string fullName
      +bool active
    }

    class WorkspaceMember {
      +UUID id
      +Role role
      +datetime joinedAt
    }

    class SenderProfile {
      +UUID id
      +string displayName
      +string senderEmail
      +datetime updatedAt
    }

    class ComponentLibraryItem {
      +UUID id
      +ComponentScope scope
      +string name
      +string componentType
      +json schemaJson
      +datetime updatedAt
    }

    class Template {
      +UUID id
      +string name
      +datetime createdAt
    }

    class TemplateVersion {
      +UUID id
      +int versionNumber
      +TemplateState state
      +json snapshotJson
      +bool complianceUnsubscribeUrl
      +datetime createdAt
    }

    class TemplateVariableUsage {
      +UUID id
      +string placeholderName
      +VariableCategory category
      +bool required
    }

    class Contact {
      +UUID id
      +string email
      +string normalizedEmail
      +string firstName
      +string lastName
      +datetime createdAt
    }

    class ContactImportJob {
      +UUID id
      +ImportFormat format
      +int rowsRead
      +int insertedCount
      +int duplicateCount
      +int invalidCount
      +datetime executedAt
    }

    class Campaign {
      +UUID id
      +string name
      +CampaignStatus status
      +datetime scheduledAtUtc
      +string scheduledTimezone
      +bool dstAdjusted
      +bool preSendCompliancePassed
    }

    class CampaignRecipient {
      +UUID id
      +DeliveryState state
      +int retryCount
      +datetime lastAttemptAt
    }

    class DeliveryAttempt {
      +UUID id
      +int attemptNumber
      +DeliveryResult result
      +string errorCode
      +datetime attemptedAt
    }

    class Session {
      +UUID id
      +string deviceId
      +datetime accessExpiresAt
      +datetime refreshExpiresAt
      +bool revoked
    }

    class RefreshTokenRotation {
      +UUID id
      +string tokenHash
      +bool reused
      +datetime rotatedAt
    }

    Account "1" --> "1..*" Workspace : owns
    User "1" --> "1..*" WorkspaceMember : has
    Workspace "1" --> "1..*" WorkspaceMember : includes
    Workspace "1" --> "0..1" SenderProfile : configures
    Workspace "1" --> "0..*" ComponentLibraryItem : defines
    Workspace "1" --> "0..*" Template : stores
    Template "1" --> "1..*" TemplateVersion : versions
    TemplateVersion "1" --> "0..*" TemplateVariableUsage : references
    Workspace "1" --> "0..*" Contact : stores
    Workspace "1" --> "0..*" ContactImportJob : logs
    Workspace "1" --> "0..*" Campaign : runs
    TemplateVersion "1" --> "0..*" Campaign : usedBy
    Campaign "1" --> "1..*" CampaignRecipient : targets
    CampaignRecipient "1" --> "0..*" DeliveryAttempt : records
    ContactImportJob "1" --> "0..*" Contact : creates
    User "1" --> "0..*" Session : opens
    Session "1" --> "1..*" RefreshTokenRotation : rotates
```

## Notes

- `WorkspaceMember.role` is constrained to `Owner`, `Editor`, or `Viewer`.
- `CampaignRecipient.state` is constrained to `pending`, `sent`, or `failed` with retry limit enforcement.
- `RefreshTokenRotation.reused = true` signals token reuse detection and session revocation.
- `TemplateVersion` is immutable; each edit creates a new version.
- Variable placeholders follow `{{variable_name}}`, and missing values render as empty string.
- Sender profile in MVP uses format validation only; ownership verification is out of current scope.
