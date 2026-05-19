# Template Builder MVP UI

- **Branch State:** `front/feat-template-builder-mvp`

## Scope

Implement frontend MVP template builder flows for composing email templates with reusable components and variable placeholders.

## UI Stack Requirement

- Mandatory: **PrimeNG** components + **TailwindCSS** utilities.

## Deliverables

- Template editor screens with component insertion interactions.
- Variable placeholder management in template editing flow.
- Save/load integration with template, component, and variable APIs.

## Acceptance Criteria

- Users can create and edit templates with reusable components.
- Variables can be inserted and displayed with clear placeholder behavior.
- Editor state can be persisted and restored per workspace.
- UI implementation uses PrimeNG components and TailwindCSS utility classes.

## Dependencies

- `back/feat-templates-components-variables-api`

## Validation

- Run frontend tests for template CRUD interactions.
- Validate template-variable payload compatibility with backend API.

## Checklist

- [ ] Implement MVP template builder views and interactions.
- [ ] Integrate component library and variable insertion flow.
- [ ] Connect persistence lifecycle (save/load/delete).
- [ ] Add tests for editor state and API integration paths.
