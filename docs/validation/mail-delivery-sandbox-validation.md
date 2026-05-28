# Mail Delivery Sandbox Validation

This document defines how email delivery is validated in the MVP using Mailtrap.

## MVP-BACK-004 Runtime Status

- Automated campaign-delivery behavior is validated by tests using fake mail transport.
- Live Mailtrap sandbox inbox smoke for `back/feat-campaign-delivery-mailtrap` is still pending execution in a runtime with Mailtrap inbox/API access.
- Do not mark `MVP-BACK-004` as acceptance-complete until a new runtime entry captures actual inbox evidence for that branch.

## Validation Scope

- Verify that campaign deliveries are sent to Mailtrap sandbox inboxes.
- Verify per-recipient state transitions (`pending`, `sent`, `failed`).
- Verify retry policy behavior (max 2 retries, up to 3 total attempts including initial send).
- Verify bounce-like failures are recorded as `failed` with reason details.

## Validation Evidence

- Mailtrap inbox message capture for a test campaign.
- Delivery execution logs with timestamps and attempt counters.
- Reporting dashboard values consistent with delivery outcomes.

## Docker Runtime Verification Evidence (MVP-INFRA-001)

### Evidence Matrix

| Check | Command (Docker-only) | Status | Evidence |
|---|---|---|---|
| Mail config resolves to Mailtrap | `./sendio.sh art config:show mail` | documented | Command and expected output captured in `docs/devops/docker-mailtrap-env.md`. |
| Queue config resolves to Redis | `./sendio.sh art config:show queue` | documented | Queue contract and expected output captured in `docs/devops/docker-mailtrap-env.md`. |
| Queue worker is active | `./sendio.sh queue` | documented | Worker command and log validation path captured in `docs/devops/docker-mailtrap-env.md`. |
| SMTP host resolves from container | `./sendio.sh sh` then `php -r 'echo gethostbyname("sandbox.smtp.mailtrap.io") . PHP_EOL;'` | documented | Command and expected output captured in `docs/devops/docker-mailtrap-env.md`. |
| Smoke mail reaches sandbox inbox | `./sendio.sh art tinker --execute='\Illuminate\Support\Facades\Mail::raw(...)'` | documented | Reproducible command documented; capture screenshot/ID from Mailtrap during execution window. |

### Execution Notes

- This task records reproducible Docker-first verification commands and expected outcomes.
- Runtime execution is intentionally deferred to the environment where Mailtrap secrets are available.

### Runtime Execution Log

- **Run timestamp:** 2026-05-19 10:11:27 +02:00
- **Requested branch:** `dev`
- **Actual branch at runtime:** `infra/chore-docker-mailtrap-env`
- **Environment gate result:** **BLOCKED** (required Mailtrap/Laravel mail keys are not present in `.env`).

| Check | Runtime command | Outcome | Notes |
|---|---|---|---|
| Branch verification | `git branch --show-current` | ⚠️ FAIL | Expected `dev`, found `infra/chore-docker-mailtrap-env`. |
| Mail env prerequisites | PowerShell validation of `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS` in `.env` | ❌ FAIL | All required keys missing in `.env`; runtime verification stopped safely per constraints. |
| Docker stack startup | `./sendio.sh up` or `.\sendio.ps1 up` | ⏸️ NOT RUN | Skipped because mandatory `.env` mail contract was incomplete. |
| Container mail config resolution | `./sendio.sh art config:show mail` | ⏸️ NOT RUN | Blocked by missing `.env` keys. |
| SMTP connectivity from container | `./sendio.sh sh` + `php -r 'echo gethostbyname("sandbox.smtp.mailtrap.io") . PHP_EOL;'` | ⏸️ NOT RUN | Blocked by missing `.env` keys. |
| Smoke send / Mailtrap capture | `./sendio.sh art tinker --execute='\\Illuminate\\Support\\Facades\\Mail::raw(...)'` | ⏸️ NOT RUN | Blocked by missing `.env` keys. |

**Required values before rerun:**

- `MAIL_MAILER=smtp`
- `MAIL_HOST=sandbox.smtp.mailtrap.io`
- `MAIL_PORT=2525`
- `MAIL_USERNAME=<mailtrap_smtp_username>`
- `MAIL_PASSWORD=<mailtrap_smtp_password>`
- `MAIL_FROM_ADDRESS=<verified-or-safe-sender@example.test>`

### Runtime Execution Log (Task-Branch Verification)

- **Run timestamp:** 2026-05-19 10:18:07 +02:00
- **Requested branch policy:** task branch accepted (no `dev` requirement)
- **Actual branch at runtime:** `infra/chore-docker-mailtrap-env`
- **Environment gate result:** **BLOCKED** (Docker daemon unavailable on host during verification window).

