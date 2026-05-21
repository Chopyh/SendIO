import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SessionStore } from '../session.store';
import { authGuard, guestGuard, registerGuard } from './auth.guard';
import { workspaceGuard } from './workspace.guard';

describe('auth guards', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SessionStore,
          useValue: {
            isAuthenticated: () => false,
            hasWorkspace: () => false,
            memberships: () => [],
            setActiveWorkspace: () => undefined,
          },
        },
        {
          provide: Router,
          useValue: {
            createUrlTree: (commands: string[]) => ({ commands }),
          },
        },
      ],
    });
  });

  it('redirects unauthenticated user to login', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(null as never, null as never));
    expect(result).toEqual({ commands: ['/auth/login'] });
  });

  it('redirects authenticated user without workspace to register', () => {
    const sessionStore = TestBed.inject(SessionStore) as unknown as {
      isAuthenticated: () => boolean;
      hasWorkspace: () => boolean;
    };
    sessionStore.isAuthenticated = () => true;

    const authResult = TestBed.runInInjectionContext(() => authGuard(null as never, null as never));
    expect(authResult).toBe(true);

    const workspaceResult = TestBed.runInInjectionContext(() => workspaceGuard(null as never, null as never));
    expect(workspaceResult).toEqual({ commands: ['/auth/register'] });
  });

  it('activates first membership when workspace is not selected yet', () => {
    const sessionStore = TestBed.inject(SessionStore) as unknown as {
      memberships: () => Array<{ workspace_id: string }>;
      setActiveWorkspace: (workspaceId: string) => void;
    };
    let selectedWorkspace = '';
    sessionStore.memberships = () => [{ workspace_id: 'w-1' }];
    sessionStore.setActiveWorkspace = (workspaceId: string) => {
      selectedWorkspace = workspaceId;
    };

    const result = TestBed.runInInjectionContext(() => workspaceGuard(null as never, null as never));

    expect(result).toBe(true);
    expect(selectedWorkspace).toBe('w-1');
  });

  describe('guestGuard', () => {
    it('redirects authenticated user to /app', () => {
      const sessionStore = TestBed.inject(SessionStore) as unknown as {
        isAuthenticated: () => boolean;
      };
      sessionStore.isAuthenticated = () => true;

      const result = TestBed.runInInjectionContext(() => guestGuard(null as never, null as never));
      expect(result).toEqual({ commands: ['/app'] });
    });

    it('allows unauthenticated user to access route', () => {
      const sessionStore = TestBed.inject(SessionStore) as unknown as {
        isAuthenticated: () => boolean;
      };
      sessionStore.isAuthenticated = () => false;

      const result = TestBed.runInInjectionContext(() => guestGuard(null as never, null as never));
      expect(result).toBe(true);
    });
  });

  describe('registerGuard', () => {
    it('redirects authenticated user with workspace to /app', () => {
      const sessionStore = TestBed.inject(SessionStore) as unknown as {
        isAuthenticated: () => boolean;
        hasWorkspace: () => boolean;
      };
      sessionStore.isAuthenticated = () => true;
      sessionStore.hasWorkspace = () => true;

      const result = TestBed.runInInjectionContext(() => registerGuard(null as never, null as never));
      expect(result).toEqual({ commands: ['/app'] });
    });

    it('allows authenticated user without workspace to access route', () => {
      const sessionStore = TestBed.inject(SessionStore) as unknown as {
        isAuthenticated: () => boolean;
        hasWorkspace: () => boolean;
      };
      sessionStore.isAuthenticated = () => true;
      sessionStore.hasWorkspace = () => false;

      const result = TestBed.runInInjectionContext(() => registerGuard(null as never, null as never));
      expect(result).toBe(true);
    });

    it('allows unauthenticated user to access route', () => {
      const sessionStore = TestBed.inject(SessionStore) as unknown as {
        isAuthenticated: () => boolean;
        hasWorkspace: () => boolean;
      };
      sessionStore.isAuthenticated = () => false;
      sessionStore.hasWorkspace = () => false;

      const result = TestBed.runInInjectionContext(() => registerGuard(null as never, null as never));
      expect(result).toBe(true);
    });
  });
});
