export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface WorkspaceMemberDto {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface WorkspaceInvitationDto {
  id: string;
  workspace_id: string;
  workspace_name?: string;
  email: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  has_account?: boolean;
}

export interface ApiDataResponse<T> {
  data: T;
}
