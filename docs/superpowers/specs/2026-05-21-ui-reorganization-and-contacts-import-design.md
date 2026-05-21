# Specification: UI Reorganization, Shell Layout, and Contact Import Enhancements

## Goal
The goal of this task is to reorganize the SendIO frontend UI to establish a clean, consistent shell layout for all authenticated pages. This includes moving ad-hoc page structures into a dedicated layout, implementing a collapsible sidebar, improving the onboarding wizard redirection flow, and redesigning the contacts import screen to use a premium, emoji-free visual style using PrimeNG components and TailwindCSS.

---

## User Review Required
No major architectural blockers are identified, but the design enforces a strict **no-emoji policy** in the interface, replacing all icons with PrimeIcons (`pi pi-*`) or text.

---

## Technical Specifications

### 1. Shell Layout & Routing Restructuring
* **Component:** `AppLayoutComponent` [NEW]
  * **Role:** Serves as the main wrapper template (shell) for the application.
  * **Structure:**
    * **Sidebar (Left Panel):**
      * Contains the brand name "SendIO" (styled text).
      * Workspace selector dropdown (`p-select` or `p-dropdown`).
      * Navigation menu (`p-menu` or custom styled items with TailwindCSS) with routes:
        * Dashboard (`/app`) using `pi pi-home`.
        * Import Contacts (`/app/contacts/import`) using `pi pi-upload`.
      * Supports being collapsed / toggled.
    * **Header (Top Right Panel):**
      * Button to toggle Sidebar collapse (`pi pi-bars`).
      * Language selector (`p-selectbutton` for locale switching).
      * Dark theme switcher (`p-toggleswitch`).
      * User profile / Logout action (`p-button` with `pi pi-power-off`).
    * **Content Area (Main Right Panel):**
      * Scrollable viewport rendering the active child route using `<router-outlet>`.
      * Unified minimal footer at the bottom of the content area showing copyright: "SendIO &copy; 2026. All rights reserved."

* **Routing updates (`app.routes.ts`):**
  Configure the `/app` route path to load the layout shell and register the dashboard and contact import pages as children:
  ```typescript
  export const routes: Routes = [
    {
      path: 'app',
      component: AppLayoutComponent,
      canActivate: [authGuard, workspaceGuard],
      children: [
        {
          path: '',
          loadComponent: () => import('./features/app/workspace-home-page.component').then((m) => m.WorkspaceHomePageComponent),
        },
        {
          path: 'contacts/import',
          loadComponent: () => import('./features/contacts/contacts-import-page.component').then((m) => m.ContactsImportPageComponent),
        },
      ],
    },
    // auth and redirect routes remain unchanged
  ];
  ```

---

### 2. Onboarding Wizard Redirection Flow
* **Workspace Guard (`workspaceGuard.ts`):**
  * Redirects authenticated users without workspace context to `/auth/register`.
* **Registration Page (`RegisterPageComponent`):**
  * Detects if a user is already authenticated via `SessionStore.isAuthenticated()`.
  * If true, it skips Step 1 (Owner registration) and initializes the `step` signal directly to `2` (Workspace Details).
  * Disables navigating back to Step 1.
  * Adjusts the cancel button to safely exit or clear session instead of pointing back to a registration form.

---

### 3. Redesigned Contact Import Screen
* **Drag & Drop CSV Upload Area:**
  * Styled border-dashed interactive container.
  * Dragover, dragleave, and drop event listeners to handle file drop in Angular.
  * Uses `pi pi-cloud-upload` icon.
* **Template Headers Copy & Download:**
  * Displays the expected header format (`email,first_name,last_name,phone`) in a code snippet tag.
  * "Copy Header" button: uses browser Clipboard API to copy the header string.
  * "Download Sample CSV" button: triggers a client-side download of a `.csv` file containing the headers.
* **Summary Metrics Grid:**
  * Uses 3 color-coded semantic panels (`p-card` with customized styled left borders: `border-l-4 border-emerald-500`, `border-l-4 border-amber-500`, and `border-l-4 border-rose-500` respectively).
  * Displays: Processed, Skipped, and Failed row counts.
* **Diagnostic Tables:**
  * Replaces raw tables with `p-table` components.
  * Visualizes skipped and failed rows.
  * Renders error reasons with `p-tag` components of warning / danger severity (e.g. `severity="warn"`, `severity="danger"`).

---

## Verification Plan

### Automated Tests
* Run `pnpm test` to verify all existing component tests pass.
* Write unit tests for:
  * `AppLayoutComponent` to ensure navigation links, toggle, and theme controls render properly.
  * `RegisterPageComponent` to verify it correctly skips Step 1 when session is authenticated.
  * `ContactsImportPageComponent` to cover drag & drop logic, CSV sample download, and metrics rendering.

### Manual Verification
* Access the app as a new user with no workspace and verify redirect automatically lands on Step 2 of the Register/Bootstrap Wizard.
* Switch dark/light modes and languages to ensure layout components render dynamically in both.
* Test Drag & Drop behavior with valid and invalid CSV files, checking visual feedback.
* Validate copy/download features for the CSV header template.
