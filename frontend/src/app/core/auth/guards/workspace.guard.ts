import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../session.store';

export const workspaceGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  if (sessionStore.hasWorkspace()) {
    return true;
  }

  const firstMembership = sessionStore.memberships()[0]?.workspace_id;
  if (firstMembership) {
    sessionStore.setActiveWorkspace(firstMembership);
    return true;
  }

  return router.createUrlTree(['/auth/register']);
};
