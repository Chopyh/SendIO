# Template Editor Reference Replacement Design

**Date:** 2026-05-21
**Feature:** `front/feat-template-builder-mvp`
**Status:** Approved for implementation

## Decision Summary

SendIO replaces the current template editor page, editor subcomponents, and interaction logic with the proven editor implementation pattern from `maquetador-emails`, while keeping SendIO as the system of record for data contracts, persistence, versioning, styling system, and i18n behavior.

## Why Previous Patch Approach Is Insufficient

The incremental patch path improved specific DnD interactions but is no longer sufficient for MVP reliability because it keeps reconstructing complex editor behavior piece by piece. This creates repeated regressions, duplicated logic decisions, and high verification overhead for each interaction gap. A reference-based replacement reduces drift by starting from a cohesive editor runtime that already solves the core interaction model.

## Reference Project Assets To Reuse

- Editor page composition structure (workspace shell and feature-level orchestration).
- Editor interaction model for drag/drop, section handling, and block movement.
- Editor subcomponent boundaries that separate palette, canvas, and inspector responsibilities.
- Runtime state transitions used by the reference editor for deterministic block operations.

Reuse objective:

- Reuse behavior and structure from the reference implementation.
- Do not import reference branding, visual tokens, or product-specific API contracts.

## SendIO Assets To Preserve

- Existing SendIO store/API contracts as authoritative source (`snapshot_json`, version flows, workspace-scoped persistence).
- Current SendIO route/module ownership and feature boundaries.
- Current SendIO styling stack: Tailwind utilities, PrimeNG usage, SendIO theme tokens.
- Existing i18n behavior with priority support for `en` and `es`.
- Existing SendIO validation/test workflows and task documentation governance.

## Target Architecture

Three-layer runtime architecture is mandatory:

1. **Reference UI Layer (Adapted):** SendIO editor shell and subcomponents mirror reference behavior and structure.
2. **SendIO Facade/Adapter Layer (Authoritative Boundary):** Adapter maps reference runtime model to SendIO store model and API payload shapes.
3. **SendIO Store/API Layer (System of Record):** Existing template persistence, versioning, and backend endpoints remain canonical.

Key rule:

- Reference logic drives interaction behavior.
- SendIO facade controls contract compatibility.
- SendIO APIs remain unchanged unless adapter limitations are proven.

## Styling Rule

SendIO visual system is first priority:

- Apply SendIO Tailwind utility conventions and PrimeNG integration patterns.
- Use SendIO theme tokens and existing spacing/typography decisions.
- Keep i18n text, labels, and UX copy aligned with SendIO translation strategy (`en`/`es`).
- Do not port reference visual styling wholesale.

## Backend Policy

Adapter-first policy is mandatory:

- Start with frontend adapter/facade translation between reference runtime model and current SendIO APIs.
- Backend changes are allowed only when adapter constraints are explicitly demonstrated (payload mismatch, missing version semantics, or unavoidable data-loss risk).
- Any backend extension must include written justification, risk review, and updated docs/tasks references before implementation.

## Slice Plan

### Slice 1: Shell Replacement (Required First)

- Replace SendIO template editor shell/subcomponent structure with adapted reference structure.
- Keep Save/Load wired to SendIO adapter boundary.
- No backend changes in this slice.

### Slice 2: DnD and Layout Parity

- Reach reference-equivalent block placement and movement semantics.
- Confirm deterministic runtime behavior through adapter-backed store operations.

### Slice 3: Block Editing Parity

- Reach reference-equivalent block property editing behavior.
- Keep persisted shape fully compatible with SendIO snapshot/version contracts.

### Slice 4: Preview and Code Mode (Optional)

- Add reference-equivalent preview/code features only if needed for MVP goals.
- Remains optional and does not block Slice 1-3 completion.

### Slice 5: Backend Evolution (Optional and Justified)

- Only triggered if adapter limits are proven and documented.
- Must preserve backward compatibility with existing template versions.

## Data Mapping Strategy

Adapter responsibilities:

1. **Load path:** Convert SendIO persisted `snapshot_json` and current version metadata into the runtime shape expected by adapted reference UI/state logic.
2. **Edit path:** Keep in-memory state in reference-compatible runtime model while preserving stable IDs and ordering semantics required by SendIO versioning.
3. **Save path:** Convert runtime model back into SendIO `snapshot_json` format plus required version API fields without loss of structure.
4. **Roundtrip invariant:** `load -> edit -> save -> reload` must preserve semantic layout/content parity for supported blocks.

Compatibility constraints:

- Preserve workspace scoping and template identity/version relationships.
- Reject or safely normalize unsupported runtime fields instead of leaking non-contract data into SendIO APIs.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Runtime model mismatch between reference and SendIO snapshot | Broken save/load parity | Strict adapter contract tests for load/save roundtrip invariants |
| Visual drift from SendIO design language | Inconsistent UX and branding | Enforce SendIO-first Tailwind/PrimeNG/theme review checklist per slice |
| Partial replacement leaves mixed paradigms | Increased maintenance complexity | Replace full page/subcomponent structure in Slice 1 before incremental tuning |
| Hidden backend assumptions in reference logic | Unexpected integration failures | Keep backend unchanged initially; document and gate any required backend evolution |
| i18n regressions during UI replacement | Missing labels or incorrect locales | Validate `en` and `es` labels for replaced shell/components in each slice |

## Acceptance Criteria and Validation Plan

Acceptance criteria:

- Template editor page/subcomponents and interaction logic are replaced with adapted reference structure.
- SendIO remains system of record through facade/adapter integration.
- Save/load/versioning flows remain compatible with SendIO APIs for supported scenarios.
- SendIO styling conventions are preserved; reference styling is not imported wholesale.
- `en` and `es` experience remains functional for replaced editor areas.

Validation plan:

- Unit tests for adapter load/save mapping invariants.
- Store-level tests for deterministic placement/edit semantics under adapted runtime model.
- Component tests for shell, palette, canvas, and inspector integration with adapter boundary.
- Integration validation of template roundtrip with SendIO version APIs.
- Manual UX validation for SendIO styling conformity and i18n labels (`en`/`es`).

## Explicit Out of Scope for Slice 1

- Backend API/schema changes.
- Optional preview/code mode parity.
- Non-essential editor feature expansion beyond shell replacement and contract-safe wiring.
- Visual redesign that diverges from SendIO current style system.
