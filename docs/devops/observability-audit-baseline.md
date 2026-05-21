# Observability and Audit Baseline

This baseline defines the minimum logging, request traceability, and audit-retention conventions required before campaign delivery and reporting work expands audit behavior.

## Quick path

1. Every HTTP request uses `X-Request-ID` as the correlation header.
2. Laravel accepts safe inbound request IDs or generates a UUID when the header is missing or unsafe.
3. Responses echo the resolved `X-Request-ID` value.
4. Laravel log context includes `request_id` for request-scoped log entries.
5. Audit-related logs must follow the naming, redaction, retention, and access rules below.

## Request correlation

| Concern | Convention |
|---|---|
| Header | `X-Request-ID` |
| Log context key | `request_id` |
| Generated format | UUID |
| Accepted inbound characters | Letters, numbers, `.`, `_`, `:`, `-` |
| Accepted inbound length | 8 to 128 characters |
| Unsafe inbound IDs | Ignored and replaced with a generated UUID |

Correlation IDs identify a technical request flow. They must not contain email addresses, names, JWTs, API keys, contact import contents, campaign body content, or other personal/business payload data.

## Audit log naming

Audit-related logs must be identifiable without requiring a separate storage system during MVP.

| Field | Convention |
|---|---|
| Event context key | `audit_event` |
| Actor context key | `actor_user_id` |
| Workspace context key | `workspace_id` |
| Entity context key | `entity_type`, `entity_id` |
| Request context key | `request_id` |

Use stable event names in lowercase dot notation, for example `contacts.import.started` or `campaign.delivery.queued`.

## PII and redaction

Logs may include IDs and operational state. Logs must not include raw personal or message content.

Allowed examples:

- internal numeric/UUID identifiers,
- counts,
- status values,
- validation failure categories,
- request IDs.

Forbidden examples:

- email body HTML,
- contact list raw rows,
- access tokens or refresh tokens,
- passwords or secrets,
- full email addresses unless a task explicitly documents a safe masking strategy.

## Retention and access

MVP environments should retain application logs for at least 30 days where storage allows it. Environment examples use `LOG_CHANNEL=stack`, `LOG_STACK=daily`, and `LOG_DAILY_DAYS=30` so Laravel's daily channel applies the retention window by default. Local Docker environments may rotate sooner if disk pressure requires it, but production-like environments must document the effective retention setting.

Access to logs is limited to maintainers operating or debugging SendIO. Logs are operational evidence, not a product-facing audit trail. Product-facing audit history belongs to a future backend reporting/audit task.

## Docker checklist

- `LOG_CHANNEL` and `LOG_STACK` are defined in environment examples.
- `LOG_STACK=daily` and `LOG_DAILY_DAYS=30` are set in environment examples so Laravel's daily log retention setting is active by default.
- Request correlation is validated through Laravel feature tests run via Docker wrapper commands.
- MongoDB `sendio_logs` remains reserved for future structured aggregation; this task does not add MongoDB application integration.

## Non-goals

- No audit storage tables or collections.
- No reporting UI.
- No MongoDB log writer.
- No new runtime, language, framework, or top-level source tree.
