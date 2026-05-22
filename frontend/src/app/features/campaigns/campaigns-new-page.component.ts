import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { MultiSelect } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { CampaignApiService } from '../../core/campaigns/campaign-api.service';
import { ContactOption, PublishedTemplateOption } from '../../core/campaigns/campaign.models';
import { I18nStore } from '../../core/i18n/i18n.store';

type RecipientMode = 'all' | 'manual';

@Component({
  selector: 'app-campaigns-new-page',
  imports: [ReactiveFormsModule, ButtonModule, CardModule, Select, SelectButton, MultiSelect, InputTextModule],
  template: `
    <div class="space-y-6">
      <header class="space-y-2">
        <h1 class="text-3xl font-light text-slate-800 dark:text-slate-100">{{ i18nStore.t('campaigns.new.title') }}</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ i18nStore.t('campaigns.new.subtitle') }}</p>
      </header>

      <p-card styleClass="shadow-sm border border-slate-200/60 dark:border-slate-800/80">
        <form class="space-y-5" [formGroup]="form" (ngSubmit)="sendNow()">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ i18nStore.t('campaigns.fields.name') }}</label>
            <input type="text" pInputText formControlName="name" class="w-full" />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ i18nStore.t('campaigns.fields.template') }}</label>
              <p-select
                formControlName="templateId"
                [options]="templateOptions()"
                optionLabel="name"
                optionValue="id"
                [placeholder]="i18nStore.t('campaigns.placeholders.template')"
                (onChange)="onTemplateChange()"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ i18nStore.t('campaigns.fields.version') }}</label>
              <p-select
                formControlName="versionNumber"
                [options]="versionOptions()"
                optionLabel="label"
                optionValue="value"
                [placeholder]="i18nStore.t('campaigns.placeholders.version')"
              />
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ i18nStore.t('campaigns.fields.recipientMode') }}</label>
            <p-selectbutton formControlName="recipientMode" [options]="recipientModeOptions" optionLabel="label" optionValue="value" />
          </div>

          @if (form.controls.recipientMode.value === 'manual') {
            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ i18nStore.t('campaigns.fields.manualRecipients') }}</label>
              <p-multiselect
                formControlName="manualRecipientIds"
                [options]="contactOptions()"
                optionLabel="email"
                optionValue="id"
                display="chip"
                [filter]="true"
                [placeholder]="i18nStore.t('campaigns.placeholders.recipients')"
              />
            </div>
          }

          @if (contactsUnavailable()) {
            <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="alert">
              {{ i18nStore.t('campaigns.limitations.contactsEndpoint') }}
            </div>
          }

          @if (stepError()) {
            <div class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
              {{ stepError() }}
            </div>
          }

          <div class="flex items-center justify-end">
            <p-button type="submit" [label]="i18nStore.t('campaigns.actions.sendNow')" icon="pi pi-send" [loading]="sending()" [disabled]="cannotSend()" />
          </div>
        </form>
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsNewPageComponent {
  private readonly campaignsApi = inject(CampaignApiService);
  private readonly router = inject(Router);
  readonly i18nStore = inject(I18nStore);
  private readonly selectedTemplateId = signal('');
  private readonly formStateVersion = signal(0);

  readonly sending = signal(false);
  readonly stepError = signal('');
  readonly templateOptions = signal<PublishedTemplateOption[]>([]);
  readonly contactOptions = signal<ContactOption[]>([]);
  readonly contactsUnavailable = signal(false);

  readonly recipientModeOptions = [
    { label: this.i18nStore.t('campaigns.recipientMode.all'), value: 'all' as const },
    { label: this.i18nStore.t('campaigns.recipientMode.manual'), value: 'manual' as const },
  ];

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    templateId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    versionNumber: new FormControl<number | null>(null, { validators: [Validators.required] }),
    recipientMode: new FormControl<RecipientMode>('all', { nonNullable: true }),
    manualRecipientIds: new FormControl<string[]>([], { nonNullable: true }),
  });

  readonly versionOptions = computed(() => {
    const template = this.templateOptions().find((item) => item.id === this.selectedTemplateId());
    return (template?.versions ?? []).map((version) => ({ label: `v${version}`, value: version }));
  });

  readonly cannotSend = computed(() => {
    this.formStateVersion();

    if (this.sending()) {
      return true;
    }

    if (this.form.invalid) {
      return true;
    }

    const recipients = this.resolveRecipientIds();
    return recipients.length === 0;
  });

  constructor() {
    this.selectedTemplateId.set(this.form.controls.templateId.value);

    this.form.controls.templateId.valueChanges.pipe(takeUntilDestroyed()).subscribe((templateId) => {
      this.selectedTemplateId.set(templateId);
    });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.formStateVersion.update((value) => value + 1);
    });

    this.form.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.formStateVersion.update((value) => value + 1);
    });

    void this.loadDependencies();
  }

  onTemplateChange(): void {
    this.form.controls.versionNumber.setValue(null);
  }

  async sendNow(): Promise<void> {
    this.form.markAllAsTouched();
    this.stepError.set('');

    const recipientIds = this.resolveRecipientIds();
    if (this.form.invalid || recipientIds.length === 0) {
      this.stepError.set(this.i18nStore.t('campaigns.errors.noRecipients'));
      return;
    }

    this.sending.set(true);

    try {
      const createResponse = await firstValueFrom(
        this.campaignsApi.createCampaign({
          name: this.form.controls.name.value.trim(),
          template_id: this.form.controls.templateId.value,
          template_version_number: Number(this.form.controls.versionNumber.value),
          recipient_ids: recipientIds,
        }),
      );

      const campaignId = createResponse.data.id;
      this.campaignsApi.rememberCampaign(campaignId, createResponse.data.name);

      try {
        await firstValueFrom(this.campaignsApi.dispatchCampaign(campaignId));
        await this.router.navigate(['/app/campaigns', campaignId]);
      } catch {
        this.stepError.set(this.i18nStore.t('campaigns.errors.dispatchFailed'));
      }
    } catch {
      this.stepError.set(this.i18nStore.t('campaigns.errors.createFailed'));
    } finally {
      this.sending.set(false);
    }
  }

  private async loadDependencies(): Promise<void> {
    try {
      this.templateOptions.set(await firstValueFrom(this.campaignsApi.listPublishedTemplates()));
      this.formStateVersion.update((value) => value + 1);
    } catch {
      this.templateOptions.set([]);
      this.formStateVersion.update((value) => value + 1);
    }

    try {
      this.contactOptions.set(await firstValueFrom(this.campaignsApi.listContacts()));
      this.formStateVersion.update((value) => value + 1);
    } catch {
      this.contactsUnavailable.set(true);
      this.formStateVersion.update((value) => value + 1);
    }
  }

  private resolveRecipientIds(): string[] {
    if (this.form.controls.recipientMode.value === 'manual') {
      return this.form.controls.manualRecipientIds.value;
    }

    return this.contactOptions().map((contact) => contact.id);
  }
}
