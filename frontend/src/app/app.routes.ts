import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { workspaceGuard } from './core/auth/guards/workspace.guard';

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
    loadComponent: () =>
      import('./features/app/workspace-home-page.component').then((m) => m.WorkspaceHomePageComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: '**', redirectTo: 'auth/login' },
];
