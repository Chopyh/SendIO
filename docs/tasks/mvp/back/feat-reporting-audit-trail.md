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

- [x] Define reporting and audit event schema.
- [x] Implement reporting and audit retrieval endpoints.
- [x] Cover query filters and pagination behavior.
- [x] Add tests for data integrity and authorization boundaries.

## Implementation Notes

- Added `audit_events` relational table with nullable `actor_user_id` for system/queue events.
- Implemented `GET /api/reports/campaigns` and `GET /api/reports/campaigns/{campaign}/metrics`.
- Implemented `GET /api/audit/events` with filters (`event_key`, `actor_user_id`, `campaign_id`, `from`, `to`) and pagination.
- Emitted audit events for campaign dispatch request/queue transitions, contacts import completion/schema rejection, and template version publish.
- Enforced context whitelist in audit payloads: IDs, counts, and status fields only.
