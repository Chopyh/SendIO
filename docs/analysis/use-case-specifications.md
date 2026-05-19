# Use Case Specifications

This document provides formal use-case fichas for the core SendIO capabilities. Each specification defines intent, role constraints, normal flow, and exception handling aligned with the agreed requirements.

## UC-01 Authenticate and Rotate Session Tokens

**Objective:** Establish a secure authenticated session with access and refresh token lifecycle controls.

**Primary Actor:** Owner, Editor, Viewer

**Preconditions:**
- The user account exists and is active.
- The user provides valid credentials.

**Postconditions:**
- Access token is issued with a 1-hour validity.
- Refresh token is issued with 1-month validity and rotation tracking.

**Main Flow:**
1. Actor submits credentials.
2. System validates identity and workspace memberships.
3. System issues JWT access token (1h) and refresh token (1 month).
4. Actor performs authorized operations using access token.
5. On refresh request, system invalidates the previous refresh token and issues a new pair.

**Alternative and Exception Flows:**
- A1: If refresh token reuse is detected, the system revokes the active session/device and requires re-authentication.
- A2: If access token expires, the actor may use a valid refresh token to continue.

**Business Rules:**
- BR-01: Refresh token reuse MUST revoke the current session/device.
- BR-02: Token scope is workspace-aware and role-constrained.

---

## UC-02 Switch Active Workspace Context

**Objective:** Allow a user with multi-workspace membership to work within a selected workspace boundary.

**Primary Actor:** Owner, Editor, Viewer

**Preconditions:**
- Actor is authenticated.
- Actor belongs to one or more workspaces.

**Postconditions:**
- Active workspace context is selected.
- Subsequent data access is filtered to the active workspace.

**Main Flow:**
1. Actor requests workspace change.
2. System verifies actor membership for the target workspace.
3. System updates active context.
4. System reloads scoped resources (contacts, campaigns, sender profile, reporting).

**Alternative and Exception Flows:**
- A1: If actor lacks membership in target workspace, operation is denied.

**Business Rules:**
- BR-03: No cross-workspace data leakage is allowed.

---

## UC-03 Import Contacts with Normalization and Validation

**Objective:** Ingest contact data from supported formats while enforcing quality and deduplication rules.

**Primary Actor:** Owner, Editor

**Preconditions:**
- Actor is authenticated in a workspace.
- Import source is CSV, JSON, or semicolon-delimited list.

**Postconditions:**
- Valid and unique contacts are stored.
- Duplicates and invalid entries are skipped.
- Import report is generated.

**Main Flow:**
1. Actor uploads source data.
2. System parses input based on detected format.
3. System normalizes emails (trim, lowercase, canonical comparison).
4. System validates required fields and email format.
5. System skips duplicates using case-insensitive matching.
6. System skips invalid entries.
7. System stores accepted contacts and emits processing report.

**Alternative and Exception Flows:**
- A1: If file syntax is malformed, import is aborted and error report is returned.
- A2: If all records are invalid or duplicate, system returns zero inserted with full diagnostics.

**Business Rules:**
- BR-04: Duplicate detection is case-insensitive.
- BR-05: Invalid records MUST NOT block valid records in the same import batch.

---

## UC-04 Configure Sender Profile

**Objective:** Manage workspace-level sender identity for outbound campaigns.

**Primary Actor:** Owner

**Preconditions:**
- Actor is authenticated in workspace context.
- Actor role is Owner.

**Postconditions:**
- Workspace sender profile is created or updated.

**Main Flow:**
1. Owner accesses sender profile settings.
2. Owner submits sender display name and sender email.
3. System validates sender data format.
4. System stores updated sender profile for the workspace.

**Alternative and Exception Flows:**
- A1: If actor role is Editor or Viewer, access is denied.

**Business Rules:**
- BR-06: Exactly one effective sender profile is active per workspace at a time.
- BR-06b: MVP sender profile validation checks format only; sender ownership verification is deferred.

---

## UC-04B Publish Template Version with Structural and Compliance Validation

**Objective:** Publish an immutable template version only when it is structurally valid and compliance-safe.

**Primary Actor:** Owner, Editor

**Preconditions:**
- Actor is authenticated and authorized.
- Template draft exists in workspace scope.

**Postconditions:**
- A new immutable template version is published.
- Publish is blocked when compliance or schema checks fail.

**Main Flow:**
1. Actor requests template publication.
2. System validates template JSON tree schema.
3. System validates allowed variable placeholder syntax `{{variable_name}}`.
4. System validates mandatory compliance rule: `unsubscribe_url` must be present.
5. System creates a new immutable template version snapshot.

**Alternative and Exception Flows:**
- A1: If schema validation fails, publication is rejected with field-level errors.
- A2: If `unsubscribe_url` is missing, publication is rejected with compliance error.

**Business Rules:**
- BR-06c: Schema validation is mandatory on both save and publish operations.
- BR-06d: `unsubscribe_url` is mandatory for template publication.
- BR-06e: Editing a published template creates a new version, never in-place mutation.

---

## UC-05 Schedule Campaign in Workspace Timezone

**Objective:** Schedule campaign delivery using workspace-local temporal semantics.

