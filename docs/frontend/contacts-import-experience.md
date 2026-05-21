# Contacts Import Experience

This document defines the MVP frontend behavior for importing contacts from a CSV file inside an authenticated workspace.

## Quick path

1. Open `/app/contacts/import` from an authenticated workspace session.
2. Select a `.csv` file with the exact header order `email,first_name,last_name,phone`.
3. Run the import and review the processed, skipped, and failed row summary.

## Scope

| Topic | Decision |
|---|---|
| MVP format | CSV only. JSON, pasted lists, and disabled future format affordances are out of scope. |
| Route | `/app/contacts/import`, protected by the existing auth and workspace guards. |
| API | `POST /api/contacts/import` with multipart field `file`. |
| Workspace context | The existing workspace interceptor adds `X-Workspace-Id`. |
| UI states | `idle`, `selected`, `uploading`, `success`, and `error`. |
| i18n | All visible copy has English and Spanish translations. |
| Styling | PrimeNG components with TailwindCSS utilities. |

## User feedback

| Situation | Frontend behavior |
|---|---|
| No file selected | Import remains disabled and the page can show a localized file-required message. |
| Non-CSV file selected | Selection is rejected before upload with a localized CSV-only message. |
| Import is running | The import action shows loading state and a processing status. |
| Import succeeds without issues | Summary cards show processed, skipped, and failed totals with a success message. |
| Import succeeds with skipped or failed rows | Summary cards remain visible and row diagnostics are rendered for skipped and failed details. |
| API validation error | The page tells the user to confirm the file and required header order. |
| Auth/workspace error | The page gives a localized action: sign in again, select a workspace, or choose an allowed workspace. |

## CSV input note

The file picker uses a native file input instead of PrimeNG `p-fileupload` because this MVP owns upload execution through `ContactsImportApiService` and must keep the request contract explicit. PrimeNG direct selectors are still used for cards, buttons, progress, and tables; the native file input keeps browser file selection semantics without delegating upload behavior to a widget.

## Validation checklist

- [x] Route is workspace protected.
- [x] File selection validates CSV extension and practical CSV MIME types before upload.
- [x] Import calls the documented backend endpoint with multipart field `file`.
- [x] Success summaries display processed, skipped, and failed totals.
- [x] Skipped and failed row diagnostics are visible when returned by the API.
- [x] API and HTTP errors are mapped to localized actionable messages.

## Next step

Use this behavior contract with `docs/tasks/mvp/front/feat-contacts-import-experience.md` to validate the MVP frontend task.
