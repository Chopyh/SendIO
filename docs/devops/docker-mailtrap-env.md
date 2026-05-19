# Docker Mailtrap Environment Contract

This guide defines the Docker-first Mailtrap contract used by SendIO in non-production environments.

## Quick path

1. Copy `.env.example` to `.env` at repository root.
2. Set `MAIL_USERNAME` and `MAIL_PASSWORD` with Mailtrap sandbox SMTP credentials.
3. Start the stack with `./sendio.sh up` (Linux/WSL) or `.\sendio.ps1 up` (Windows).
4. Verify resolved mail settings and SMTP connectivity from the `app` container.

## Environment variable contract

| Variable | Local/CI default | Production behavior |
|---|---|---|
| `MAIL_MAILER` | `smtp` | Must be explicitly overridden per production provider. |
| `MAIL_SCHEME` | `null` | Provider-specific (`tls`/`ssl`) when required. |
| `MAIL_HOST` | `sandbox.smtp.mailtrap.io` | Must NOT use Mailtrap sandbox in production. |
| `MAIL_PORT` | `2525` | Provider-specific SMTP port. |
| `MAIL_USERNAME` | `mailtrap_user` placeholder | Real secret via environment/secret manager. |
| `MAIL_PASSWORD` | `mailtrap_password` placeholder | Real secret via environment/secret manager. |
| `MAIL_FROM_ADDRESS` | `no-reply@sendio.local` | Production sender domain/policy required. |
| `MAIL_FROM_NAME` | `${APP_NAME}` | Keep explicit product sender name. |

## Non-production safety rules

- Non-production (`local`, `testing`, `staging`, CI previews) must route to Mailtrap sandbox SMTP.
- Do not use real customer inboxes for local or CI validation.
- Placeholder credentials in example files are intentionally invalid and must be replaced in private environment files.

## Local verification in Docker runtime

Run all checks through Docker wrappers only.

### 1) Verify resolved Laravel mail configuration

```bash
./sendio.sh art config:show mail
```

Expected:
- `default` equals `smtp`
- `mailers.smtp.host` equals `sandbox.smtp.mailtrap.io`
- `mailers.smtp.port` equals `2525`

### 2) Verify SMTP reachability from `app` container

```bash
./sendio.sh sh
# inside container
php -r 'echo gethostbyname("sandbox.smtp.mailtrap.io") . PHP_EOL;'
```

Expected:
- Host resolves to a public IP (not `sandbox.smtp.mailtrap.io` literal value).

### 3) Optional smoke send through Laravel

```bash
./sendio.sh art tinker --execute='\Illuminate\Support\Facades\Mail::raw("SendIO Mailtrap smoke test", function ($message) { $message->to("sandbox@example.test")->subject("SendIO Mailtrap smoke test"); });'
```

Expected:
- Command exits successfully.
- Message appears in configured Mailtrap sandbox inbox.

## CI usage

- Provide `MAIL_USERNAME` and `MAIL_PASSWORD` as CI secrets.
- Keep Mailtrap SMTP host/port defaults unless your CI requires explicit overrides.
- Run the same Docker-based config check as a pre-test guard:

```bash
./sendio.sh art config:show mail
```

Fail the pipeline if the resolved host is not Mailtrap sandbox for non-production jobs.
