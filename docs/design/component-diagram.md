# Component Diagram

This diagram describes the high-level software decomposition for SendIO. It emphasizes separation between presentation, application orchestration, domain policies, and infrastructure services.

```mermaid
flowchart TB
    subgraph Client[Web Client]
      UIAuth[Auth Module]
      UIWorkspace[Workspace Context Module]
      UIContacts[Contact Import Module]
      UICampaign[Campaign Builder and Controls]
      UIReports[Reporting Dashboard]
      UILocale[i18n Layer en/es]
    end

    subgraph API[Application API]
      AuthAPI[Auth and Session Controller]
      WorkspaceAPI[Workspace Access Controller]
      ContactAPI[Contact Import Controller]
      TemplateAPI[Template and Component Controller]
      CampaignAPI[Campaign Lifecycle Controller]
      ReportAPI[Reporting Controller]
    end

    subgraph Core[Domain and Application Services]
      AuthService[Token and Session Service]
      AccessService[Role Authorization Service]
      ContactService[Import Normalization Service]
      TemplateService[Template Versioning Service]
      ValidationService[Schema and Compliance Validation Service]
      CampaignService[Campaign Scheduling Service]
      QueueService[Queue Orchestration Service]
      DeliveryService[Delivery Execution Service]
      ReportingService[Metrics Aggregation Service]
    end

    subgraph Infra[Infrastructure]
      DB[(Relational Database)]
      Queue[(Message Queue)]
      Mailtrap[Mailtrap Email Sandbox API]
      Cache[(Cache)]
      FileStorage[(Object Storage for Reports)]
    end

    UIAuth --> AuthAPI
    UIWorkspace --> WorkspaceAPI
    UIContacts --> ContactAPI
    UICampaign --> TemplateAPI
    UICampaign --> CampaignAPI
    UIReports --> ReportAPI
    UILocale --> UIAuth
    UILocale --> UIWorkspace
    UILocale --> UIContacts
    UILocale --> UICampaign
    UILocale --> UIReports

    AuthAPI --> AuthService
    WorkspaceAPI --> AccessService
    ContactAPI --> ContactService
    ContactAPI --> AccessService
    TemplateAPI --> TemplateService
    TemplateAPI --> ValidationService
    TemplateAPI --> AccessService
    CampaignAPI --> CampaignService
    CampaignAPI --> ValidationService
    CampaignAPI --> QueueService
    CampaignAPI --> AccessService
    ReportAPI --> ReportingService
    ReportAPI --> AccessService

    AuthService --> DB
    ContactService --> DB
    ContactService --> FileStorage
    TemplateService --> DB
    ValidationService --> DB
    CampaignService --> DB
    CampaignService --> Queue
    QueueService --> Queue
    DeliveryService --> Queue
    DeliveryService --> Mailtrap
    DeliveryService --> DB
    ReportingService --> DB
    ReportingService --> Cache
```

## Design Notes

- Authorization is centralized in `AccessService` to enforce role boundaries consistently.
- CSV export output is produced through reporting and persisted via object storage for controlled access.
- Delivery behavior is intentionally queue-centric to support pause/resume/cancel semantics safely.
- MVP delivery provider is **Mailtrap** (sandbox/demo focus). Production provider abstraction is deferred as future evolution.
- `ValidationService` enforces template schema validation on save/publish and mandatory `unsubscribe_url` compliance on publish and pre-send.
