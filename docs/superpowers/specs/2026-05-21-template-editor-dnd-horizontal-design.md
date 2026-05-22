# Template Editor DnD Horizontal Design

**Date:** 2026-05-21
**Feature:** `front/feat-template-builder-mvp`
**Status:** Approved for phased implementation

## Context

The Template Editor MVP needs a predictable delivery path for drag-and-drop editing while preserving portability from the existing approach and minimizing rework risk. The approved direction prioritizes a stable horizontal editing experience and defers resize complexity to a second phase.

## Phase Strategy

### Phase 1

- Implement horizontal composition behavior on the canvas.
- Implement DnD C interactions for block insertion and block repositioning in supported drop zones.
- Keep width and resize behavior static and deterministic.

### Phase 2

- Add resize interactions for horizontal blocks.
- Introduce width recalculation and collision/boundary handling for resized items.
- Extend tests and contracts for resize-related edge cases.

## Selected Approach: Clean Portability

The selected approach is clean portability: reuse proven interaction concepts, but implement them through SendIO-native architecture and contracts instead of direct code migration.

Decision rationale:

- Preserves delivery speed by reusing validated interaction patterns.
- Keeps implementation aligned with Angular feature boundaries and current API contracts.
- Reduces long-term maintenance risk by avoiding prototype-level coupling.

## Architecture

Phase 1 architecture remains feature-scoped within `frontend/src/app/features/templates/template-editor/` with clear responsibilities:

- `TemplateEditorPageComponent`: orchestrates editor shell, toolbar, and workspace lifecycle.
- `TemplateEditorStore`: single source of truth for canvas state, selection state, and persistence triggers.
- `BlockPaletteComponent`: exposes draggable block definitions and component-library entries.
- `CanvasSectionComponent` / `CanvasCellComponent`: render horizontal rows and managed drop zones.
- `ElementInspectorComponent`: edits selected block fields without handling layout concerns.

Key architectural boundary:

- DnD behavior mutates placement only.
- Width policy remains fixed in phase 1.

## Data Flow Contracts

Phase 1 data flow contract:

1. Palette drag emits a normalized block payload to the drop target.
2. Drop target resolves destination section and cell metadata.
3. Store applies one atomic placement operation (`insert` or `move`).
4. Store marks editor state as dirty and emits updated snapshot.
5. Save flow serializes snapshot into the existing template API contract.

Phase 1 invariants:

- Every block has one canonical location.
- Horizontal order is deterministic after each drop.
- DnD does not alter width allocation.

## Phase 1 File-by-File Implementation Plan

`frontend/src/app/features/templates/template-editor/template-editor-page.component.ts`

- Wire phase-1 toolbar state and route-level editor lifecycle hooks.
- Keep resize actions absent or explicitly disabled.

`frontend/src/app/features/templates/template-editor/template-editor-page.component.html`

- Compose horizontal editing shell with palette, canvas, and inspector regions.
- Surface explicit phase-1 interaction constraints in UI copy if needed.

`frontend/src/app/features/templates/template-editor/store/template-editor.store.ts`

- Add/adjust deterministic insert and move operations for DnD C.
- Enforce non-resize policy in state transitions.
- Keep serialization contract compatible with templates API payload shape.

`frontend/src/app/features/templates/template-editor/components/block-palette/block-palette.component.ts`

- Emit normalized draggable payloads for supported block types.

`frontend/src/app/features/templates/template-editor/components/canvas-section/canvas-section.component.ts`

- Define section-level horizontal drop zones.
- Delegate placement events to store contract.

`frontend/src/app/features/templates/template-editor/components/canvas-cell/canvas-cell.component.ts`

- Render cell occupancy and drop affordances for insert/move.
- Do not expose resize controls in phase 1.

`frontend/src/app/features/templates/template-editor/components/element-inspector/element-inspector.component.ts`

- Keep content/style field editing independent from layout resizing.

`frontend/src/app/features/templates/template-editor/**/*.spec.ts`

- Add or update tests for insert/move transitions, ordering invariants, and phase-1 constraints.

## Acceptance Criteria

- Users can insert blocks using DnD C into supported horizontal drop zones.
- Users can reorder/move existing blocks using DnD C with deterministic outcomes.
- Save/load preserves phase-1 horizontal layout state without resize metadata drift.
- No resize affordance is available to users in phase 1.
- Automated tests cover successful insert/move flows and rejected unsupported operations.

## Out of Scope

- Interactive resizing of blocks.
- Dynamic width redistribution after user-driven resize.
- Advanced snapping logic tied to resize handles.

## Phase-2 Boundaries

Phase 2 must start only after phase-1 acceptance is complete and verified. Phase-2 work may change layout math and drop conflict handling, but must preserve:

- Existing template snapshot compatibility for phase-1 saved templates.
- Backward compatibility for non-resized layouts.
- Existing content editing and API persistence paths.

## Risks

- DnD event modeling may diverge from expected drop semantics if payload normalization is inconsistent.
- Horizontal ordering bugs can cause non-deterministic rendering across reloads.
- Premature resize hooks in phase 1 can leak unstable behavior into MVP.

## Validation Plan

- Unit tests for store placement operations and ordering invariants.
- Component tests for palette-to-canvas drop and move interactions.
- Integration validation for save/load roundtrip against template API payloads.
- Manual regression check for phase-1 constraints: no resize controls and stable horizontal behavior.
