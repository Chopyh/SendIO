# Auth and Workspace Onboarding Requirements

This document defines the MVP frontend requirements for account creation, sign-in, and first workspace onboarding. The target experience is a guided wizard where a new user creates an account and, as part of the same flow, creates their first workspace.

## Quick path

1. A new user starts from the auth entry page.
2. The user creates their account with the minimum owner identity and credential fields.
3. The wizard immediately collects first workspace details.
4. The app authenticates the user, bootstraps the workspace, stores the selected workspace context, and redirects to the first protected workspace area.

## Product decision

| Topic | Requirement |
|---|---|
| Onboarding model | Account creation and first workspace creation are one guided flow. |
| Workspace requirement | A user must have an active workspace context before accessing workspace-scoped features. |
| API URL convention | Frontend calls use `/api/...` paths. URL API versioning such as `/api/v1/...` is not allowed. |
| Language support | MVP onboarding labels and validation messages must support English (`en`) and Spanish (`es`). |
| UI stack | Screens must use PrimeNG components and TailwindCSS utilities. |

## Required screens

### 1. Auth entry

The auth entry screen lets users choose between signing in or creating a new account.

Required elements:

| Element | Type | Required | Notes |
|---|---|---:|---|
| Email | Email input | Yes | Used for sign-in. |
| Password | Password input | Yes | Used for sign-in. |
| Sign in action | Button | Yes | Calls the login flow. |
| Create account action | Button/link | Yes | Starts the account and workspace wizard. |
| Language selector | Select/toggle | Yes | Supports `en` and `es` labels. |

### 2. Account creation step

The account step captures the first owner user. This is the identity that will own the initial account/workspace relationship.

Required inputs:

| Field | Type | Required | Validation | Notes |
|---|---|---:|---|---|
| First name | Text | Yes | Non-empty, reasonable length | Used for owner profile display. |
| Last name | Text | Yes | Non-empty, reasonable length | Used for owner profile display. |
| Email | Email | Yes | Valid email format | Must become the login identifier. |
| Password | Password | Yes | Minimum security policy | Exact password rules should match backend validation. |
| Confirm password | Password | Yes | Must match password | Frontend validates before submit. |
| Preferred language | Select | Yes | `en` or `es` | Seeds user/app language preference. |
| Terms acceptance | Checkbox | Yes | Must be checked | Required before account creation. |

Expected outcome:

- A user account exists.
- The user can be authenticated immediately after creation.
- If backend registration is not available yet, this is an API gap that must be resolved before the full wizard can be completed end-to-end.

### 3. First workspace step

The workspace step creates the first workspace for the newly created account owner.

Required inputs:

| Field | Type | Required | Validation | Backend mapping |
|---|---|---:|---|---|
| Account name | Text | Yes | Non-empty, reasonable length | `account_name` |
| Workspace name | Text | Yes | Non-empty, reasonable length | `workspace_name` |
| Timezone | Select | Yes | Valid timezone identifier | `timezone` |
| Default locale | Select | Yes | `en` or `es` | `locale_default` |

Default behavior:

- Account name may be prefilled from the user's company/project name if such a field is added later.
- Workspace name may default to `Main Workspace` / `Workspace principal` but must remain editable.
- Timezone may default to the browser-detected timezone.
- Default locale may default to the currently selected UI language.

### 4. Workspace confirmation step

The confirmation step shows what will be created before final submission.

Required summary:

| Summary item | Source |
|---|---|
| Owner name | Account creation step |
| Owner email | Account creation step |
| Account name | Workspace step |
| Workspace name | Workspace step |
| Timezone | Workspace step |
| Default locale | Workspace step |

Required actions:

- Back: returns to previous step without losing entered values.
- Create workspace: submits the bootstrap request.
- Cancel: returns to auth entry and clears unsaved wizard state after confirmation.

## Existing backend contract

The current backend auth/workspace contract includes:

| Action | Endpoint | Notes |
|---|---|---|
| Sign in | `POST /api/auth/login` | Accepts `email` and `password`. |
| Current user | `GET /api/auth/me` | Returns current user and workspace memberships. |
| Workspace bootstrap | `POST /api/workspaces/bootstrap` | Creates first account/workspace for an authenticated user. |
| Current workspace | `GET /api/workspaces/current` | Requires `Authorization` and `X-Workspace-Id`. |

Current bootstrap payload:

```json
{
  "account_name": "Acme Account",
  "workspace_name": "Acme Main",
  "timezone": "UTC",
  "locale_default": "en"
}
```

## API gap for account creation

The desired wizard requires account registration, but the current documented backend contract only covers login and authenticated workspace bootstrap.

Required backend capability for the full desired flow:

| Needed action | Required behavior |
|---|---|
| Register owner user | Create the first user account from name, email, password, preferred language, and terms acceptance. |
| Authenticate after registration | Return an access token or allow immediate login with the created credentials. |
| Bootstrap first workspace | Create account, workspace, and owner membership after authentication. |

Until registration exists, the frontend can implement the UI and state model, but the complete account creation flow cannot be fully integrated end-to-end.

## Session and routing requirements

| Requirement | Behavior |
|---|---|
| Token storage | Store the access token only through the chosen frontend session service. |
| Workspace context | Store the selected `workspace_id` after bootstrap or selection. |
| Protected routes | Redirect unauthenticated users to auth entry. |
| Workspace-scoped routes | Redirect authenticated users without workspace context to workspace onboarding/selection. |
| Logout | Clear token, workspace context, and in-memory auth state. |
| Reload recovery | On app startup, restore token/workspace context and validate with backend when possible. |

## Error states

| Error | User-facing behavior |
|---|---|
| Invalid credentials | Stay on sign-in form and show localized error. |
| Validation failure | Show field-level messages where possible. |
| Existing membership during bootstrap | Redirect to workspace selection/current workspace instead of looping. |
| Missing workspace context | Redirect to workspace selection/onboarding. |
| Forbidden workspace | Clear invalid workspace selection and request a valid workspace. |
| Network/server failure | Show retryable localized message. |

## i18n requirements

Minimum translation groups:

| Group | Example keys |
|---|---|
| Auth | sign in title, email, password, create account, invalid credentials |
| Account wizard | first name, last name, confirm password, preferred language, terms acceptance |
| Workspace wizard | account name, workspace name, timezone, default locale, create workspace |
| Validation | required field, invalid email, password mismatch, terms required |
| Session | unauthorized, workspace required, forbidden workspace, logout |

All visible onboarding text must exist in English and Spanish before the task is complete.

## Acceptance checklist

- [x] User can sign in with email and password.
- [x] User can start the create-account wizard.
- [x] Wizard captures owner identity, credentials, first workspace details, timezone, and locale.
- [x] Wizard validates required fields before submission.
- [x] Authenticated user can bootstrap the first workspace.
- [x] App stores the selected workspace context after bootstrap.
- [x] Protected routes redirect unauthenticated users to auth.
- [x] Workspace-scoped routes redirect users without workspace context to onboarding/selection.
- [x] English and Spanish onboarding labels are available.
- [x] PrimeNG components and TailwindCSS utilities are used for MVP UI.
- [x] Automated tests cover guard behavior and onboarding transitions.

## MVP implementation note

The owner account registration API remains an explicit backend gap. The frontend wizard includes full UI/form coverage for account data and keeps registration behavior encapsulated at service level without inventing undocumented backend endpoints.

## Next step

Use this requirements document to design and implement `MVP-FRONT-001` on branch `front/feat-auth-workspace-onboarding`.
