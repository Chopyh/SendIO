import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { SessionStore } from '../../../core/auth/session.store';
import { RegisterPageComponent } from './register-page.component';

describe('RegisterPageComponent', () => {
  let fixture: ComponentFixture<RegisterPageComponent>;
  let component: RegisterPageComponent;
  let mockRouter: any;
  let mockAuthApi: any;
  let mockSessionStore: any;

  beforeEach(async () => {
    mockRouter = {
      navigateByUrl: vi.fn(async () => true),
    };

    mockAuthApi = {
      bootstrapWorkspace: vi.fn(() => of({ data: { workspace_id: 'w1' } })),
      register: vi.fn(() => of({ data: { access_token: 'mock-token' } })),
    };

    mockSessionStore = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      user: vi.fn().mockReturnValue(undefined),
      memberships: vi.fn().mockReturnValue([{ workspace_id: 'w1' }]),
      hydrateCurrentUser: vi.fn(async () => undefined),
      setActiveWorkspace: vi.fn(),
      register: vi.fn(async () => undefined),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthApiService, useValue: mockAuthApi },
        { provide: SessionStore, useValue: mockSessionStore },
      ],
    }).compileComponents();
  });

  function createComponent() {
    fixture = TestBed.createComponent(RegisterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Initialization', () => {
    it('should set step to 1 if user is not authenticated', () => {
      mockSessionStore.isAuthenticated.mockReturnValue(false);
      createComponent();
      expect(component.step()).toBe(1);
    });

    it('should set step to 2 if user is already authenticated', () => {
      mockSessionStore.isAuthenticated.mockReturnValue(true);
      createComponent();
      expect(component.step()).toBe(2);
    });

    it('should initialize timezone with resolved options timezone', () => {
      createComponent();
      const defaultTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      expect(component.workspaceForm.controls.timezone.value).toBe(defaultTz);
    });
  });

  describe('Password Validation Getters', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should evaluate isLengthValid correctly', () => {
      component.ownerForm.controls.password.setValue('1234567');
      expect(component.isLengthValid).toBe(false);

      component.ownerForm.controls.password.setValue('12345678');
      expect(component.isLengthValid).toBe(true);
    });

    it('should evaluate hasNumber correctly', () => {
      component.ownerForm.controls.password.setValue('abc');
      expect(component.hasNumber).toBe(false);

      component.ownerForm.controls.password.setValue('abc1');
      expect(component.hasNumber).toBe(true);
    });

    it('should evaluate hasLetter correctly', () => {
      component.ownerForm.controls.password.setValue('123');
      expect(component.hasLetter).toBe(false);

      component.ownerForm.controls.password.setValue('123a');
      expect(component.hasLetter).toBe(true);
    });
  });

  describe('Navigation Flow', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should not progress to step 2 if owner form is invalid', () => {
      component.ownerForm.setValue({
        firstName: '',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'pwd',
        confirmPassword: 'pwd',
        preferredLanguage: 'en',
        termsAccepted: false,
      });

      component.nextStep();
      expect(component.step()).toBe(1);
    });

    it('should progress to step 2 when owner form is valid', () => {
      component.ownerForm.setValue({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        preferredLanguage: 'en',
        termsAccepted: true,
      });

      component.nextStep();
      expect(component.step()).toBe(2);
    });

    it('should not progress from step 2 to step 3 if workspace form is invalid', () => {
      component.step.set(2);
      component.workspaceForm.setValue({
        accountName: '',
        workspaceName: '',
        timezone: 'UTC',
      });

      component.nextStep();
      expect(component.step()).toBe(2);
    });

    it('should progress to step 3 if workspace form is valid', () => {
      component.step.set(2);
      component.workspaceForm.setValue({
        accountName: 'Acme Corp',
        workspaceName: 'Marketing',
        timezone: 'Europe/Madrid',
      });

      component.nextStep();
      expect(component.step()).toBe(3);
    });

    it('should decrease step when calling previousStep', () => {
      component.step.set(2);
      component.previousStep();
      expect(component.step()).toBe(1);
    });

    it('should not decrease step when authenticated calling previousStep', () => {
      mockSessionStore.isAuthenticated.mockReturnValue(true);
      component.step.set(2);
      component.previousStep();
      expect(component.step()).toBe(2);
    });
  });

  describe('Submit Flow', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should register unauthenticated user and redirect to app', async () => {
      mockSessionStore.isAuthenticated.mockReturnValue(false);
      component.ownerForm.setValue({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        preferredLanguage: 'es',
        termsAccepted: true,
      });

      component.workspaceForm.setValue({
        accountName: 'Acme Corp',
        workspaceName: 'Marketing',
        timezone: 'Europe/Madrid',
      });

      await component.submit();

      expect(mockSessionStore.register).toHaveBeenCalledWith({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        password: 'Password123',
        password_confirmation: 'Password123',
        terms_accepted: true,
        account_name: 'Acme Corp',
        workspace_name: 'Marketing',
        timezone: 'Europe/Madrid',
        locale_default: 'es',
      });
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app');
    });

    it('should bootstrap workspace for authenticated user and redirect to app', async () => {
      mockSessionStore.isAuthenticated.mockReturnValue(true);
      component.workspaceForm.setValue({
        accountName: 'Existing Acme Corp',
        workspaceName: 'Existing Marketing',
        timezone: 'Europe/Madrid',
      });

      await component.submit();

      expect(mockAuthApi.bootstrapWorkspace).toHaveBeenCalledWith({
        account_name: 'Existing Acme Corp',
        workspace_name: 'Existing Marketing',
        timezone: 'Europe/Madrid',
        locale_default: component.i18nStore.locale(),
      });
      expect(mockSessionStore.hydrateCurrentUser).toHaveBeenCalled();
      expect(mockSessionStore.setActiveWorkspace).toHaveBeenCalledWith('w1');
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app');
    });

    it('should logout and redirect to login when cancel is clicked', () => {
      mockSessionStore.isAuthenticated.mockReturnValue(true);
      component.cancel();
      expect(mockSessionStore.logout).toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/auth/login');
    });

    it('should set errorMessage when registration throws an error', async () => {
      mockSessionStore.isAuthenticated.mockReturnValue(false);
      mockSessionStore.register.mockRejectedValue({
        error: {
          message: 'Email already registered.'
        }
      });

      component.ownerForm.setValue({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        preferredLanguage: 'es',
        termsAccepted: true,
      });

      component.workspaceForm.setValue({
        accountName: 'Acme Corp',
        workspaceName: 'Marketing',
        timezone: 'Europe/Madrid',
      });

      await component.submit();

      expect(component.errorMessage()).toBe('Email already registered.');
      expect(component.loading()).toBe(false);
    });
  });
});
