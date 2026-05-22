# Template Canonical Payload Migration

## Scope

Migrate SendIO template payload handling to the canonical `maquetador-emails` content model while preserving current workspace authorization, draft/publish lifecycle, version immutability, and compliance validations.

## Canonical Payload

- Canonical content shape: `content.sections[].components[]`
- Component fields: `blockId`, `blockName`, `type`, `content/url`, `posX`, `posY`, `sizeX`, `styles`
- Backend persistence stays in `template_versions.snapshot_json` for storage continuity, but API accepts canonical `content` payload and returns canonical `content` in version resources.

## Deliverables

- Backend API contract accepts and validates canonical payload, including positional fields and `sizeX`.
- Backend lifecycle behavior remains unchanged: draft-only edit, publish compliance, variable extraction, and new-version creation from latest published snapshot.
- Frontend editor route/page remains unchanged; internal load/save mapping uses canonical payload semantics.
- Regression tests cover load/edit/save/reload parity and versioning flow with canonical content shape.

## Acceptance Criteria

- `PUT /api/templates/{id}/versions/{n}` accepts `content` and stores a normalized payload (`sizeX` default when omitted).
- `GET /api/templates` and `GET /api/templates/{id}` version items include canonical `content` payload.
- Publishing still rejects invalid placeholders and missing unsubscribe placeholder.
- Existing editor route works with load, edit, save, reload, and publish/new-version flow.

## Validation

- Run backend feature tests for templates lifecycle and compliance.
- Run frontend template editor and templates data-access tests.

## Notes

- Legacy `snapshot_json` request support remains temporarily for compatibility during migration rollout.
