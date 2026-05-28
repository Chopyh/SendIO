import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { WorkspaceMembersApiService } from '../../core/workspaces/workspace-members-api.service';
import { InvitationAcceptPageComponent } from './invitation-accept-page.component';

describe('InvitationAcceptPageComponent', () => {
  let fixture: ComponentFixture<InvitationAcceptPageComponent>;
  let component: InvitationAcceptPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvitationAcceptPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['token', 'abc-token']]), queryParamMap: new Map() } },
        },
        {
          provide: SessionStore,
          useValue: {
            isAuthenticated: () => false,
            hydrateCurrentUser: vi.fn(async () => undefined),
          },
        },
        {
          provide: WorkspaceMembersApiService,
          useValue: {
            resolveInvitation: vi.fn(() => of({ data: { email: 'InvitEE@Example.COM', has_account: true } })),
            acceptInvitation: vi.fn(() => of({ data: {} })),
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(InvitationAcceptPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('redirects unauthenticated users with account to login and locks email', async () => {
    await component.resolve();
    const router = TestBed.inject(Router);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/invitations/accept?token=abc-token', invitationEmail: 'invitee@example.com' },
    });
  });

  it('redirects unauthenticated users without account to register', async () => {
    const api = TestBed.inject(WorkspaceMembersApiService);
    (api.resolveInvitation as any).mockReturnValue(of({ data: { email: 'new@example.com', has_account: false } }));

    await component.resolve();
    const router = TestBed.inject(Router);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/register'], {
      queryParams: { returnUrl: '/invitations/accept?token=abc-token', invitationEmail: 'new@example.com' },
    });
  });
});
