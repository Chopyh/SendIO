# Frontend UI Reorganization & Layout Architecture

This document describes the design, routing changes, and component enhancements introduced to reorganize the SendIO frontend UI.

---

## 1. Shell Layout Architecture

To prevent layout redundancy across views under `/app`, we introduced a master container:
* **`AppLayoutComponent`:** Serves as the primary shell layout.
  * **Sidebar (Left Panel):**
    * Display brand name ("SendIO"). Supports toggle between wide (`w-64`) and collapsed (`w-16`) states.
    * Active Workspace Selector (`p-select`) populated from user memberships. Only rendered in expanded state.
    * Navigation menu links (`Dashboard` and `Import Contacts`) styled with Tailwind and active route classes.
  * **Header (Top Panel):**
    * Collapsible sidebar button (`pi pi-bars`).
    * Dark theme toggle switch (`p-toggleswitch`) connected to `ThemeStore`.
    * Language selector buttons (`p-selectbutton`) connected to `I18nStore`.
    * Sign Out action button (`pi pi-power-off`).
  * **Main Viewport & Footer:**
    * Scrollable area rendering the active child route using `<router-outlet>`.
    * A minimal copyright footer displayed at the bottom of the viewport content.

---

## 2. Routing Reorganization

Rutas in `app.routes.ts` are restructured to render pages under the layout path wrapper, keeping active guards (`authGuard` and `workspaceGuard`) on the parent:

```typescript
export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register-page.component').then((m) => m.RegisterPageComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard, workspaceGuard],
    loadComponent: () => import('./features/app/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/app/workspace-home-page.component').then((m) => m.WorkspaceHomePageComponent),
      },
      {
        path: 'contacts/import',
        loadComponent: () =>
          import('./features/contacts/contacts-import-page.component').then((m) => m.ContactsImportPageComponent),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: '**', redirectTo: 'auth/login' },
];
```

---

## 3. Onboarding Wizard Redirection Flow

If a user logs in but does not have a workspace, the guard redirects them to `/auth/register`.
* **Skipping Step 1:** Inside `RegisterPageComponent.ngOnInit()`, if `SessionStore.isAuthenticated()` returns `true`, the wizard initializes `step` directly to `2` (Workspace Details), completely skipping Step 1.
* **Disabled Back Navigation:** Back navigation is disabled for authenticated users on Step 2.
* **Safer Cancel Action:** Clicking "Cancel" triggers `SessionStore.logout()` before redirecting back to `/auth/login` to prevent redirection loops.

---

## 4. Redesigned Contact Import Experience

The import interface has been upgraded to a premium look using PrimeNG components and TailwindCSS, strictly enforcing a **no-emoji policy** in the labels, tables, and buttons:
* **Drag & Drop CSV Box:** A border-dashed reactive upload area that responds to dragover, dragleave, and drop events.
* **Template Headers Copy & Download:**
  * Copy: Uses browser Clipboard API to copy `email,first_name,last_name,phone` headers.
  * Download: Generates a CSV file blob client-side and triggers download.
* **Metrics Cards Dashboard:** Renders summary results inside `p-card` layouts with color-coded left borders and PrimeIcons (`pi pi-check-circle` for processed, `pi pi-exclamation-triangle` for skipped, and `pi pi-times-circle` for failed rows).
* **Diagnostic Error Tables:** Renders row diagnostic data using `p-table` and styling reason details using `p-tag` badge modules.
