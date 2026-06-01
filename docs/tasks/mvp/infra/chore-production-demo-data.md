# Production Demo Data Seeder

## Scope

Extend SendIO demo data so production demos can show the complete MVP surface without manual database editing.

## Deliverables

- Idempotent accounts, workspaces, users, memberships, and contacts.
- Component library records for reusable email builder blocks.
- Published templates with canonical snapshot payloads and variable usages.
- Campaign records across draft, queued, running, completed, and failed states.
- Campaign recipients and delivery attempts for monitoring/reporting screens.
- Production execution documentation.

## Acceptance Criteria

- Running `php artisan db:seed --class=DemoDataSeeder --force` multiple times does not duplicate demo data.
- Seeded contacts use non-routable `example.test` domains.
- Seeded campaigns do not dispatch jobs or send emails.
- Demo users can exercise workspace roles and empty-workspace behavior.
- Documentation explains how to run the seeder in Dokploy.

## Checklist

- [x] Extend `DemoDataSeeder` beyond accounts/workspaces/users/contacts.
- [x] Add templates, template versions, variable usages, component library records, campaigns, recipients, and attempts.
- [x] Document safe production execution.
- [x] Index documentation and task files.
