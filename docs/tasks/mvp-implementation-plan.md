# MVP Implementation Plan

This plan segments MVP implementation work into reviewable tasks grouped by area and tied to explicit branch state names.

## Overview Table

| Task ID | Area | Category | Branch Name | File | Dependencies | Status |
|---|---|---|---|---|---|---|
| MVP-INFRA-001 | Infra | chore | `infra/chore-docker-mailtrap-env` | `docs/tasks/mvp/infra/chore-docker-mailtrap-env.md` | None | pending |
| MVP-INFRA-002 | Infra | chore | `infra/chore-observability-audit-baseline` | `docs/tasks/mvp/infra/chore-observability-audit-baseline.md` | MVP-INFRA-001 | pending |
| MVP-BACK-001 | Back | feat | `back/feat-auth-workspace-bootstrap` | `docs/tasks/mvp/back/feat-auth-workspace-bootstrap.md` | MVP-INFRA-001 | pending |
| MVP-BACK-002 | Back | feat | `back/feat-contacts-import-pipeline` | `docs/tasks/mvp/back/feat-contacts-import-pipeline.md` | MVP-BACK-001 | pending |
| MVP-BACK-003 | Back | feat | `back/feat-templates-components-variables-api` | `docs/tasks/mvp/back/feat-templates-components-variables-api.md` | MVP-BACK-001 | pending |
| MVP-BACK-004 | Back | feat | `back/feat-campaign-delivery-mailtrap` | `docs/tasks/mvp/back/feat-campaign-delivery-mailtrap.md` | MVP-BACK-002, MVP-BACK-003, MVP-INFRA-001 | pending |
| MVP-BACK-005 | Back | feat | `back/feat-reporting-audit-trail` | `docs/tasks/mvp/back/feat-reporting-audit-trail.md` | MVP-BACK-004, MVP-INFRA-002 | pending |
| MVP-FRONT-001 | Front | feat | `front/feat-auth-workspace-onboarding` | `docs/tasks/mvp/front/feat-auth-workspace-onboarding.md` | MVP-BACK-001 | pending |
| MVP-FRONT-002 | Front | feat | `front/feat-contacts-import-experience` | `docs/tasks/mvp/front/feat-contacts-import-experience.md` | MVP-BACK-002 | pending |
| MVP-FRONT-003 | Front | feat | `front/feat-template-builder-mvp` | `docs/tasks/mvp/front/feat-template-builder-mvp.md` | MVP-BACK-003 | completed |
| MVP-FRONT-004 | Front | feat | `front/feat-campaign-monitoring` | `docs/tasks/mvp/front/feat-campaign-monitoring.md` | MVP-BACK-004, MVP-BACK-005 | pending |

## Notes

- All branch names follow the required state convention: `{area}/{type}-{branch-name}`.
- Task execution MUST follow the ordered global execution queue in this document.
- Backend/frontend-specific readiness does not override the global queue order.
- Validation must be run through Docker-based workflows as defined by project standards.

## Execution Queue (Ready for Tomorrow)

1. `infra/chore-docker-mailtrap-env`
2. `back/feat-auth-workspace-bootstrap`
3. `front/feat-auth-workspace-onboarding`
4. `infra/chore-observability-audit-baseline`
5. `back/feat-contacts-import-pipeline`
6. `front/feat-contacts-import-experience`
7. `back/feat-templates-components-variables-api`
8. `front/feat-template-builder-mvp`
9. `back/feat-campaign-delivery-mailtrap`
10. `back/feat-reporting-audit-trail`
11. `front/feat-campaign-monitoring`

## Frontend UI Standard (Mandatory)

- All frontend MVP tasks MUST use **PrimeNG components** and **TailwindCSS utilities**.
- PrimeNG provides base UI components; TailwindCSS is used for layout, spacing, and utility styling.
- Use direct PrimeNG component selectors whenever available, for example `<p-button>` instead of `pButton` on a native `<button>`.
- PrimeNG attribute directives are allowed only when the installed PrimeNG package does not provide an equivalent `p-*` component selector.
- Any deviation must be explicitly documented in the task file with technical justification.
