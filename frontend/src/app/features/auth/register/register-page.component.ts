import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { StepperModule } from 'primeng/stepper';
import { Select } from 'primeng/select';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { RegisterRequest } from '../../../core/auth/auth.models';
import { SessionStore } from '../../../core/auth/session.store';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { Locale } from '../../../core/i18n/translations';
import { ThemeStore } from '../../../core/theme/theme.store';
import { firstValueFrom } from 'rxjs';

function getTimezoneOffset(timeZone: string): string {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (tzPart) {
      const value = tzPart.value;
      const match = value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
      if (match) {
        const sign = match[1];
        const hours = match[2].padStart(2, '0');
        const minutes = match[3] || '00';
        return `${sign}${hours}:${minutes}`;
      }
    }
    return '+00:00';
  } catch {
    return '+00:00';
  }
}

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    SelectButtonModule,
    CheckboxModule,
    ButtonModule,
    ToggleSwitchModule,
    StepperModule,
    Select,
  ],
  templateUrl: './register-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApiService);
  readonly i18nStore = inject(I18nStore);
  readonly sessionStore = inject(SessionStore);
  readonly themeStore = inject(ThemeStore);

  readonly step = signal(1);
  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly isInvitationFlow = computed(() => !!this.route.snapshot.queryParamMap.get('invitationEmail'));

  ngOnInit(): void {
    const invitationEmail = this.route.snapshot.queryParamMap.get('invitationEmail');
    if (invitationEmail) {
      this.ownerForm.controls.email.setValue(this.normalizeEmail(invitationEmail));
      this.ownerForm.controls.email.disable();
    }

    if (this.sessionStore.isAuthenticated()) {
      this.step.set(2);
    }
  }

  readonly languageOptions = [
    { label: 'EN', value: 'en' as const },
    { label: 'ES', value: 'es' as const },
  ];

  readonly timezoneOptions = Intl.supportedValuesOf('timeZone').map((tz) => {
    const offset = getTimezoneOffset(tz);
    return {
      label: `${tz.replace(/_/g, ' ')} (UTC${offset})`,
      value: tz,
    };
  }).sort((a, b) => a.value.localeCompare(b.value));

  readonly ownerForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    preferredLanguage: new FormControl<Locale>('en', { nonNullable: true, validators: [Validators.required] }),
    termsAccepted: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  readonly workspaceForm = new FormGroup({
    accountName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    workspaceName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    timezone: new FormControl(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly passwordsMatch = computed(
    () => this.ownerForm.controls.password.value === this.ownerForm.controls.confirmPassword.value,
  );

  get password(): string {
    return this.ownerForm.controls.password.value || '';
  }

  get isLengthValid(): boolean {
    return this.password.length >= 8;
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.password);
  }

  get hasLetter(): boolean {
    return /[a-zA-Z]/.test(this.password);
  }

  nextStep(): void {
    this.errorMessage.set('');
    if (this.step() === 1) {
      this.ownerForm.markAllAsTouched();
      if (this.ownerForm.invalid || !this.passwordsMatch()) {
        return;
      }
      this.step.set(2);
      return;
    }

    if (this.step() === 2) {
      this.workspaceForm.markAllAsTouched();
      if (this.workspaceForm.invalid) {
        return;
      }
      this.step.set(3);
    }
  }

  previousStep(): void {
    this.errorMessage.set('');
    if (this.sessionStore.isAuthenticated()) {
      return;
    }
    this.step.update((current) => Math.max(1, current - 1));
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const workspace = this.workspaceForm.getRawValue();

      if (!this.sessionStore.isAuthenticated()) {
        const owner = this.ownerForm.getRawValue();
        const localeDefault = owner.preferredLanguage || this.i18nStore.locale();

        await this.sessionStore.register({
          first_name: owner.firstName,
          last_name: owner.lastName,
          email: owner.email,
          password: owner.password,
          password_confirmation: owner.confirmPassword,
          terms_accepted: owner.termsAccepted,
          account_name: workspace.accountName || undefined,
          workspace_name: workspace.workspaceName || undefined,
          timezone: workspace.timezone,
          locale_default: localeDefault,
        });
      } else {
        const localeDefault = this.i18nStore.locale();

        await firstValueFrom(
          this.authApi.bootstrapWorkspace({
            account_name: workspace.accountName,
            workspace_name: workspace.workspaceName,
            timezone: workspace.timezone,
            locale_default: localeDefault,
          }),
        );

        await this.sessionStore.hydrateCurrentUser();
        const firstWorkspace = this.sessionStore.memberships()[0]?.workspace_id;
        if (firstWorkspace) {
          this.sessionStore.setActiveWorkspace(firstWorkspace);
        }
      }

      const returnUrl = this.getSafeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
      await this.router.navigateByUrl(returnUrl || '/app');
    } catch (err: any) {
      console.error('Registration/Bootstrap error:', err);
      let msg = this.i18nStore.t('auth.register.error');
      if (err?.error?.message) {
        msg = err.error.message;
      } else if (err?.error?.errors) {
        const firstKey = Object.keys(err.error.errors)[0];
        if (firstKey && Array.isArray(err.error.errors[firstKey]) && err.error.errors[firstKey].length > 0) {
          msg = err.error.errors[firstKey][0];
        }
      }
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  cancel(): void {
    if (this.sessionStore.isAuthenticated()) {
      this.sessionStore.logout();
    }
    this.router.navigateByUrl('/auth/login');
  }

  private getSafeReturnUrl(returnUrl: string | null): string | null {
    if (!returnUrl) {
      return null;
    }

    return /^\/(?![\\/])[\x20-\x7E]*$/.test(returnUrl) ? returnUrl : null;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
