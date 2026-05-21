import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { SessionStore } from '../../core/auth/session.store';
import { RegisterPageComponent } from './register-page.component';

describe('RegisterPageComponent', () => {
  let fixture: ComponentFixture<RegisterPageComponent>;
  let component: RegisterPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            navigateByUrl: async () => true,
          },
        },
        {
          provide: AuthApiService,
          useValue: {
            bootstrapWorkspace: () => of({ data: { workspace_id: 'w1' } }),
          },
        },
        {
          provide: SessionStore,
          useValue: {
            isAuthenticated: () => false,
            user: () => undefined,
            memberships: () => [{ workspace_id: 'w1' }],
            hydrateCurrentUser: async () => undefined,
            setActiveWorkspace: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('moves from step 1 to step 2 when owner form is valid', () => {
    component.ownerForm.setValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'password-123',
      confirmPassword: 'password-123',
      preferredLanguage: 'en',
      termsAccepted: true,
    });

    component.nextStep();
    expect(component.step()).toBe(2);
  });
});
