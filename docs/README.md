# SendIO Documentation

This directory is the source of truth for project governance, architecture decisions, and implementation tracking.

## Index by Scope

- [Analysis Documentation](analysis/README.md)
- [Design Documentation](design/README.md)
- [Tasks Index](tasks/README.md)
- [Workflow Standards](workflow/standards.md)
- [Docker Mailtrap Environment Contract](devops/docker-mailtrap-env.md)

## Detailed Interaction and State Artifacts

- [Interaction Diagrams Index](analysis/interactions/README.md)
- [State Diagrams Index](design/states/README.md)

## Key Analysis Artifacts

- [Use Case Diagram](analysis/use-case-diagram.md)
- [Domain Class Diagram](analysis/domain-class-diagram.md)
- [Use Case Specifications](analysis/use-case-specifications.md)

## Key Design Artifacts

- [Component Diagram](design/component-diagram.md)
- [Navigation Diagram](design/navigation-diagram.md)
- [Entity Relationship Diagram](design/entity-relationship-diagram.md)
- [Activity Diagram: Campaign Delivery](design/activity-diagram-campaign-delivery.md)

## Key Implementation Artifacts

- [Technology Justification](implementation/technology-justification.md)
- [MVP Implementation Plan](tasks/mvp-implementation-plan.md)
- [Auth and Workspace Bootstrap API (MVP)](backend/api-auth-workspace-bootstrap.md)

## Key Validation Artifacts

- [Mail Delivery Sandbox Validation](validation/mail-delivery-sandbox-validation.md)

## Governance Baseline Change

The initial governance baseline for SDD workflow is tracked with:

- [foundation-governance-baseline](tasks/foundation-governance-baseline.md)
- [frontend-coverage-contract](tasks/frontend-coverage-contract.md)
- [workspace-gitroot-pr-automation-contract](tasks/workspace-gitroot-pr-automation-contract.md)

## Rules

- All implementation work must be represented by a task file under `docs/tasks/`.
- Every new document under `docs/` must be indexed from this file or a section-level index.
- Governance/process changes must not include application code changes unless explicitly planned.
