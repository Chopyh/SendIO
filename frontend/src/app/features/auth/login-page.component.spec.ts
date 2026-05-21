import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let router: Router;
  let mockSessionStore: any;
  let navigateSpy: any;

  beforeEach(async () => {
    mockSessionStore = {
      login: vi.fn(async () => undefined),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: SessionStore, useValue: mockSessionStore },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile and initialize with default values', () => {
    expect(component).toBeTruthy();
    expect(component.form.valid).toBe(false);
    expect(component.loading()).toBe(false);
  });

  it('should submit successfully and navigate to app when form is valid', async () => {
    component.form.setValue({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(component.form.valid).toBe(true);

    await component.onSubmit();

    expect(mockSessionStore.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(navigateSpy).toHaveBeenCalledWith('/app');
  });

  it('should not call login when form is invalid', async () => {
    component.form.setValue({
      email: 'invalid-email',
      password: '',
    });

    expect(component.form.valid).toBe(false);

    await component.onSubmit();

    expect(mockSessionStore.login).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
