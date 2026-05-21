# Template Builder — Design Spec

**Date:** 2026-05-21
**Feature:** `front/feat-template-builder`
**Status:** Approved

---

## Overview

This document describes the design for the SendIO Template Builder — a drag-and-drop email composition UI that integrates directly with the Templates API. Users can create, edit, and manage email template versions visually within their workspace.

The implementation draws conceptual inspiration from the `maquetador-emails` prototype but is built from scratch to align with SendIO's architecture (Angular Signals, PrimeNG, hexagonal-adjacent feature structure, and the backend API contract already in place).

---

## User Journey

1. User navigates to `/app/templates` → sees list of workspace templates.
2. Clicks **"New template"** → creates a template via API → redirected to `/app/templates/:id/edit`.
3. The editor loads the active draft version's `snapshot_json`.
4. User drags blocks from the left panel onto the canvas, arranges them in sections.
5. User clicks a block to edit it in the right inspector panel (content, URL, styles).
6. Changes are **auto-saved every 30 seconds** to the backend draft version.
7. User can **manually save** at any time.
8. When satisfied, user clicks **"Publish"** → the backend validates variables and unsubscribe URL presence → version is marked as `published` and becomes immutable.
9. To edit a published template, user clicks **"New version"** → a new draft is forked from the latest published version.

---

## Route Structure

| Route | Component | Guards |
|---|---|---|
| `/app/templates` | `TemplatesListPageComponent` | `authGuard` |
| `/app/templates/:id/edit` | `TemplateEditorPageComponent` | `authGuard` |

Both routes are inside the existing `AppLayoutComponent` shell.

---

## Feature Module Structure

```
frontend/src/app/features/templates/
├── templates-list/
│   ├── templates-list-page.component.ts
│   ├── templates-list-page.component.html
│   └── templates-list-page.component.spec.ts
├── template-editor/
│   ├── template-editor-page.component.ts
│   ├── template-editor-page.component.html
│   ├── template-editor-page.component.css
│   ├── template-editor-page.component.spec.ts
│   ├── components/
│   │   ├── block-palette/
│   │   │   ├── block-palette.component.ts
│   │   │   └── block-palette.component.html
│   │   ├── canvas-section/
│   │   │   ├── canvas-section.component.ts
│   │   │   └── canvas-section.component.html
│   │   ├── canvas-cell/
│   │   │   ├── canvas-cell.component.ts
│   │   │   └── canvas-cell.component.html
│   │   └── element-inspector/
│   │       ├── element-inspector.component.ts
│   │       └── element-inspector.component.html
│   └── store/
│       └── template-editor.store.ts
└── data-access/
    ├── models/
    │   ├── template.model.ts
    │   └── template-snapshot.model.ts
    └── services/
        ├── templates-api.service.ts
        └── variables-api.service.ts
```

---

## State Management — `TemplateEditorStore`

Angular Signal-based store (using `@ngrx/signals` or a manual signal store pattern consistent with the existing codebase).

### State shape

```ts
interface TemplateEditorState {
  template: Template | null;
  activeVersion: TemplateVersion | null;
  snapshot: TemplateSnapshot;         // mutable working copy
  selectedElementId: number | null;   // blockId of selected element
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  error: string | null;
}
```

### Key methods / computed

| Method | Description |
|---|---|
| `loadTemplate(id)` | Fetch template + latest draft version from API |
| `addSection(name)` | Add a new section to the snapshot |
| `removeSection(name)` | Remove a section from the snapshot |
| `dropBlock(type, sectionName, rowIndex, colIndex)` | Place a new block from the palette |
| `moveBlock(from, to)` | Move a block between cells via CDK drag |
| `updateBlock(blockId, patch)` | Update a block's content, url, or styles |
| `removeBlock(blockId, sectionName)` | Remove a block from the canvas |
| `selectElement(blockId)` | Set the active inspector element |
| `save()` | PUT snapshot to backend draft version |
| `publish()` | POST publish to backend |
| `createNewVersion()` | POST to create a new draft version |

---

## Canvas Data Model

The canvas is a direct representation of `snapshot_json`. It is kept as a rich local structure for rendering but serialized to the API contract on save.

### Internal canvas model

