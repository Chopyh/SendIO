import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { AppLayoutComponent } from './app-layout.component';
import { SessionStore } from '../../core/auth/session.store';
import { I18nStore } from '../../core/i18n/i18n.store';
import { ThemeStore } from '../../core/theme/theme.store';

describe('AppLayoutComponent', () => {
  let fixture: ComponentFixture<AppLayoutComponent>;
  let component: AppLayoutComponent;
  
  let router: Router;
  let mockSessionStore: any;
  let mockI18nStore: any;
  let mockThemeStore: any;
  let navigateSpy: any;

  beforeEach(async () => {
    mockSessionStore = {
      activeWorkspaceId: () => 'ws1',
      user: () => ({ id: 'usr1', first_name: 'Jane', last_name: 'Doe', email: 'jane.doe@example.com' }),
      memberships: () => [
        { workspace_id: 'ws1', workspace_name: 'Workspace One' },
        { workspace_id: 'ws2', workspace_name: 'Workspace Two' }
      ],
      setActiveWorkspace: vi.fn(),
      logout: vi.fn()
    };

    mockI18nStore = {
      locale: () => 'en',
      setLocale: vi.fn(),
      t: (key: string) => key
    };

    mockThemeStore = {
      isDark: () => false,
      toggle: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: SessionStore, useValue: mockSessionStore },
        { provide: I18nStore, useValue: mockI18nStore },
        { provide: ThemeStore, useValue: mockThemeStore }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(AppLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render successfully', () => {
    expect(component).toBeTruthy();
  });

  it('toggles the sidebar collapsed state', () => {
    expect(component.isSidebarCollapsed()).toBe(false);
    component.toggleSidebar();
    expect(component.isSidebarCollapsed()).toBe(true);
    component.toggleSidebar();
    expect(component.isSidebarCollapsed()).toBe(false);
  });

  it('updates active workspace and navigates on workspace change', () => {
    component.onWorkspaceChange('ws2');
    expect(mockSessionStore.setActiveWorkspace).toHaveBeenCalledWith('ws2');
    expect(navigateSpy).toHaveBeenCalledWith('/app');
  });

  it('switches language on change', () => {
    component.onLanguageChange('es');
    expect(mockI18nStore.setLocale).toHaveBeenCalledWith('es');
  });

  it('logs out and redirects to login', () => {
    component.logout();
    expect(mockSessionStore.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/auth/login');
  });
});
