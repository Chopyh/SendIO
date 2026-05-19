# Interaction Diagrams

This section consolidates detailed interaction-focused analysis artifacts for SendIO. It complements baseline analysis by documenting role-scoped use cases, sequence behavior, and collaboration message exchange for critical product flows.

## Use Case Diagrams by Module

- [Auth and Session Use Cases](auth-session-use-cases.md)
- [Contact Import Use Cases](contact-import-use-cases.md)
- [Template Lifecycle Use Cases](template-lifecycle-use-cases.md)
- [Campaign Delivery Use Cases](campaign-delivery-use-cases.md)
- [Reporting Use Cases](reporting-use-cases.md)

## Sequence Diagrams

- [Authentication: Login, Refresh, Rotation](seq-auth-login-refresh-rotation.md)
- [Contact Import Processing](seq-contact-import-processing.md)
- [Template Publish Validation](seq-template-publish-validation.md)
- [Campaign Pre-send and Delivery](seq-campaign-pre-send-and-delivery.md)
- [Campaign Control: Pause, Resume, Cancel](seq-campaign-control-pause-resume-cancel.md)
- [Reporting Refresh and Export](seq-reporting-refresh-and-export.md)

## Communication Diagrams

- [Template Publish Collaboration](comm-template-publish.md)
- [Campaign Delivery Collaboration](comm-campaign-delivery.md)
- [Auth Refresh Reuse Collaboration](comm-auth-refresh-reuse.md)
- [Contact Import Collaboration](comm-contact-import.md)

## Notes

- Role model is preserved as Owner, Editor, and Viewer.
- Security model is preserved as JWT access (1 hour) and refresh (1 month) with rotation and reuse revocation.
- Delivery and reporting constraints follow the current MVP baseline (Mailtrap provider, retry ceiling, role-restricted exports).
