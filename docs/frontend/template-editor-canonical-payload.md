# Template Editor Canonical Payload Migration

This document describes how the SendIO template editor uses the canonical `maquetador-emails` content model while keeping the existing SendIO editor route and page entrypoint.

## Builder UI Parity (Current Route)

- Entrypoint remains `template-editor-page`.
- Visible builder shell is implemented on the same route with three zones:
  - Left sidebar with top content-items area (existing blocks list + section creation + create/edit controls).
  - Center canvas with section/row/cell drop zones, row/column insertion controls, and cell resize handles.
  - Right inspector for block-level editing.
- Bottom component list (`text`, `image`, `button`, `separator`) opens creation controls on click and still supports DnD.
- Section creation is available from sidebar top controls and from canvas actions.
- DnD supports palette/library to canvas and cross-cell movement inside and across sections.
- Resize behavior now includes:
  - horizontal width redistribution between adjacent cells,
  - vertical per-row min-height adjustments during editor session.

## Known Limitations

- Component creation controls currently support lightweight defaults (content/URL) and rely on inspector for detailed styling edits.
- Canvas layout still stores one block per cell; multi-block stacking inside the same cell is intentionally out of scope for this hard-replace phase.

## Canonical Content Model

- Runtime and persistence payload shape:
  - `content.sections[]`
  - `content.sections[].components[]`
- Component payload fields:
  - `blockId`, `blockName`, `type`
  - `content` and/or `url`
  - `posX`, `posY`, `sizeX`
  - `styles`
  - style keys are normalized to canonical camelCase (`backgroundColor`, `textColor`, `borderRadius`, `borderWidth`, etc.) during load/save
- Section payload compatibility fields:
  - `sectionId` for stable identity mapping independent from mutable `sectionName`
  - `rowMinHeights[]` for persisted row resize behavior

## Editor Entrypoint

- The route and page entrypoint stay unchanged (`template-editor-page`).
- Migration is internal to store and adapter layers:
  - Load: canonical content is deserialized into canvas rows/cells.
  - Save: canvas is serialized back to canonical content.

## Compatibility Behavior

- Frontend reads `version.content` first.
- Frontend falls back to `version.snapshot_json` for backward compatibility.
- Serialization writes `sizeX` for each component; default is `1` when not explicitly set.
- Save serialization is canvas-first: only components placed in the section grid are sent to the backend, and their `posX`/`posY` values are recalculated from the current row and column indexes.
- Component creation from the sidebar assigns the first available canvas cell immediately so new blocks have numeric layout coordinates before draft save.

## Verified Flows

- Load existing template draft.
- Render palette blocks on editor load.
- Add block from sidebar via DnD or click fallback.
- Edit blocks/rows/sections.
- Save draft.
- Reload and preserve structure parity.
- Publish and create a new version with preserved content layout.
