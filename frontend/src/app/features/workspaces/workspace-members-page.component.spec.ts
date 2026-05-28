import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { WorkspaceMembersApiService } from '../../core/workspaces/workspace-members-api.service';
import { WorkspaceMembersPageComponent } from './workspace-members-page.component';

describe('WorkspaceMembersPageComponent', () => {
  let fixture: ComponentFixture<WorkspaceMembersPageComponent>;
  let component: WorkspaceMembersPageComponent;
  let api: {
    listMembers: ReturnType<typeof vi.fn>;
    listInvitations: ReturnType<typeof vi.fn>;
    createInvitation: ReturnType<typeof vi.fn>;
    updateMemberRole: ReturnType<typeof vi.fn>;
    removeMember: ReturnType<typeof vi.fn>;
    revokeInvitation: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = {
      listMembers: vi.fn(() => of({ data: [] })),
      listInvitations: vi.fn(() => of({ data: [] })),
      createInvitation: vi.fn(() => of({ data: {} })),
      updateMemberRole: vi.fn(() => of({ data: {} })),
      removeMember: vi.fn(() => of({ data: { removed: true, member_id: 'x' } })),
      revokeInvitation: vi.fn(() => of({ data: {} })),
    };

    await TestBed.configureTestingModule({
      imports: [WorkspaceMembersPageComponent],
      providers: [
        {
          provide: SessionStore,
          useValue: {
            activeWorkspaceId: () => 'w-1',
            memberships: () => [{ workspace_id: 'w-1', role: 'viewer' }],
          },
        },
        { provide: WorkspaceMembersApiService, useValue: api },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceMembersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('prevents inviting when current user is not owner', async () => {
    component.inviteForm.setValue({ email: 'test@example.com', role: 'viewer' });
    await component.invite();
    expect(api.createInvitation).not.toHaveBeenCalled();
  });
});
