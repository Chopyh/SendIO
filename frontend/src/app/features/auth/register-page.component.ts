import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { StepperModule } from 'primeng/stepper';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { SessionStore } from '../../core/auth/session.store';
import { I18nStore } from '../../core/i18n/i18n.store';
import { Locale } from '../../core/i18n/translations';
import { ThemeStore } from '../../core/theme/theme.store';
import { firstValueFrom } from 'rxjs';

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
  ],
  templateUrl: './register-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent implements OnInit {
  readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  readonly i18nStore = inject(I18nStore);
  readonly sessionStore = inject(SessionStore);
  readonly themeStore = inject(ThemeStore);

  readonly step = signal(1);
  readonly submitted = signal(false);
  readonly loading = signal(false);

  ngOnInit(): void {
    if (this.sessionStore.isAuthenticated()) {
      this.step.set(2);
    }
  }

  readonly languageOptions = [
    { label: 'EN', value: 'en' as const },
    { label: 'ES', value: 'es' as const },
  ];

  readonly timezoneOptions = [
    { label: 'UTC', value: 'UTC' },
    { label: 'America/New_York', value: 'America/New_York' },
    { label: 'Europe/Madrid', value: 'Europe/Madrid' },
  ];

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
    timezone: new FormControl('UTC', { nonNullable: true, validators: [Validators.required] }),
    localeDefault: new FormControl<Locale>('en', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly passwordsMatch = computed(
    () => this.ownerForm.controls.password.value === this.ownerForm.controls.confirmPassword.value,
  );

  nextStep(): void {
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
    if (this.sessionStore.isAuthenticated()) {
      return;
    }
    this.step.update((current) => Math.max(1, current - 1));
  }

  async submit(): Promise<void> {
    this.submitted.set(true);

    if (!this.sessionStore.isAuthenticated()) {
      return;
    }

    this.loading.set(true);

    try {
      const workspace = this.workspaceForm.getRawValue();
      await firstValueFrom(
        this.authApi.bootstrapWorkspace({
          account_name: workspace.accountName,
          workspace_name: workspace.workspaceName,
          timezone: workspace.timezone,
          locale_default: workspace.localeDefault,
        }),
      );

      await this.sessionStore.hydrateCurrentUser();
      const firstWorkspace = this.sessionStore.memberships()[0]?.workspace_id;
      if (firstWorkspace) {
        this.sessionStore.setActiveWorkspace(firstWorkspace);
      }
      await this.router.navigateByUrl('/app');
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
}
