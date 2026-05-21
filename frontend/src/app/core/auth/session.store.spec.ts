import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { SessionStore } from './session.store';

describe('SessionStore', () => {
  let store: SessionStore;
  let authApi: {
    login: ReturnType<typeof vi.fn>;
    me: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    authApi = {
      login: vi.fn(),
      me: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthApiService, useValue: authApi }],
    });

    store = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('hydrates the current user from the backend auth me response shape after login', async () => {
    authApi.login.mockReturnValue(
      of({
        data: {
          access_token: 'jwt-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_ttl: 1209600,
        },
      }),
    );
    authApi.me.mockReturnValue(
      of({
        data: {
          id: 'user-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          workspaces: [{ id: 'workspace-1', name: 'Main Workspace', role: 'owner' }],
        },
      }),
    );

    await store.login('jane@example.com', 'password');

    expect(store.token()).toBe('jwt-token');
    expect(store.user()?.email).toBe('jane@example.com');
    expect(store.memberships()).toEqual([
      { workspace_id: 'workspace-1', workspace_name: 'Main Workspace', role: 'owner' },
    ]);
    expect(store.activeWorkspaceId()).toBe('workspace-1');
  });
});
