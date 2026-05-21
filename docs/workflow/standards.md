# Workflow Standards

## Purpose

Define the minimum governance/process baseline for predictable delivery in SendIO.

## Core Standards

1. **Task-driven delivery**
   - Every change starts with a task document under `docs/tasks/`.
   - Work outside task scope is not allowed.

2. **Documentation-first decisions**
   - Before implementation decisions, review existing documentation in `docs/`.
   - If guidance is missing, create or update docs as part of the same change.

3. **Indexing rule**
   - Every new `docs/` file must be referenced by `docs/README.md` or a section index.

4. **Governance-only batches**
   - Governance/process batches must avoid application code changes.
   - Validation should use lightweight checks when runtime-heavy commands are unnecessary.

5. **Traceable completion**
   - A task is complete only when deliverables exist, are indexed, and validation criteria are satisfied.

6. **API URL convention (no URL versioning)**
   - Backend HTTP routes must use `/api/...` paths and MUST NOT include URL versions such as `/api/v1/...`.
   - Versioning strategy, when needed, is handled by compatibility and lifecycle policy, not URI version segments.

7. **Global MVP queue precedence**
   - MVP tasks must be executed in the ordered global queue defined in `docs/tasks/mvp-implementation-plan.md`.
   - Backend/frontend local readiness does not override global queue order.

8. **PrimeNG component selector preference**
   - Frontend templates must use direct PrimeNG `p-*` component selectors whenever available, such as `<p-button>` instead of `pButton` on a native `<button>`.
   - PrimeNG attribute directives are allowed only when the installed PrimeNG version does not provide an equivalent component selector.

9. **Stack-bound implementation**
   - Implementation work must stay inside the stack and file structure defined by the active task/spec and existing project documentation.
   - Do not introduce new runtimes, languages, frameworks, or top-level source trees unless the task/spec explicitly calls for them.
   - Current SendIO runtime stack is Laravel/PHP for backend, Angular/TypeScript for frontend, Docker for operations, and Markdown for documentation.
   - If an implementation appears to require a new stack element, stop and document the decision before writing code.

## Lightweight Validation Guidance

- Verify links and file paths in indexes.
- Verify checkbox state and acceptance criteria alignment in task files.
- Run repository-level quick checks that do not require Docker-heavy services.
