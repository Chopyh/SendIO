# Campaign Monitoring UI

- **Branch State:** `front/feat-campaign-monitoring`

## Scope

Implement frontend MVP campaign execution and status visibility flow for immediate dispatch.

- Route shells: `/campaigns`, `/campaigns/new`, `/campaigns/:id` under `/app`.
- Recipients mode: manual multi-select and all-contacts mode.
- Single CTA behavior: `Enviar ahora` creates campaign and dispatches immediately.
- Out of scope: scheduling, pause/resume, cancel.

## UI Stack Requirement

- Mandatory: **PrimeNG** components + **TailwindCSS** utilities.

## Deliverables

- Campaign create form with create-then-dispatch sequencing and step-specific error feedback.
- Campaign list/detail MVP shells for status visibility.
- Frontend i18n strings (`en`, `es`) for campaigns flow.
- Unit tests for critical sequencing and failure guards.

## Acceptance Criteria

- Users can trigger campaign sends and observe summary status progression.
- Dispatch is never called when campaign creation fails.
- Dispatch failure after successful creation surfaces a clear error state.
- UI implementation uses PrimeNG components and TailwindCSS utility classes.

## Dependencies

- `back/feat-campaign-delivery-mailtrap`
- `back/feat-reporting-audit-trail`

## Validation

- Run targeted frontend tests for campaigns create/dispatch sequencing.
- Validate list/detail route rendering for MVP status visibility.

## Checklist

- [x] Build campaign send and status monitoring interfaces.
- [x] Add route shells for list/new/detail campaigns pages.
- [x] Add tests for create+dispatch sequencing and failure behavior.
- [x] Document MVP limitation for missing backend campaigns list endpoint.

## Known MVP Limitations

- Backend does not expose `GET /api/campaigns`, so list page uses local browser cache of recently created campaign ids and hydrates summaries via `GET /api/campaigns/{id}/summary`.
- Backend now exposes `GET /api/contacts` in the current branch, so the recipients selector can load workspace contacts for manual and all-contacts modes.
