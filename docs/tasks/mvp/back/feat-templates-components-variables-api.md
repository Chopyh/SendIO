# Templates, Components, and Variables API

- **Branch State:** `back/feat-templates-components-variables-api`

## Scope

Implement backend APIs for template storage, reusable component definitions, and variable management to support drag-and-drop email assembly.

## Deliverables

- Template CRUD API with workspace scoping.
- Component library API for reusable content blocks.
- Variable API for campaign-time substitutions.

## Acceptance Criteria

- Templates, components, and variables are independently manageable.
- APIs enforce workspace ownership and access constraints.
- Data contracts support editor composition workflow.

## Dependencies

- `back/feat-auth-workspace-bootstrap`

## Validation

- Run backend tests for CRUD operations and authorization.
- Validate variable contract compatibility with campaign delivery task.

## Checklist

- [ ] Define API contracts for templates/components/variables.
- [ ] Implement CRUD endpoints and workspace policies.
- [ ] Add validation for component and variable payloads.
- [ ] Provide test coverage for core API lifecycle.
