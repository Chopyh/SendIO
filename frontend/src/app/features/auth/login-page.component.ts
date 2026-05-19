import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { I18nStore } from '../../core/i18n/i18n.store';
import { Locale } from '../../core/i18n/translations';
import { SessionStore } from '../../core/auth/session.store';
import { ThemeStore } from '../../core/theme/theme.store';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    SelectButtonModule,
    ToggleSwitchModule,
  ],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly router = inject(Router);
  readonly i18nStore = inject(I18nStore);
  readonly sessionStore = inject(SessionStore);
  readonly themeStore = inject(ThemeStore);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly languageOptions = [
    { label: 'EN', value: 'en' as const },
    { label: 'ES', value: 'es' as const },
  ];

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly emailInvalid = computed(
    () => this.form.controls.email.invalid && (this.form.controls.email.dirty || this.form.controls.email.touched),
  );

  readonly passwordInvalid = computed(
    () =>
      this.form.controls.password.invalid &&
      (this.form.controls.password.dirty || this.form.controls.password.touched),
  );

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const { email, password } = this.form.getRawValue();
      await this.sessionStore.login(email, password);
      await this.router.navigateByUrl('/app');
    } catch {
      this.errorMessage.set(this.i18nStore.t('auth.invalidCredentials'));
    } finally {
      this.loading.set(false);
    }
  }

  setLanguage(locale: Locale): void {
    this.i18nStore.setLocale(locale);
  }
}
