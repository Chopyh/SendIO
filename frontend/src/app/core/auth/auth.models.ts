export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_ttl: number;
}

export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

export interface Membership {
  workspace_id: string;
  workspace_name?: string;
  account_id?: string;
  role?: string;
}

export interface MeResponse {
  data: {
    user: User;
    memberships: Membership[];
  };
}

export interface TokenResponse {
  data: AuthToken;
}

export interface BootstrapWorkspaceRequest {
  account_name: string;
  workspace_name: string;
  timezone: string;
  locale_default: 'en' | 'es';
}

export interface WorkspaceResponse {
  data: {
    workspace_id: string;
    workspace_name?: string;
  };
}
