# Use Case Diagram

This diagram represents the main interactions between platform actors and the SendIO system boundary. It captures authorization constraints, campaign operations, and reporting responsibilities under the current requirements baseline.

```mermaid
flowchart LR
    owner[Owner]
    editor[Editor]
    viewer[Viewer]

    subgraph sendio[SendIO Platform]
      ucAuth((Authenticate Session))
      ucWorkspace((Switch Workspace))
      ucImport((Import Contacts))
      ucReportImport((Generate Import Report))
      ucManageSender((Manage Sender Profile))
      ucCreateCampaign((Create or Edit Campaign))
      ucTemplatePublish((Publish Template Version))
      ucComponentManage((Manage Components and Variables))
      ucSchedule((Schedule Campaign by Workspace Timezone))
      ucPause((Pause Campaign))
      ucResume((Resume Campaign))
      ucCancel((Cancel Campaign))
      ucMonitor((Monitor Delivery Metrics))
      ucExport((Export Metrics to CSV))
    end

    owner --> ucAuth
    owner --> ucWorkspace
    owner --> ucImport
    owner --> ucManageSender
    owner --> ucCreateCampaign
    owner --> ucTemplatePublish
    owner --> ucComponentManage
    owner --> ucSchedule
    owner --> ucPause
    owner --> ucResume
    owner --> ucCancel
    owner --> ucMonitor
    owner --> ucExport

    editor --> ucAuth
    editor --> ucWorkspace
    editor --> ucImport
    editor --> ucCreateCampaign
    editor --> ucTemplatePublish
    editor --> ucComponentManage
    editor --> ucSchedule
    editor --> ucPause
    editor --> ucResume
    editor --> ucCancel
    editor --> ucMonitor
    editor --> ucExport

    viewer --> ucAuth
    viewer --> ucWorkspace
    viewer --> ucMonitor

    ucImport -. includes .-> ucReportImport
```

## Notes

- `Manage Sender Profile` is reserved to `Owner` as an explicit governance rule.
- `Export Metrics to CSV` is available to `Owner` and `Editor`, but not `Viewer`.
- `Import Contacts` includes normalization and validation behavior defined in the use-case specifications.
- `Publish Template Version` includes schema validation and mandatory `unsubscribe_url` compliance checks.
