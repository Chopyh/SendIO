import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiDataResponse, WorkspaceInvitationDto, WorkspaceMemberDto, WorkspaceRole } from './workspace-members.models';

@Injectable({ providedIn: 'root' })
export class WorkspaceMembersApiService {
  private readonly http = inject(HttpClient);

  listMembers(): Observable<ApiDataResponse<WorkspaceMemberDto[]>> {
    return this.http.get<ApiDataResponse<WorkspaceMemberDto[]>>('/api/workspaces/members');
  }

  updateMemberRole(memberId: string, role: Extract<WorkspaceRole, 'editor' | 'viewer'>): Observable<ApiDataResponse<WorkspaceMemberDto>> {
    return this.http.patch<ApiDataResponse<WorkspaceMemberDto>>(`/api/workspaces/members/${memberId}`, { role });
  }

  removeMember(memberId: string): Observable<ApiDataResponse<{ removed: boolean; member_id: string }>> {
    return this.http.delete<ApiDataResponse<{ removed: boolean; member_id: string }>>(`/api/workspaces/members/${memberId}`);
  }

  listInvitations(): Observable<ApiDataResponse<WorkspaceInvitationDto[]>> {
    return this.http.get<ApiDataResponse<WorkspaceInvitationDto[]>>('/api/workspaces/invitations');
  }

  createInvitation(email: string, role: 'editor' | 'viewer'): Observable<ApiDataResponse<WorkspaceInvitationDto>> {
    return this.http.post<ApiDataResponse<WorkspaceInvitationDto>>('/api/workspaces/invitations', { email, role });
  }

  revokeInvitation(invitationId: string): Observable<ApiDataResponse<WorkspaceInvitationDto>> {
    return this.http.post<ApiDataResponse<WorkspaceInvitationDto>>(`/api/workspaces/invitations/${invitationId}/revoke`, {});
  }

  resolveInvitation(token: string): Observable<ApiDataResponse<WorkspaceInvitationDto>> {
    return this.http.get<ApiDataResponse<WorkspaceInvitationDto>>(`/api/workspaces/invitations/resolve/${token}`);
  }

  acceptInvitation(token: string): Observable<ApiDataResponse<WorkspaceInvitationDto>> {
    return this.http.post<ApiDataResponse<WorkspaceInvitationDto>>('/api/workspaces/invitations/accept', { token });
  }
}
