import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { I18nStore } from '../../core/i18n/i18n.store';
import { SessionStore } from '../../core/auth/session.store';
import { ThemeStore } from '../../core/theme/theme.store';
import { Locale } from '../../core/i18n/translations';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgClass,
    FormsModule,
    ButtonModule,
    Select,
    SelectButton,
    ToggleSwitch
  ],
  templateUrl: './app-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppLayoutComponent {
  private readonly router = inject(Router);
  readonly i18nStore = inject(I18nStore);
  readonly sessionStore = inject(SessionStore);
  readonly themeStore = inject(ThemeStore);

  readonly isSidebarCollapsed = signal(false);

  readonly languageOptions = [
    { label: 'EN', value: 'en' },
    { label: 'ES', value: 'es' }
  ];

  readonly workspaceOptions = computed(() => {
    return this.sessionStore.memberships().map((m) => ({
      label: m.workspace_name,
      value: m.workspace_id
    }));
  });

  get currentLanguage(): Locale {
    return this.i18nStore.locale();
  }

  onLanguageChange(locale: Locale): void {
    if (locale) {
      this.i18nStore.setLocale(locale);
    }
  }

  onWorkspaceChange(workspaceId: string): void {
    if (workspaceId) {
      this.sessionStore.setActiveWorkspace(workspaceId);
      this.router.navigateByUrl('/app');
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((val) => !val);
  }

  logout(): void {
    this.sessionStore.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