```ts
interface CanvasSection {
  sectionName: string;
  rows: CanvasRow[];
  styles: Record<string, string>;
}

interface CanvasRow {
  columns: CanvasCell[];
}

interface CanvasCell {
  id: string;               // UUID — used as CDK drop list ID
  widthPercent: number;     // default: 100 / column count
  block: CanvasBlock | null;
}

interface CanvasBlock {
  blockId: number;
  blockName: string;
  type: 'text' | 'image' | 'button' | 'separator';
  content?: string;         // HTML content for text blocks (rich text)
  url?: string;
  styles: Record<string, string>;
}
```

### Serialization to `snapshot_json`

When saving, the store flattens the canvas structure to the backend contract:

```ts
sections: [{
  sectionName: string,
  styles: object,
  components: [{
    blockId: number,
    blockName: string,
    type: string,
    content?: string,
    url?: string,
    posX: number,   // column index
    posY: number,   // row index
    styles: object
  }]
}]
```

---

## Left Panel — Block Palette

Two tabs:

1. **Blocks** — built-in block types available to drag:
   - 📝 Text (rich text via `p-editor` from PrimeNG)
   - 🖼️ Image (URL input)
   - 🔘 Button (label + URL)
   - ➖ Separator (styled `<hr>`)

2. **Library** — components from `GET /api/components` (workspace + global). Drag onto canvas to insert a pre-configured block.

3. **Variables** — list from `GET /api/variables/catalog`. Click to copy `{{placeholder}}` to clipboard for pasting into text blocks.

---

## Right Panel — Element Inspector

Displays when a block is selected (`selectedElementId !== null`).

| Block type | Inspector fields |
|---|---|
| `text` | PrimeNG rich text editor (`p-editor`) |
| `image` | URL input, alt text, width/height styles |
| `button` | Label (text), URL (href), background color, text color |
| `separator` | Border color, border style, border width |

All changes are **immediate** (update local state) and marked `isDirty = true`.

---

## Top Bar

| Element | Behavior |
|---|---|
| Template name | Editable inline (`contenteditable` or input) |
| Version badge | Shows current version number and state (`draft` / `published`) |
| Auto-save indicator | "Guardando..." / "Guardado" / "Error al guardar" |
| "Guardar" button | Manual save — calls `store.save()` |
| "Publicar" button | Enabled only when `state === 'draft'`. Calls `store.publish()`. Shows compliance errors inline if backend rejects. |
| "Nueva versión" button | Visible only when latest version is `published`. Calls `store.createNewVersion()`. |

---

## Templates List Page

Simple page with:
- Page title + "New template" button (opens name dialog → creates via API → redirects to editor).
- Cards per template showing: name, version count, latest state badge, edit button.
- Delete action per template (with confirmation dialog).

---

## Auto-Save

- Implemented via `setInterval` inside the store (or `rxjs interval`).
- Interval: **30 seconds**.
- Only fires if `isDirty === true`.
- Does NOT auto-publish — only persists draft.
- On navigation away while dirty: confirm dialog.

---

## Error Handling

| Scenario | UX response |
|---|---|
| Save fails | Toast error. `isDirty` remains `true`. |
| Publish rejected — missing unsubscribe | Inline error below "Publicar" button with specific message. |
| Publish rejected — invalid placeholder | List of invalid placeholders shown in error. |
| Template not found | Redirect to `/app/templates` with toast. |

---

## Accessibility & i18n

- All labels and UI strings registered in `translations.ts` under `templates` namespace.
- Both `en` and `es` supported.
- Drag-and-drop accessible fallback: each block has "move up / move down" buttons as keyboard alternative.

---

## Testing Strategy

| Layer | What to test |
|---|---|
| `TemplateEditorStore` | State transitions: load, drop block, save, publish, dirty flag |
| `TemplatesApiService` | HTTP contract (using `HttpTestingController`) |
| `TemplatesListPageComponent` | Renders list, opens create dialog, navigates to editor |
| `ElementInspectorComponent` | Field updates propagate to store correctly |

**Strictly TDD**: write tests before implementation for store logic and API service.

---

## Out of Scope (this sprint)

- HTML export to email clients (deferred to campaign sending module).
- Real-time collaboration (multi-user editing).
- Custom fonts or brand kit management.
- Template categories or tags.
