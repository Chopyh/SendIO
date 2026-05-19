import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStore } from '../session.store';

export const workspaceInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionStore = inject(SessionStore);
  const workspaceId = sessionStore.activeWorkspaceId();

  if (!workspaceId || req.url.endsWith('/api/workspaces/bootstrap')) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'X-Workspace-Id': workspaceId } }));
};
