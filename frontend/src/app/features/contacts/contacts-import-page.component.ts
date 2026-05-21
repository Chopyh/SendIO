import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
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
  standalone: true,
  imports: [ButtonModule, CardModule, ProgressSpinnerModule, TableModule, Tag, NgClass, DecimalPipe],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <header class="space-y-2">
        <h1 class="text-3xl font-light text-slate-800 dark:text-slate-100">
          {{ i18nStore.t('contacts.import.title') }}
        </h1>
        <p class="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          {{ i18nStore.t('contacts.import.subtitle') }}
        </p>
      </header>

      <!-- Main Action Card -->
      <p-card styleClass="shadow-sm border border-slate-200/60 dark:border-slate-800/80">
        <div class="space-y-6">
          
          <!-- Instructions & Requirements -->
          <div class="space-y-4 max-w-3xl">
            <div class="space-y-2">
              <h2 class="text-lg font-medium text-slate-700 dark:text-slate-200">
                {{ i18nStore.t('contacts.import.instructionsTitle') }}
              </h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {{ i18nStore.t('contacts.import.instructionsBody') }}
              </p>
            </div>
            
            <!-- Required Header Formats & Copy/Download Actions -->
            <div class="space-y-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  {{ i18nStore.t('contacts.import.csvRequiredFormat') }}
                </span>
                <div class="flex gap-2">
                  <p-button 
                    [icon]="showCopySuccess() ? 'pi pi-check' : 'pi pi-copy'" 
                    [label]="showCopySuccess() ? i18nStore.t('contacts.import.copySuccess') : i18nStore.t('contacts.import.copyHeader')" 
                    [severity]="showCopySuccess() ? 'success' : 'secondary'"
                    styleClass="py-1 text-xs" 
                    [text]="true"
                    (onClick)="copyHeaders()" />
                  
                  <p-button 
                    icon="pi pi-download" 
                    [label]="i18nStore.t('contacts.import.downloadTemplate')" 
                    severity="secondary"
                    styleClass="py-1 text-xs" 
                    [text]="true"
                    (onClick)="downloadTemplate()" />
                </div>
              </div>
              <div class="bg-slate-950 rounded-lg p-3">
                <code class="text-sm text-indigo-300 font-mono select-all block whitespace-nowrap overflow-x-auto">
                  email,first_name,last_name,phone
                </code>
              </div>
            </div>
          </div>

          <!-- Drag and Drop Upload Area -->
          <div 
            class="relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all duration-200"
            [ngClass]="{
              'border-indigo-400 bg-indigo-50/20 dark:border-indigo-600 dark:bg-indigo-950/10': isDragging(),
              'border-slate-300 bg-slate-50/20 dark:border-slate-800 dark:bg-slate-900/10 hover:border-slate-400 dark:hover:border-slate-700': !isDragging() && state() !== 'uploading',
              'border-slate-200 bg-slate-100/10 opacity-70 pointer-events-none': state() === 'uploading'
            }"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)">
            
            <input
              #fileInput
              type="file"
              accept=".csv,text/csv"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              [disabled]="state() === 'uploading'"
              (change)="onFileSelected($event)" />

            <div class="text-center space-y-3 pointer-events-none">
              <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                <i class="pi pi-cloud-upload text-2xl text-slate-400 dark:text-slate-300"></i>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {{ i18nStore.t('contacts.import.dragDropLabel') }}
                </p>
                <p class="text-xs text-slate-400 mt-1">
                  {{ i18nStore.t('contacts.import.dragDropSub') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Selected File Meta -->
          @if (selectedFile()) {
            <div class="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm dark:bg-slate-900/40 dark:border-slate-800">
              <div class="flex items-center space-x-3">
                <i class="pi pi-file text-xl text-indigo-500"></i>
                <div>
                  <p class="font-medium text-slate-700 dark:text-slate-200">
                    {{ selectedFile()?.name }}
                  </p>
                  <p class="text-xs text-slate-400 mt-0.5">
                    {{ (selectedFile()?.size ?? 0) | number }} bytes
                  </p>
                </div>
              </div>
              <p-button 
                icon="pi pi-times" 
                [text]="true" 
                severity="danger" 
                styleClass="h-8 w-8"
                [disabled]="state() === 'uploading'"
                (onClick)="reset(fileInput)" />
            </div>
          }

          <!-- Local Error Message -->
          @if (errorMessage()) {
            <div class="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300" role="alert">
              <i class="pi pi-exclamation-circle text-lg flex-shrink-0 mt-0.5"></i>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Action Buttons -->
          <div class="flex items-center gap-3">
            <p-button
              [label]="i18nStore.t('contacts.import.action')"
              icon="pi pi-play"
              [disabled]="!canImport()"
              [loading]="state() === 'uploading'"
              (onClick)="importContacts()" />
            
            <p-button
              severity="secondary"
              [label]="i18nStore.t('contacts.import.reset')"
              icon="pi pi-refresh"
              [disabled]="state() === 'uploading' || (!selectedFile() && !summary())"
              (onClick)="reset(fileInput)" />
          </div>

        </div>
      </p-card>

      <!-- Processing Spinner Box -->
      @if (state() === 'uploading') {
        <div class="flex items-center gap-4 rounded-xl bg-white border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800" role="status">
          <p-progressspinner [ariaLabel]="i18nStore.t('contacts.import.progressAriaLabel')" styleClass="h-8 w-8" />
          <div class="space-y-1">
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {{ i18nStore.t('contacts.import.action') }}
            </p>
            <p class="text-xs text-slate-400">
              {{ i18nStore.t('contacts.import.uploading') }}
            </p>
          </div>
        </div>
      }

      <!-- Import Summary Dashboard -->
      @if (summary()) {
        <section class="space-y-6" aria-live="polite">
          
          <!-- Summary Header Toast/Notification banner -->
          @if (hasIssues()) {
            <div class="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300">
              <i class="pi pi-exclamation-triangle text-lg flex-shrink-0 mt-0.5"></i>
              <span>{{ i18nStore.t('contacts.import.successWithIssues') }}</span>
            </div>
          } @else {
            <div class="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300">
              <i class="pi pi-check-circle text-lg flex-shrink-0 mt-0.5"></i>
              <span>{{ i18nStore.t('contacts.import.successClean') }}</span>
            </div>
          }

          <!-- Metrics Grid -->
          <div class="grid gap-4 sm:grid-cols-3">
            <!-- Processed Card -->
            <p-card styleClass="shadow-sm border border-slate-100 dark:border-slate-800 border-l-4 border-l-emerald-500">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {{ i18nStore.t('contacts.import.processed') }}
                  </p>
                  <p class="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {{ summary()?.processed ?? 0 }}
                  </p>
                </div>
                <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <i class="pi pi-check-circle text-lg text-emerald-500"></i>
                </div>
              </div>
            </p-card>

            <!-- Skipped Card -->
            <p-card styleClass="shadow-sm border border-slate-100 dark:border-slate-800 border-l-4 border-l-amber-500">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {{ i18nStore.t('contacts.import.skipped') }}
                  </p>
                  <p class="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {{ summary()?.skipped ?? 0 }}
                  </p>
                </div>
                <div class="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <i class="pi pi-exclamation-triangle text-lg text-amber-500"></i>
                </div>
              </div>
            </p-card>

            <!-- Failed Card -->
            <p-card styleClass="shadow-sm border border-slate-100 dark:border-slate-800 border-l-4 border-l-rose-500">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {{ i18nStore.t('contacts.import.failed') }}
                  </p>
                  <p class="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {{ summary()?.failed ?? 0 }}
                  </p>
                </div>
                <div class="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                  <i class="pi pi-times-circle text-lg text-rose-500"></i>
                </div>
              </div>
            </p-card>
          </div>

          <!-- Skipped Rows Table -->
          @if (skippedRows().length > 0) {
            <div class="space-y-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
              <h2 class="text-lg font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <i class="pi pi-exclamation-triangle text-amber-500"></i>
                {{ i18nStore.t('contacts.import.skippedDetails') }}
              </h2>
              <p-table [value]="skippedRows()" styleClass="p-datatable-sm">
                <ng-template #header>
                  <tr>
                    <th class="w-20">{{ i18nStore.t('contacts.import.row') }}</th>
                    <th>{{ i18nStore.t('contacts.import.email') }}</th>
                    <th>{{ i18nStore.t('contacts.import.reason') }}</th>
                  </tr>
                </ng-template>
                <ng-template #body let-row>
                  <tr>
                    <td class="font-mono text-slate-500 text-xs">{{ row.row }}</td>
                    <td class="font-medium">{{ row.email || '-' }}</td>
                    <td>
                      <p-tag severity="warn" [value]="row.reason" />
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          }

          <!-- Failed Rows Table -->
          @if (failedRows().length > 0) {
            <div class="space-y-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
              <h2 class="text-lg font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <i class="pi pi-times-circle text-rose-500"></i>
                {{ i18nStore.t('contacts.import.failedDetails') }}
              </h2>
              <p-table [value]="failedRows()" styleClass="p-datatable-sm">
                <ng-template #header>
                  <tr>
                    <th class="w-20">{{ i18nStore.t('contacts.import.row') }}</th>
                    <th>{{ i18nStore.t('contacts.import.email') }}</th>
                    <th>{{ i18nStore.t('contacts.import.reason') }}</th>
                  </tr>
                </ng-template>
                <ng-template #body let-row>
                  <tr>
                    <td class="font-mono text-slate-500 text-xs">{{ row.row }}</td>
                    <td class="font-medium text-rose-600 dark:text-rose-400">{{ row.email || '-' }}</td>
                    <td>
                      <p-tag severity="danger" [value]="row.reason" />
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          }
        </section>
      }
    </div>
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

  readonly isDragging = signal(false);
  readonly showCopySuccess = signal(false);

  readonly canImport = computed(() => this.state() === 'selected' && this.selectedFile() !== null);
  readonly skippedRows = computed<ContactsImportRowDiagnostic[]>(() => this.summary()?.details.skipped ?? []);
  readonly failedRows = computed<ContactsImportRowDiagnostic[]>(() => this.summary()?.details.failed ?? []);
  readonly hasIssues = computed(() => {
    const summary = this.summary();
    return (summary?.skipped ?? 0) > 0 || (summary?.failed ?? 0) > 0;
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.handleFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.state() !== 'uploading') {
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (this.state() !== 'uploading') {
      const file = event.dataTransfer?.files?.[0] ?? null;
      this.handleFile(file);
    }
  }

  copyHeaders(): void {
    navigator.clipboard.writeText('email,first_name,last_name,phone').then(() => {
      this.showCopySuccess.set(true);
      setTimeout(() => {
        this.showCopySuccess.set(false);
      }, 2000);
    });
  }

  downloadTemplate(): void {
    const csvContent = 'email,first_name,last_name,phone\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'contacts_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private handleFile(file: File | null): void {
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
