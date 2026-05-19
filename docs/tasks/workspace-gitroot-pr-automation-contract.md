# Task Contract: workspace-gitroot-pr-automation-contract

## Purpose

Define governance for repository-root workspace behavior and PR automation expectations.

## Contract

1. Automation scripts must resolve paths from repository root consistently.
2. Workspace-scoped tooling must avoid implicit directory assumptions.
3. PR automation must include documentation checks for `docs/` indexing compliance.
4. Automation policy updates require corresponding updates to governance docs.

## Deliverables (Governance)

- [x] Contract documented.
- [x] Referenced in `docs/tasks/README.md`.

## Future Implementation Hooks

- Introduce CI job that validates docs index integrity.
- Standardize root-resolution helper usage across scripts.
