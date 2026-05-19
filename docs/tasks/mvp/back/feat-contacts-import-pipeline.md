# Contacts Import Pipeline

- **Branch State:** `back/feat-contacts-import-pipeline`

## Scope

Implement backend contact import pipeline with validation, deduplication strategy, and workspace-bound persistence for CSV-driven onboarding.

## Deliverables

- Import endpoint and processing service.
- Validation and deduplication rules for contact records.
- Import result summary contract (processed, skipped, failed).

## Acceptance Criteria

- Import accepts expected file format and rejects invalid schema.
- Duplicate contacts are handled predictably per workspace.
- Import summary supports frontend progress and user feedback.

## Dependencies

- `back/feat-auth-workspace-bootstrap`

## Validation

- Run backend tests for valid, invalid, and duplicate import cases.
- Validate workspace isolation for imported contacts.

## Checklist

- [ ] Define import input contract and validation rules.
- [ ] Implement deduplication behavior for MVP.
- [ ] Add import result summary payload.
- [ ] Cover edge cases with automated tests.