| Check | Runtime command | Outcome | Notes |
|---|---|---|---|
| Branch verification | `git rev-parse --abbrev-ref HEAD` | ✅ PASS | Running on task branch `infra/chore-docker-mailtrap-env` as requested. |
| Docker stack startup | `./sendio.sh up` or `\.\sendio.ps1 up` | ❌ FAIL | Docker engine unavailable: `failed to connect to ... dockerDesktopLinuxEngine` (daemon not running/reachable). |
| Container mail config resolution | `\.\sendio.ps1 artisan config:show mail` | ⏸️ BLOCKED | Cannot execute Laravel command because no running Docker engine/containers. |
| SMTP connectivity from container | `\.\sendio.ps1 sh \"php -r 'echo gethostbyname(\"sandbox.smtp.mailtrap.io\") . PHP_EOL;'\"` | ⏸️ BLOCKED | Container shell unreachable due Docker daemon outage. |
| Smoke send / Mailtrap capture | `\.\sendio.ps1 artisan tinker --execute='\\Illuminate\\Support\\Facades\\Mail::raw(...)'` | ⏸️ BLOCKED | Mail smoke send not executable while Docker daemon is offline. |

**Sanitized runtime stderr excerpt (no secrets):**

`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; ... El sistema no puede encontrar el archivo especificado.`

**Pass/Fail for this runtime session:** **FAIL** (infrastructure prerequisite not met; application-level checks not executable).

### Runtime Execution Log (Task-Branch Re-Run)

- **Run timestamp:** 2026-05-19 10:22:21 +02:00
- **Requested scope:** Re-run MVP-INFRA-001 runtime verification on current task branch.
- **Actual branch at runtime:** `infra/chore-docker-mailtrap-env`
- **Environment gate result:** **READY** (Docker stack started and Laravel container reachable).

| Check | Runtime command | Outcome | Notes |
|---|---|---|---|
| Branch verification | `git rev-parse --abbrev-ref HEAD` | ✅ PASS | Active task branch confirmed as `infra/chore-docker-mailtrap-env`. |
| Docker stack startup | `\.\sendio.ps1 up` | ✅ PASS | Services `sendio_backend`, `sendio_web`, `sendio_postgres`, `sendio_redis`, `sendio_mongodb` started. |
| Laravel mail config (sanitized) | `\.\sendio.ps1 artisan config:show mail` (with masked stdout for username/password) | ✅ PASS | `default=smtp`, `host=sandbox.smtp.mailtrap.io`, `port=2525`; credentials present but redacted. |
| SMTP/DNS connectivity from container | `docker compose -f docker-compose.dev.yml exec -u root app php -r "...gethostbyname...fsockopen..."` | ✅ PASS | `DNS=3.219.2.182`, `SMTP_CONNECT=OK`. |
| Docker-only smoke send | `docker compose -f docker-compose.dev.yml exec -u root app php -r "...Mail::raw..."` | ✅ PASS | `SMOKE_SEND=DISPATCHED TO=no-reply@sendio.local`. Expect message in Mailtrap sandbox inbox for matching timestamped subject. |

**Sanitized command output excerpts (no secrets):**

- `mailers ⇁ smtp ⇁ host ............................. sandbox.smtp.mailtrap.io`
- `mailers ⇁ smtp ⇁ port ................................................. 2525`
- `mailers ⇁ smtp ⇁ username [REDACTED]`
- `mailers ⇁ smtp ⇁ password [REDACTED]`
- `DNS=3.219.2.182`
- `SMTP_CONNECT=OK`
- `SMOKE_SEND=DISPATCHED TO=no-reply@sendio.local`

**Pass/Fail for this runtime session:** **PASS** (all requested runtime checks executed successfully under Docker-only flow).

### Runtime Execution Log (Redis Worker Campaign Smoke)

- **Run timestamp:** 2026-05-27 08:05:58 +02:00
- **Requested scope:** Validate real campaign delivery through Redis-backed `queue-worker` and Mailtrap SMTP.
- **Environment gate result:** **PARTIAL PASS** (campaign job processed successfully through Docker worker; Mailtrap inbox API evidence unavailable because inbox API environment variables are not configured).

