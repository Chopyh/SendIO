# Production Demo Data

SendIO production demo data is seeded manually through Laravel's `DemoDataSeeder`. The seeder is idempotent: running it again updates the same demo accounts, users, workspaces, contacts, templates, and campaign records instead of creating duplicates.

## Quick Path

1. Deploy the latest `dev` branch in Dokploy.
2. Open a shell/terminal for the backend `app` service.
3. Run `php artisan db:seed --class=DemoDataSeeder --force`.
4. Log in with one of the demo users and verify workspaces, contacts, templates, campaigns, and reporting screens.

## Demo Users

| Email | Role | Workspace | Password |
|---|---|---|---|
| `owner@sendio.test` | Owner | SendIO Demo Workspace | `password` |
| `editor@sendio.test` | Editor | SendIO Demo Workspace | `password` |
| `viewer@sendio.test` | Viewer | SendIO Demo Workspace | `password` |
| `isolation-owner@sendio.test` | Owner | SendIO Isolation Workspace | `password` |
| `empty@sendio.test` | No workspace | None | `password` |

## Seeded Data

| Area | Data |
|---|---|
| Accounts | Demo and isolation accounts for workspace-scope validation. |
| Workspaces | One English demo workspace and one Spanish isolation workspace. |
| Contacts | Segmented contacts across newsletter, leads, trial, and customers. |
| Component library | Reusable text, CTA button, and compliance footer components. |
| Templates | Published welcome, newsletter, and product launch templates with unsubscribe compliance. |
| Campaigns | Draft, queued, running, completed, and failed campaign examples. |
| Delivery data | Campaign recipients and delivery attempts for reporting/monitoring demos. |

## Safety Contract

- The seeder does not dispatch jobs.
- The seeder does not send emails.
- Contact emails use `example.test` domains.
- Campaign records simulate delivery states and attempts only.
- Demo data is identifiable by names prefixed with `SendIO`, `Demo`, or descriptive campaign titles.

## Verification

Run these commands from the backend container after seeding:

```bash
php artisan db:seed --class=DemoDataSeeder --force
php artisan tinker --execute='echo App\\Models\\Campaign::count();'
```

Expected result: campaign, template, contact, and workspace records exist without queue jobs being dispatched by the seeder.
