# Campaign Delivery Through Mailtrap

- **Branch State:** `back/feat-campaign-delivery-mailtrap`

## Scope

Implement MVP campaign delivery flow that resolves templates and variables, targets imported contacts, and delivers through Mailtrap sandbox transport.

## Deliverables

- Campaign scheduling/dispatch endpoint for MVP delivery.
- Delivery orchestration integrating templates, variables, and contact audiences.
- Delivery status model with success/failure tracking.

## Acceptance Criteria

- Campaign requests can be processed end to end against Mailtrap.
- Delivery outcomes are captured per campaign execution.
- Failure modes return actionable error details.

## Dependencies

- `back/feat-contacts-import-pipeline`
- `back/feat-templates-components-variables-api`
- `infra/chore-docker-mailtrap-env`

## Validation

- Execute integration tests for campaign dispatch lifecycle.
- Verify expected messages appear in Mailtrap inbox and map to status records.

## Checklist

- [ ] Implement campaign dispatch API contract.
- [ ] Integrate contact audience, templates, and variables.
- [ ] Persist and expose delivery status transitions.
- [ ] Validate Mailtrap-backed sandbox delivery flow.