| Check | Runtime command | Outcome | Notes |
|---|---|---|---|
| Docker service status | `docker compose -f docker-compose.dev.yml ps` | ✅ PASS | `sendio_queue_worker` was running for 14+ minutes alongside app, Redis, PostgreSQL, MongoDB, and Nginx. |
| Queue config resolves to Redis | `.\sendio.ps1 artisan config:show queue` | ✅ PASS | `default=redis`; Redis queue connection uses `queue=default` and `retry_after=90`. |
| Mail config resolves to Mailtrap | `.\sendio.ps1 artisan config:show mail` with credentials redacted | ✅ PASS | `default=smtp`, `host=sandbox.smtp.mailtrap.io`, `port=2525`; username/password present but redacted. |
| SMTP connectivity from container | `docker compose -f docker-compose.dev.yml exec -T app php -r "...fsockopen..."` | ✅ PASS | `DNS=3.209.246.195`, `SMTP_CONNECT=OK`. |
| Campaign job dispatch | Docker-only Laravel runtime command creating a smoke campaign and dispatching `SendCampaignRecipientJob` | ✅ PASS | Campaign `019e6878-0f5e-7342-b7f0-ce03a2097218`; recipient `019e6878-0f68-708b-80ab-ad47a342365a`; recipient address `sendio-smoke-20260527080558@example.test`. |
| Worker processing | `docker logs --tail 120 sendio_queue_worker` | ✅ PASS | Worker log showed `App\Jobs\SendCampaignRecipientJob RUNNING` at `2026-05-27 08:06:00` and `DONE` after 4 seconds. |
| Delivery persistence | Docker-only Laravel runtime query for campaign and delivery attempts | ✅ PASS | Campaign status `completed`, `sent_count=1`, `failed_count=0`, recipient status `sent`, `attempt_count=1`, delivery attempts `1`, `last_error=null`. |
| Mailtrap inbox capture | Mailtrap API/UI evidence | ⚠️ PENDING | `MAILTRAP_API_TOKEN`, `MAILTRAP_ACCOUNT_ID`, and `MAILTRAP_INBOX_ID` are not configured, so automated inbox message capture could not be verified from the runtime. |

**Sanitized command output excerpts (no secrets):**

- `default .............................................................. redis`
- `mailers ⇁ smtp ⇁ host ............................. sandbox.smtp.mailtrap.io`
- `mailers ⇁ smtp ⇁ port ................................................. 2525`
- `DNS=3.209.246.195`
- `SMTP_CONNECT=OK`
- `CAMPAIGN_STATUS=completed`
- `SENT_COUNT=1`
- `FAILED_COUNT=0`
- `RECIPIENT_STATUS=sent`
- `ATTEMPT_COUNT=1`
- `LAST_ERROR=null`
- `2026-05-27 08:06:00 App\Jobs\SendCampaignRecipientJob .............. RUNNING`
- `2026-05-27 08:06:05 App\Jobs\SendCampaignRecipientJob .............. 4s DONE`

**Pass/Fail for this runtime session:** **PARTIAL PASS**. The SendIO application path from campaign job dispatch through Redis worker execution and SMTP acceptance passed. Full MVP-BACK-004 acceptance remains pending until a Mailtrap inbox UI/API capture confirms the message exists in the sandbox inbox.

### Runtime Execution Log (Mailtrap Inbox and HTML Rendering Finding)

- **Run timestamp:** 2026-05-28
- **Campaign ID:** `019e6d3a-63fb-7095-a760-97dd5448e656`
- **Campaign name:** `Campaña nueva`
- **Observed result:** Mailtrap received messages, but only 3 of 21 recipients were marked sent.
- **Root causes:** HTML rendering was incomplete for unsubscribe-only templates, and Mailtrap sandbox SMTP throttled high-throughput delivery.

| Check | Outcome | Evidence |
|---|---|---|
| Mailtrap inbox delivery | ✅ PASS | User confirmed messages are visible in Mailtrap. |
| HTML body validity | ❌ FAIL | Inbox body only contained the unsubscribe anchor fragment instead of a complete HTML email document. |
| Campaign persistence | ⚠️ PARTIAL PASS | `recipient_count=21`, `sent_count=3`, `failed_count=18`. |
| Failed recipient errors | ❌ FAIL | `550 5.7.0 Too many emails per second. Please upgrade your plan`. |
| Delivery path | ✅ PASS | Successful recipients prove SMTP connectivity and worker execution are functional. |

**Conclusion:** Inbox delivery works, but MVP-BACK-004 cannot be considered fully accepted until campaign emails render as complete HTML documents and Mailtrap sandbox throughput is controlled with delivery throttling/backoff.

**Fix progress:** The backend campaign delivery renderer now wraps rendered campaign components in a complete HTML document before calling `Mail::html`. Mailtrap throughput throttling remains a separate delivery-control follow-up.

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
