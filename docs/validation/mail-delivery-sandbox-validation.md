# Mail Delivery Sandbox Validation

This document defines how email delivery is validated in the MVP using Mailtrap.

## Validation Scope

- Verify that campaign deliveries are sent to Mailtrap sandbox inboxes.
- Verify per-recipient state transitions (`pending`, `sent`, `failed`).
- Verify retry policy behavior (max 2 retries, up to 3 total attempts including initial send).
- Verify bounce-like failures are recorded as `failed` with reason details.

## Validation Evidence

- Mailtrap inbox message capture for a test campaign.
- Delivery execution logs with timestamps and attempt counters.
- Reporting dashboard values consistent with delivery outcomes.

## Acceptance Criteria

1. A scheduled or immediate campaign produces observable messages in Mailtrap.
2. No real external recipient delivery is required for MVP validation.
3. Failed recipient attempts stop after the configured retry limit.
4. Metrics refresh reflects delivery outcomes within the defined update window.

## Explicit Test Cases

### TC-01 Template Publish Blocked Without `unsubscribe_url`
- **Given:** A template draft without `{{unsubscribe_url}}` or equivalent unsubscribe block.
- **When:** Owner or Editor attempts to publish.
- **Then:** Publication is rejected with compliance error and no new template version is created.

### TC-02 Campaign Pre-Send Blocked Without `unsubscribe_url`
- **Given:** A campaign references a template version that fails unsubscribe compliance.
- **When:** Owner or Editor triggers immediate send or scheduled execution starts.
- **Then:** Queue processing does not start and campaign shows compliance validation failure.

### TC-03 Missing Variable Renders as Empty String
- **Given:** Template contains allowed placeholder (for example `{{first_name}}`) and recipient value is null/empty.
- **When:** Delivery rendering runs.
- **Then:** Placeholder is resolved to empty string and send flow continues.

### TC-04 Viewer Export Denied
- **Given:** Authenticated Viewer opens reporting dashboard.
- **When:** Viewer requests CSV export.
- **Then:** System denies export action and returns authorization error.

### TC-05 Import Deduplication is Case-Insensitive
- **Given:** Import batch includes `User@Mail.com` and `user@mail.com`.
- **When:** Import processing executes.
- **Then:** One record is inserted, the duplicate is skipped, and report increments duplicate count.
