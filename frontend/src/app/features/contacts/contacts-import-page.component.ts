import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { ContactsImportApiService } from '../../core/contacts/contacts-import-api.service';
import {
  ApiErrorResponse,
  ContactsImportRowDiagnostic,
  ContactsImportSummary,
} from '../../core/contacts/contacts-import.models';
import { I18nStore } from '../../core/i18n/i18n.store';

type ImportState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

@Component({
  selector: 'app-contacts-import-page',
  imports: [ButtonModule, CardModule, ProgressSpinnerModule, TableModule],
  template: `
    <section class="min-h-screen bg-slate-100 px-6 py-10 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div class="mx-auto w-full max-w-5xl space-y-6">
        <header class="space-y-3">
          <p class="text-xs uppercase tracking-[0.35em] text-slate-500">SendIO</p>
          <div class="space-y-2">
            <h1 class="text-3xl font-light">{{ i18nStore.t('contacts.import.title') }}</h1>
            <p class="max-w-3xl text-sm text-slate-600 dark:text-slate-300">{{ i18nStore.t('contacts.import.subtitle') }}</p>
          </div>
        </header>

        <p-card>
          <div class="space-y-6">
            <div class="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div class="space-y-3">
                <h2 class="text-xl font-medium">{{ i18nStore.t('contacts.import.instructionsTitle') }}</h2>
                <p class="text-sm text-slate-600 dark:text-slate-300">{{ i18nStore.t('contacts.import.instructionsBody') }}</p>
                <code class="block rounded-xl bg-slate-950 px-4 py-3 text-sm text-slate-50">email,first_name,last_name,phone</code>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p class="font-medium">{{ i18nStore.t('contacts.import.csvOnlyTitle') }}</p>
                <p class="mt-2 text-slate-600 dark:text-slate-300">{{ i18nStore.t('contacts.import.csvOnlyBody') }}</p>
              </div>
            </div>

            <div class="space-y-3 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
              <label class="flex flex-col gap-2">
                <span class="text-sm font-medium">{{ i18nStore.t('contacts.import.fileLabel') }}</span>
                <input
                  #fileInput
                  type="file"
                  accept=".csv,text/csv"
                  class="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:file:bg-slate-100 dark:file:text-slate-950"
                  [disabled]="state() === 'uploading'"
                  (change)="onFileSelected($event)"
                />
              </label>

              @if (selectedFile()) {
                <div class="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-900">
                  <p class="font-medium">{{ i18nStore.t('contacts.import.selectedFile') }}</p>
                  <p class="text-slate-600 dark:text-slate-300">{{ selectedFile()?.name }}</p>
                </div>
              }

              @if (errorMessage()) {
                <p class="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200" role="alert">
                  {{ errorMessage() }}
                </p>
              }

              <div class="flex flex-wrap items-center gap-3">
                <p-button
                  [label]="i18nStore.t('contacts.import.action')"
                  [disabled]="!canImport()"
                  [loading]="state() === 'uploading'"
                  (onClick)="importContacts()"
                />
                <p-button
                  severity="secondary"
                  [label]="i18nStore.t('contacts.import.reset')"
                  [disabled]="state() === 'uploading' && !summary()"
                  (onClick)="reset(fileInput)"
                />
              </div>
            </div>
          </div>
        </p-card>

        @if (state() === 'uploading') {
          <div class="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700" role="status">
            <p-progressspinner [ariaLabel]="i18nStore.t('contacts.import.progressAriaLabel')" styleClass="h-8 w-8" />
            <p class="text-sm text-slate-600 dark:text-slate-300">{{ i18nStore.t('contacts.import.uploading') }}</p>
          </div>
        }

        @if (summary()) {
          <section class="space-y-4" aria-live="polite">
            <div class="grid gap-4 md:grid-cols-3">
              @for (metric of summaryMetrics(); track metric.label) {
                <p-card>
                  <div class="space-y-2">
                    <p class="text-sm text-slate-500">{{ metric.label }}</p>
                    <p class="text-3xl font-semibold">{{ metric.value }}</p>
                  </div>
                </p-card>
              }
            </div>

            @if (hasIssues()) {
              <p class="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                {{ i18nStore.t('contacts.import.successWithIssues') }}
              </p>
            } @else {
              <p class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                {{ i18nStore.t('contacts.import.successClean') }}
              </p>
            }

            @if (skippedRows().length > 0) {
              <div class="space-y-2">
                <h2 class="text-lg font-medium">{{ i18nStore.t('contacts.import.skippedDetails') }}</h2>
                <p-table [value]="skippedRows()">
                  <ng-template #header>
                    <tr>
                      <th>{{ i18nStore.t('contacts.import.row') }}</th>
                      <th>{{ i18nStore.t('contacts.import.email') }}</th>
                      <th>{{ i18nStore.t('contacts.import.reason') }}</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-row>
                    <tr>
                      <td>{{ row.row }}</td>
                      <td>{{ row.email }}</td>
                      <td>{{ row.reason }}</td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            }

            @if (failedRows().length > 0) {
              <div class="space-y-2">
                <h2 class="text-lg font-medium">{{ i18nStore.t('contacts.import.failedDetails') }}</h2>
                <p-table [value]="failedRows()">
                  <ng-template #header>
                    <tr>
                      <th>{{ i18nStore.t('contacts.import.row') }}</th>
                      <th>{{ i18nStore.t('contacts.import.email') }}</th>
                      <th>{{ i18nStore.t('contacts.import.reason') }}</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-row>
                    <tr>
                      <td>{{ row.row }}</td>
                      <td>{{ row.email }}</td>
                      <td>{{ row.reason }}</td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            }
          </section>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsImportPageComponent {
  private readonly contactsImportApi = inject(ContactsImportApiService);
  readonly i18nStore = inject(I18nStore);

  readonly state = signal<ImportState>('idle');
  readonly selectedFile = signal<File | null>(null);
  readonly errorMessage = signal('');
  readonly summary = signal<ContactsImportSummary | null>(null);

  readonly canImport = computed(() => this.state() === 'selected' && this.selectedFile() !== null);
  readonly skippedRows = computed<ContactsImportRowDiagnostic[]>(() => this.summary()?.details.skipped ?? []);
  readonly failedRows = computed<ContactsImportRowDiagnostic[]>(() => this.summary()?.details.failed ?? []);
  readonly hasIssues = computed(() => {
    const summary = this.summary();

    return (summary?.skipped ?? 0) > 0 || (summary?.failed ?? 0) > 0;
  });
  readonly summaryMetrics = computed(() => {
    const summary = this.summary();

    return [
      { label: this.i18nStore.t('contacts.import.processed'), value: summary?.processed ?? 0 },
      { label: this.i18nStore.t('contacts.import.skipped'), value: summary?.skipped ?? 0 },
      { label: this.i18nStore.t('contacts.import.failed'), value: summary?.failed ?? 0 },
    ];
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.summary.set(null);

    if (!file) {
      this.selectedFile.set(null);
      this.state.set('idle');
      this.errorMessage.set(this.i18nStore.t('contacts.import.errors.fileRequired'));
      return;
    }

    if (!this.isCsvFile(file)) {
      this.selectedFile.set(null);
      this.state.set('error');
      this.errorMessage.set(this.i18nStore.t('contacts.import.errors.csvOnly'));
      input.value = '';
      return;
    }

    this.selectedFile.set(file);
    this.state.set('selected');
    this.errorMessage.set('');
  }

  async importContacts(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set(this.i18nStore.t('contacts.import.errors.fileRequired'));
      this.state.set('error');
      return;
    }

    this.state.set('uploading');
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(this.contactsImportApi.importCsv(file));
      this.summary.set(response.data.summary);
      this.state.set('success');
    } catch (error) {
      this.summary.set(null);
      this.state.set('error');
      this.errorMessage.set(this.mapError(error));
    }
  }

  reset(fileInput?: HTMLInputElement): void {
    this.selectedFile.set(null);
    this.summary.set(null);
    this.errorMessage.set('');
    this.state.set('idle');

    if (fileInput) {
      fileInput.value = '';
    }
  }

  private isCsvFile(file: File): boolean {
    const normalizedName = file.name.toLowerCase();
    const allowedMimeTypes = new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel']);

    return normalizedName.endsWith('.csv') && (file.type === '' || allowedMimeTypes.has(file.type));
  }

  private mapError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return this.i18nStore.t('contacts.import.errors.generic');
    }

    const apiError = error.error as ApiErrorResponse | null;
    const code = apiError?.error?.code;

    if (code === 'validation.failed') {
      return this.i18nStore.t('contacts.import.errors.validationFailed');
    }

    if (code === 'auth.unauthenticated' || error.status === 401) {
      return this.i18nStore.t('contacts.import.errors.unauthenticated');
    }

    if (code === 'workspace.required' || error.status === 400) {
      return this.i18nStore.t('contacts.import.errors.workspaceRequired');
    }

    if (code === 'workspace.forbidden' || error.status === 403) {
      return this.i18nStore.t('contacts.import.errors.workspaceForbidden');
    }

    return this.i18nStore.t('contacts.import.errors.generic');
  }
}
