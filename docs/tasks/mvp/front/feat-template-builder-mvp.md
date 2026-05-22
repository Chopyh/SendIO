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

## Approved Phase Plan

- Approved replacement direction: [Template Editor Reference Replacement Design](../../../superpowers/specs/2026-05-21-template-editor-reference-replacement-design.md)
- Current direction: the incremental DnD-first patch approach is superseded by the approved reference-based replacement architecture.
- Design spec: [Template Editor DnD Horizontal Design](../../../superpowers/specs/2026-05-21-template-editor-dnd-horizontal-design.md)
- Phase 1 approved scope: horizontal canvas layout plus DnD C interactions for insert and move within defined drop zones.
- Phase 2 delivered scope: resize behaviors for horizontal cell widths and vertical row heights in the editor UI.

## Direction Clarification

- Historical work from the DnD horizontal plan remains useful as implementation context and validation history.
- New implementation planning and execution must follow the reference replacement design and its slice plan.
- Any backend change discussion must follow the adapter-first policy from the approved replacement design.

## Implementation Notes

- 2026-05-21: Fixed the template editor blank-page runtime failure by providing `TemplateEditorStore` at the template editor page scope. The store is editor-session state, so it must remain feature-scoped instead of becoming a root singleton.
- 2026-05-21: Hardened the template editor page spec so it relies on the component-scoped provider rather than masking the dependency injection configuration.
- 2026-05-21: Fixed template editor spec errors and confirmed targeted templates editor validation passes with `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"`.
- 2026-05-21: Implemented phase 1 horizontal DnD C behavior for palette insert, in-canvas reorder/move, and invalid-drop no-op rules through a feature-scoped interaction contract and deterministic store operations.
- 2026-05-21: Extracted snapshot compatibility mapping into a template-editor adapter to preserve API `snapshot_json` contract across load/save while updating DnD behavior.
- 2026-05-21: Fixed phase 1 DnD occupied-target behavior to deterministically swap blocks when target is occupied (move remains in place when target is empty), preserving same-cell no-op behavior.
- 2026-05-21: Synced template editor block ID generation with loaded snapshots so newly inserted blocks always use IDs above the current canvas max block ID.
- 2026-05-21: Removed unnecessary template optional chaining inside guarded canvas-cell rendering to avoid Angular optional-chaining warnings.
- 2026-05-21: Ported the reference template-builder drag preview behavior more directly by forcing global drag previews, adding per-cell enter restrictions for occupied targets, and removing section overflow clipping so dragged items can leave their source container and drop reliably across canvas cells.
- 2026-05-21: Implemented Slice 1 shell replacement foundation by splitting the template editor into a reference-aligned layout composition (`editor-navbar` + `editor-workspace`) while preserving `TemplateEditorStore` as the feature-scoped system-of-record boundary for load/save/version actions.
- 2026-05-21: Resolved Slice 1 review note for editor i18n by replacing hardcoded copy in `template-editor-page` with translation keys for both English and Spanish (`editor.navigateAwayConfirm`, `editor.templateNotFound`).
- 2026-05-21: Reviewed `@angular/cdk` dependency for Slice 1. Kept `@angular/cdk` at `21.2.0` because the template editor DnD implementation imports `DragDropModule`, `CdkDrag`, `CdkDropList`, and `CdkDragDrop`, and the version remains on the same Angular 21.2 minor line as the rest of the frontend stack.
- 2026-05-21: Implemented Slice 2 DnD/layout parity for reference-aligned section grids by adding row/column insertion operations around occupied blocks (left/right/top/bottom), deterministic row width rebalancing after column insertion, and preserving current SendIO swap semantics for occupied move targets and no-op behavior for invalid/same-target drops.
- 2026-05-21: Fixed Slice 2 persistence roundtrip for heterogeneous row layouts by extending frontend snapshot serialization with optional per-row `rowColumnCounts` metadata and updating deserialization to rebuild row-specific widths without expanding unrelated rows. Legacy snapshots without metadata remain supported.
- 2026-05-21: Replaced destructive section rename behavior (`removeSection` + `addSection`) with in-place `renameSection` to preserve existing rows and blocks.
- 2026-05-21: Implemented Slice 3 block editing parity for MVP block types in `element-inspector`: text (name/content/text color/font size), image (URL + alt text + supported name field), button (label/URL/background/text color/border radius), and separator (border color/width/style). All edits route through `TemplateEditorStore.updateBlock` and preserve `snapshot_json` compatibility.
- 2026-05-21: Added style normalization in template snapshot adapter to keep button/separator legacy style keys interoperable during `load -> edit -> save -> reload` roundtrips.
- 2026-05-21: Migrated editor payload semantics to canonical `maquetador-emails` content shape (`sections[].components[]` with `posX`, `posY`, `sizeX`, `styles`) while keeping current editor route/page as SendIO entrypoint and preserving backend versioning/compliance lifecycle.
- 2026-05-21: Completed visible 3-zone parity on the current editor route (`template-editor-page`) with palette/canvas/inspector shell and validated fallback add behavior when the last canvas cell is occupied.
- 2026-05-22: Fixed draft save payload generation so sidebar-created or removed unplaced components cannot be sent without numeric `posX`/`posY`; save now serializes from the canvas grid and sidebar creation assigns the first available canvas cell.
- 2026-05-21: Added editor-page integration tests for palette rendering, sidebar add-block flow, and canonical `content` save payload assertions.
- 2026-05-21: Closed the remaining parity gap by adding sidebar top content-item controls, click-open create/edit panels, sidebar-driven section creation, and canvas resize handles for both column and row adjustments.
- 2026-05-21: Finalized hard-replace coherence pass by persisting row-height resize metadata (`rowMinHeights`) in canonical `content`, adding stable section identity mapping (`sectionId`) to decouple interactions from mutable labels, and normalizing style keys to canonical camelCase across load/edit/save paths.

## Validation Result

- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` (29 tests passed).
- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` (31 tests passed).
- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` (33 tests passed).
- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` (33 tests passed) after Slice 1 shell replacement foundation.
- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` (33 tests passed) after resolving Slice 1 review notes.
- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` (38 tests passed) after Slice 2 DnD/layout parity updates.
- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` after Slice 2 heterogeneous-row persistence fix and section-rename safety update.
- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` (47 tests passed) after Slice 3 block editing parity and snapshot style normalization updates.
- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` (47 tests passed) after canonical payload migration updates.
- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` after UI parity + fallback add flow + canonical payload save assertions.
- 2026-05-21: PASS `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts"` (54 tests passed) after parity gap closure for sidebar controls and resize behavior.
- 2026-05-21: PASS `npm run test -- --watch=false --include "src/app/features/templates/template-editor/**/*.spec.ts" --include "src/app/features/templates/data-access/services/templates-api.service.spec.ts"` (62 tests passed) after hard-replace coherence pass for style/identity/resize consistency.
- 2026-05-21: BLOCKED (unrelated pre-existing failures) `pnpm --dir "frontend" test --watch=false --include "src/app/features/templates/**/*.spec.ts"` due to `templates-list-page.component.spec.ts` assertions not matching current rendered output.

## Checklist

- [x] Implement MVP template builder views and interactions.
- [x] Integrate component library and variable insertion flow.
- [x] Connect persistence lifecycle (save/load/delete).
- [x] Add tests for editor state and API integration paths.
