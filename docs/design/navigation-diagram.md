# Navigation Diagram

This diagram documents the primary application navigation and role-conditioned routes. It makes role permissions explicit to reduce ambiguity in UX and authorization behavior.

```mermaid
flowchart TD
    Login[Login]
    Refresh[Token Refresh]
    WorkspaceSelect[Workspace Selector]
    Dashboard[Workspace Dashboard]
    Contacts[Contact Management]
    ImportWizard[Import Wizard]
    CampaignList[Campaign List]
    CampaignEditor[Campaign Editor]
    CampaignSchedule[Schedule Dialog]
    CampaignMonitor[Campaign Monitoring]
    Reporting[Reporting Dashboard]
    SenderProfile[Sender Profile Settings]
    ExportCSV[Export CSV Action]

    Login --> WorkspaceSelect
    WorkspaceSelect --> Dashboard
    Dashboard --> Contacts
    Dashboard --> CampaignList
    Dashboard --> Reporting
    Dashboard --> SenderProfile

    Contacts --> ImportWizard
    CampaignList --> CampaignEditor
    CampaignEditor --> CampaignSchedule
    CampaignList --> CampaignMonitor
    Reporting --> ExportCSV
    Login -. expired access .-> Refresh
    Refresh --> Dashboard

    OwnerRole{{Owner}}
    EditorRole{{Editor}}
    ViewerRole{{Viewer}}

    OwnerRole --> SenderProfile
    OwnerRole --> ExportCSV
    EditorRole --> ExportCSV
    ViewerRole -. no access .-> ExportCSV
    ViewerRole -. read only .-> Reporting
```

## Design Notes

- Workspace selection is a first-class step because all resources are workspace-scoped.
- `Sender Profile Settings` is reachable only for `Owner`.
- `Export CSV Action` is explicitly denied for `Viewer` while preserving reporting visibility.
