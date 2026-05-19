import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { I18nStore } from '../../core/i18n/i18n.store';
import { SessionStore } from '../../core/auth/session.store';
import { ThemeStore } from '../../core/theme/theme.store';

@Component({
  selector: 'app-workspace-home-page',
  imports: [ButtonModule],
  template: `
    <section class="min-h-screen bg-slate-100 px-6 py-10 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div class="mx-auto w-full max-w-4xl space-y-4 rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/80 dark:ring-slate-700">
        <h1 class="text-3xl font-light">{{ i18nStore.t('app.placeholderTitle') }}</h1>
        <p class="text-sm text-slate-600 dark:text-slate-300">{{ i18nStore.t('app.placeholderText') }}</p>
        <div class="flex gap-3">
          <p-button severity="secondary" [label]="i18nStore.t('theme.toggle')" (onClick)="themeStore.toggle()" />
          <p-button severity="danger" [label]="i18nStore.t('auth.logout')" (onClick)="logout()" />
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceHomePageComponent {
  private readonly router = inject(Router);
  readonly i18nStore = inject(I18nStore);
  readonly sessionStore = inject(SessionStore);
  readonly themeStore = inject(ThemeStore);

  logout(): void {
    this.sessionStore.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