**Primary Actor:** Owner, Editor

**Preconditions:**
- Actor is authenticated and authorized.
- Campaign is valid and has recipients.
- Workspace timezone is configured.

**Postconditions:**
- Campaign is persisted with UTC execution timestamp and timezone metadata.
- DST adjustment notice is emitted when applicable.

**Main Flow:**
1. Actor sets local scheduled date/time.
2. System resolves timestamp using workspace timezone.
3. System validates DST consistency.
4. If local timestamp is invalid due to DST transition, system shifts to next valid instant.
5. System records adjusted schedule and displays notice.

**Alternative and Exception Flows:**
- A1: If schedule is in the past, operation is rejected.

**Business Rules:**
- BR-07: DST-invalid local times MUST move to next valid instant, with explicit user notice.

---

## UC-06 Execute Campaign Delivery with Retry Policy

**Objective:** Deliver campaign messages reliably with controlled retries and state tracking.

**Primary Actor:** System (Delivery Worker)

**Preconditions:**
- Campaign is scheduled and due.
- Recipient queue is generated with `pending` state.

**Postconditions:**
- Recipients end in `sent` or `failed` state.
- Delivery attempts and errors are recorded.

**Main Flow:**
1. System runs pre-send compliance checks on the selected template version.
2. System validates that `unsubscribe_url` is present.
3. System compiles variables from allowed catalog categories (Contact, Workspace, System).
4. System renders missing variable values as empty string.
5. Worker dequeues pending recipients.
6. Worker attempts delivery through Mailtrap.
7. On success, state changes to `sent`.
8. On failure, retry count increments.
9. Worker retries until max 2 retries are exhausted (up to 3 total attempts including the initial send).
10. If still failing, state changes to `failed`.

**Alternative and Exception Flows:**
- A1: If pre-send compliance fails (`unsubscribe_url` missing), execution is blocked.
- A2: Temporary provider failure triggers retry within policy boundaries.
- A3: Permanent validation failure can mark recipient as failed immediately.

**Business Rules:**
- BR-08: Delivery state domain is `pending`, `sent`, `failed`.
- BR-09: Maximum retries per recipient is 2.
- BR-09b: Pre-send compliance is mandatory before queue processing starts.
- BR-09c: Missing variable values render as empty string and do not block send.

---

## UC-07 Pause, Resume, and Cancel Campaign Processing

**Objective:** Control campaign progression during execution with predictable queue behavior.

**Primary Actor:** Owner, Editor

**Preconditions:**
- Actor is authenticated and authorized.
- Campaign is in a controllable state.

**Postconditions:**
- Pause halts dequeue from pending queue.
- Resume restarts dequeue from pending queue.
- Cancel prevents future enqueue and allows current in-flight batch to finish.

**Main Flow:**
1. Actor selects campaign control action (pause/resume/cancel).
2. System validates transition from current campaign status.
3. For pause, system blocks new dequeues from pending queue.
4. For resume, system re-enables dequeues.
5. For cancel, system marks campaign as cancel-requested and blocks future enqueue.
6. System allows active batch completion and then finalizes cancellation.

**Alternative and Exception Flows:**
- A1: Invalid transition (for example, resume on completed campaign) is rejected.

**Business Rules:**
- BR-10: Cancel does not interrupt the currently processing batch.

---

## UC-08 Monitor Metrics and Export CSV

**Objective:** Provide operational visibility and data extraction under role constraints.

**Primary Actor:** Owner, Editor, Viewer

**Preconditions:**
- Actor is authenticated in workspace context.
- Reporting data is available.

**Postconditions:**
- Dashboard metrics are refreshed every 60 seconds.
- CSV export is generated only for allowed roles.

**Main Flow:**
1. Actor opens reporting dashboard.
2. System refreshes metrics at 60-second intervals.
3. Actor reviews send/failure/pending indicators.
4. Owner or Editor requests CSV export.
5. System generates and returns workspace-scoped CSV.

**Alternative and Exception Flows:**
- A1: If actor is Viewer and requests export, system denies operation.

**Business Rules:**
- BR-11: Viewer role can read metrics but cannot export CSV.
- BR-12: Reporting localization must support `en` and `es` content labels.

---

## UC-09 Manage Template Components and Variable Catalog

**Objective:** Build reusable template assets with controlled component and variable usage.

**Primary Actor:** Owner, Editor

**Preconditions:**
- Actor is authenticated and authorized.
- Workspace context is selected.

**Postconditions:**
- Component library item or template variable references are persisted.
- Changes are available for future template versions.

**Main Flow:**
1. Actor creates or updates a workspace component library item.
2. System validates component schema and type metadata.
3. Actor inserts component snapshot into template draft.
4. Actor inserts placeholders using `{{variable_name}}` syntax.
5. System validates placeholders against allowed catalog categories.

**Alternative and Exception Flows:**
- A1: Unknown placeholder name is rejected during save/publish validation.
- A2: Invalid component schema is rejected with error details.

**Business Rules:**
- BR-13: Component insertions into templates are stored as immutable snapshots per template version.
- BR-14: Allowed variable categories are Contact, Workspace, and System.
