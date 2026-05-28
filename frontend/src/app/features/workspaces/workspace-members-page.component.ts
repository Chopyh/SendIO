import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { I18nStore } from '../../core/i18n/i18n.store';
import { SessionStore } from '../../core/auth/session.store';
import { WorkspaceMembersApiService } from '../../core/workspaces/workspace-members-api.service';
import { WorkspaceInvitationDto, WorkspaceMemberDto } from '../../core/workspaces/workspace-members.models';

@Component({
  selector: 'app-workspace-members-page',
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, SelectModule, TableModule],
  templateUrl: './workspace-members-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceMembersPageComponent {
  readonly i18nStore = inject(I18nStore);
  private readonly sessionStore = inject(SessionStore);
  private readonly api = inject(WorkspaceMembersApiService);
  readonly isOwner = computed(() => {
    const workspaceId = this.sessionStore.activeWorkspaceId();
    const membership = this.sessionStore.memberships().find((item) => item.workspace_id === workspaceId);
    return membership?.role?.toLowerCase() === 'owner';
  });
  readonly members = signal<WorkspaceMemberDto[]>([]);
  readonly invitations = signal<WorkspaceInvitationDto[]>([]);
  readonly roleOptions = computed(() => [
    { label: this.i18nStore.t('members.roles.editor'), value: 'editor' as const },
    { label: this.i18nStore.t('members.roles.viewer'), value: 'viewer' as const },
  ]);

  readonly inviteForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<'editor' | 'viewer'>('viewer', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    const members = await firstValueFrom(this.api.listMembers());
    const invitations = await firstValueFrom(this.api.listInvitations());
    this.members.set(members.data);
    this.invitations.set(invitations.data);
  }

  async invite(): Promise<void> {
    this.inviteForm.markAllAsTouched();
    if (this.inviteForm.invalid || !this.isOwner()) {
      return;
    }

    const value = this.inviteForm.getRawValue();
    await firstValueFrom(this.api.createInvitation(value.email, value.role));
    this.inviteForm.reset({ email: '', role: 'viewer' });
    await this.load();
  }

  async changeRole(memberId: string, role: 'editor' | 'viewer'): Promise<void> {
    if (!this.isOwner()) {
      return;
    }

    await firstValueFrom(this.api.updateMemberRole(memberId, role));
    await this.load();
  }

  async removeMember(memberId: string): Promise<void> {
    if (!this.isOwner()) {
      return;
    }

    await firstValueFrom(this.api.removeMember(memberId));
    await this.load();
  }

  async revokeInvitation(invitationId: string): Promise<void> {
    if (!this.isOwner()) {
      return;
    }

    await firstValueFrom(this.api.revokeInvitation(invitationId));
    await this.load();
  }

  roleLabel(role: string): string {
    return this.i18nStore.t(`members.roles.${role.toLowerCase()}`);
  }

  statusLabel(status: string): string {
    return this.i18nStore.t(`members.status.${status.toLowerCase()}`);
  }
}
