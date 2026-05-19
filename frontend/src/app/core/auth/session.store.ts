import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { Membership, User } from './auth.models';

const TOKEN_KEY = 'sendio.accessToken';
const WORKSPACE_KEY = 'sendio.workspaceId';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly authApi = inject(AuthApiService);

  private readonly tokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<User | null>(null);
  private readonly membershipsSignal = signal<Membership[]>([]);
  private readonly activeWorkspaceIdSignal = signal<string | null>(null);
  private readonly initializedSignal = signal(false);

  readonly token = computed(() => this.tokenSignal());
  readonly user = computed(() => this.userSignal());
  readonly memberships = computed(() => this.membershipsSignal());
  readonly activeWorkspaceId = computed(() => this.activeWorkspaceIdSignal());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly hasWorkspace = computed(() => !!this.activeWorkspaceIdSignal());
  readonly isInitialized = computed(() => this.initializedSignal());
  readonly hasMemberships = computed(() => this.membershipsSignal().length > 0);

  async initialize(): Promise<void> {
    this.tokenSignal.set(localStorage.getItem(TOKEN_KEY));
    this.activeWorkspaceIdSignal.set(localStorage.getItem(WORKSPACE_KEY));

    if (this.tokenSignal()) {
      try {
        await this.hydrateCurrentUser();
      } catch {
        this.logout();
      }
    }

    this.initializedSignal.set(true);
  }

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(this.authApi.login(email, password));
    const token = response.data.access_token;
    this.tokenSignal.set(token);
    localStorage.setItem(TOKEN_KEY, token);
    await this.hydrateCurrentUser();
  }

  async hydrateCurrentUser(): Promise<void> {
    const response = await firstValueFrom(this.authApi.me());
    this.userSignal.set(response.data.user);
    this.membershipsSignal.set(response.data.memberships ?? []);

    const activeWorkspace = this.activeWorkspaceIdSignal();
    if (!activeWorkspace && response.data.memberships.length > 0) {
      this.setActiveWorkspace(response.data.memberships[0].workspace_id);
    }
  }

  setActiveWorkspace(workspaceId: string): void {
    this.activeWorkspaceIdSignal.set(workspaceId);
    localStorage.setItem(WORKSPACE_KEY, workspaceId);
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.membershipsSignal.set([]);
    this.activeWorkspaceIdSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
    this.initializedSignal.set(true);
  }
}
