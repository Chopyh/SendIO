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

## Lightweight Validation Guidance

- Verify links and file paths in indexes.
- Verify checkbox state and acceptance criteria alignment in task files.
- Run repository-level quick checks that do not require Docker-heavy services.
