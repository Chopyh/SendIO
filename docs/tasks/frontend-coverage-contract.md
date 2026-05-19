# Task Contract: frontend-coverage-contract

## Purpose

Define the governance contract for frontend test coverage expectations and enforcement boundaries.

## Contract

1. Frontend changes must include test updates when behavior changes.
2. Test scope should prioritize unit/component coverage for changed modules.
3. Coverage expectations must be documented per task, not assumed globally.
4. Contract verification must be lightweight in governance-only batches (no heavy runtime requirements).

## Deliverables (Governance)

- [x] Contract documented.
- [x] Referenced in `docs/tasks/README.md`.

## Future Implementation Hooks

- Define measurable threshold policy (by package/app) in future spec/design work.
- Add CI enforcement once thresholds are agreed.
