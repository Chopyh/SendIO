# Reporting and Audit Trail

- **Branch State:** `back/feat-reporting-audit-trail`

## Scope

Implement backend reporting and audit endpoints for campaign execution and key user actions to support MVP monitoring and accountability.

## Deliverables

- Campaign reporting endpoints for delivery metrics.
- Audit trail model and query endpoints for key actions.
- Documentation of auditable events included in MVP.

## Acceptance Criteria

- Delivery metrics are queryable by workspace and campaign.
- Audit entries include actor, action, timestamp, and context.
- Endpoint outputs support frontend campaign monitoring views.

## Dependencies

- `back/feat-campaign-delivery-mailtrap`
- `infra/chore-observability-audit-baseline`

## Validation

- Run backend tests for report aggregation and audit retrieval.
- Validate audit completeness for campaign dispatch and contact import actions.

## Checklist

- [ ] Define reporting and audit event schema.
- [ ] Implement reporting and audit retrieval endpoints.
- [ ] Cover query filters and pagination behavior.
- [ ] Add tests for data integrity and authorization boundaries.
