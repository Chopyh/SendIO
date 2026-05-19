# Campaign Monitoring UI

- **Branch State:** `front/feat-campaign-monitoring`

## Scope

Implement frontend campaign execution and monitoring views, including delivery status, reporting summaries, and audit visibility for MVP operators.

## UI Stack Requirement

- Mandatory: **PrimeNG** components + **TailwindCSS** utilities.

## Deliverables

- Campaign launch and status tracking views.
- Reporting dashboard widgets for core delivery metrics.
- Audit activity timeline for key campaign and contact actions.

## Acceptance Criteria

- Users can trigger campaign sends and observe status progression.
- Reporting metrics align with backend reporting endpoints.
- Audit timeline surfaces the MVP event set with filter support.
- UI implementation uses PrimeNG components and TailwindCSS utility classes.

## Dependencies

- `back/feat-campaign-delivery-mailtrap`
- `back/feat-reporting-audit-trail`

## Validation

- Run frontend tests for campaign status and reporting rendering.
- Validate end-to-end visibility of audit events in workspace context.

## Checklist

- [ ] Build campaign send and status monitoring interfaces.
- [ ] Integrate reporting summaries and refresh behavior.
- [ ] Implement audit timeline with filter controls.
- [ ] Add tests for end-to-end monitoring workflows.
