# Campaign Delivery Through Mailtrap

- **Branch State:** `back/feat-campaign-delivery-mailtrap`
- **Task State:** Implementation slice complete; acceptance pending runtime Mailtrap inbox smoke evidence.

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
- Verify expected messages appear in Mailtrap inbox and map to status records (manual smoke validation, pending).
- Validate automated delivery behavior with fake mail transport in test suite.
- Runtime evidence log and execution procedure: `docs/validation/mail-delivery-sandbox-validation.md`.

## Checklist

- [x] Implement campaign dispatch API contract.
- [x] Integrate contact audience, templates, and variables.
- [x] Persist and expose delivery status transitions.
- [x] Validate automated delivery flow with fake mail transport tests.
- [ ] Validate real Mailtrap sandbox inbox smoke flow (manual verification with runtime Mailtrap access).

## Readiness Statement

- This branch is implementation-ready for `MVP-BACK-004` (code and automated coverage are complete for the defined MVP slice).
- Full acceptance is still pending one manual runtime step: live Mailtrap sandbox inbox smoke execution and evidence capture.
- Until that runtime evidence exists, this task must remain open and must not be marked fully validated.

## Runtime Progress — 2026-05-27

- Redis-backed Docker `queue-worker` processed a real campaign recipient job successfully.
- Delivery persistence showed campaign `completed`, `sent_count=1`, `failed_count=0`, recipient `sent`, and one delivery attempt.
- Mailtrap SMTP connectivity succeeded from the container, but full inbox evidence remains pending because Mailtrap inbox API credentials are not configured in the runtime.
- The acceptance checklist remains open until Mailtrap UI/API capture is recorded in `docs/validation/mail-delivery-sandbox-validation.md`.

## Runtime Findings — 2026-05-28

- Mailtrap inbox capture confirmed that campaign messages reach the sandbox inbox.
- The delivered body exposed two backend delivery defects that must be closed before full acceptance:
  - Email HTML was rendered as a fragment when the template only contained the unsubscribe button/link.
  - A 21-recipient campaign sent 3 messages and marked 18 recipients failed because Mailtrap returned `550 5.7.0 Too many emails per second`.
- The HTML renderer now wraps campaign content in a complete email document before calling `Mail::html`.
- The rate-limit finding remains a follow-up delivery-throttling concern for Mailtrap sandbox validation.

## Slice Progress — 2026-05-22

- Added backend campaign delivery foundation with `campaigns`, `campaign_recipients`, and `delivery_attempts` tables (UUID primary/foreign keys, workspace scope).
- Added MVP endpoints:
  - `POST /api/campaigns`
  - `POST /api/campaigns/{campaign}/dispatch`
  - `GET /api/campaigns/{campaign}/summary`
- Enforced Owner/Editor authorization for create and dispatch operations.
- Implemented queue-first recipient delivery job with retry metadata and attempt ledger:
  - max 2 retries / 3 total attempts.
  - per-recipient state transitions and campaign aggregate counters.
  - stale `sending` recovery via 15-minute lease timeout on `last_attempt_at` to avoid deadlocks after worker crashes.
- Added feature coverage for success, failure/retry behavior, workspace isolation, and role authorization.

## Follow-up Progress — 2026-05-22

- Added missing workspace-scoped contacts read endpoint used by campaigns and contacts UI:
  - `GET /api/contacts`
- Added frontend contacts listing page and navigation route:
  - `/app/contacts`
- Updated campaigns new form control layout so labels stay above controls consistently.
- Removed prior frontend limitation dependency on a missing contacts endpoint by delivering `/api/contacts` in this branch.
