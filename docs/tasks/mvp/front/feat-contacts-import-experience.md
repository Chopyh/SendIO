# Contacts Import Experience

- **Branch State:** `front/feat-contacts-import-experience`

## Scope

Implement frontend contact import experience for file upload, validation feedback, and import result summaries.

## UI Stack Requirement

- Mandatory: **PrimeNG** components + **TailwindCSS** utilities.

## Deliverables

- Contacts import UI flow with upload and processing states.
- Error presentation for schema and data validation failures.
- Import summary view aligned with backend results contract.

## Acceptance Criteria

- Users can upload valid contact files from workspace context.
- Validation errors are explicit and actionable.
- Import result summary clearly reports processed, skipped, and failed rows.
- UI implementation uses PrimeNG components and TailwindCSS utility classes.

## Dependencies

- `back/feat-contacts-import-pipeline`

## Validation

- Run frontend tests for upload flow and error handling.
- Verify data displayed matches backend import summary payload.

## Checklist

- [ ] Build upload and import progress interactions.
- [ ] Implement validation error states and messaging.
- [ ] Render import summary with key metrics.
- [ ] Add tests for success and failure import scenarios.
