import { Routes } from '@angular/router';
import { authGuard, guestGuard, registerGuard } from './core/auth/guards/auth.guard';
import { workspaceGuard } from './core/auth/guards/workspace.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'auth/register',
    canActivate: [registerGuard],
    loadComponent: () => import('./features/auth/register/register-page.component').then((m) => m.RegisterPageComponent),
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
      {
        path: 'templates',
        loadComponent: () =>
          import('./features/templates/templates-list/templates-list-page.component').then((m) => m.TemplatesListPageComponent),
      },
      {
        path: 'templates/:id/edit',
        loadComponent: () =>
          import('./features/templates/template-editor/template-editor-page.component').then((m) => m.TemplateEditorPageComponent),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: '**', redirectTo: 'auth/login' },
];
