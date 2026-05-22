import { Component, OnInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { TemplateComponentService } from '../../../core/shared/dataAccess/services/template-component.service';
import { DialogService } from '../../../core/shared/components/generic-dialog/generic-dialog.service';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { EmailTemplate } from '../../../core/shared/dataAccess/models/template-components';

@Component({
  selector: 'app-templates-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    Tag,
  ],
  template: `
    <div class="space-y-6 p-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between border-b border-slate-200/60 pb-5 dark:border-slate-800/80">
        <div class="space-y-1">
          <h1 class="text-3xl font-light text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <i class="pi pi-envelope text-indigo-500"></i>
            {{ i18nStore.t('templates.title') }}
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ i18nStore.t('templates.subtitle') }}
          </p>
        </div>
        <p-button
          [label]="i18nStore.t('templates.new')"
          icon="pi pi-plus"
          severity="primary"
          (onClick)="openCreateDialog()"
          styleClass="px-4 py-2"
        ></p-button>
      </div>

      <!-- Loading / Empty / Table State -->
      @if (loading) {
        <div class="flex flex-col items-center justify-center p-12 space-y-4">
          <i class="pi pi-spin pi-spinner text-3xl text-indigo-500"></i>
          <span class="text-sm text-slate-500 dark:text-slate-400">{{ i18nStore.t('templates.loading') }}</span>
        </div>
      } @else if (templates.length === 0) {
        <div class="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <i class="pi pi-folder-open text-3xl text-slate-400 dark:text-slate-300"></i>
          </div>
          <div class="space-y-1">
            <h3 class="text-lg font-medium text-slate-700 dark:text-slate-200">
              {{ i18nStore.t('templates.empty') }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ i18nStore.t('templates.empty.desc') }}
            </p>
          </div>
          <p-button
            [label]="i18nStore.t('templates.new')"
            icon="pi pi-plus"
            severity="secondary"
            (onClick)="openCreateDialog()"
          ></p-button>
        </div>
      } @else {
        <div class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <p-table [value]="templates" styleClass="p-datatable-sm w-full">
            <ng-template #header>
              <tr class="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th class="p-4 text-left font-semibold">{{ i18nStore.t('templates.table.name') }}</th>
                <th class="p-4 text-left font-semibold">{{ i18nStore.t('templates.table.lastVersion') }}</th>
                <th class="p-4 text-left font-semibold">{{ i18nStore.t('templates.table.status') }}</th>
                <th class="p-4 text-left font-semibold">{{ i18nStore.t('templates.table.lastUpdated') }}</th>
                <th class="p-4 text-right font-semibold">{{ i18nStore.t('templates.table.actions') }}</th>
              </tr>
            </ng-template>
            <ng-template #body let-tpl>
              <tr class="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td class="p-4 font-medium text-slate-800 dark:text-slate-100">
                  <div class="flex items-center gap-3">
                    <i class="pi pi-file text-slate-400 dark:text-slate-500"></i>
                    <span>{{ tpl.name }}</span>
                  </div>
                </td>
                <td class="p-4 text-slate-600 dark:text-slate-300">
                  <span class="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    v{{ getLatestVersionNumber(tpl) }}
                  </span>
                </td>
                <td class="p-4">
                  @if (getLatestVersionState(tpl) === 'published') {
                    <p-tag severity="success" [value]="i18nStore.t('templates.status.published')" styleClass="text-xs"></p-tag>
                  } @else {
                    <p-tag severity="warn" [value]="i18nStore.t('templates.status.draft')" styleClass="text-xs"></p-tag>
                  }
                </td>
                <td class="p-4 text-slate-500 dark:text-slate-400 text-sm">
                  {{ getFormattedDate(tpl) | date:'yyyy-MM-dd HH:mm' }}
                </td>
                <td class="p-4 text-right">
                  <div class="flex justify-end gap-2">
                    <p-button
                      icon="pi pi-pencil"
                      [label]="i18nStore.t('templates.edit')"
                      [text]="true"
                      severity="secondary"
                      (onClick)="editTemplate(tpl.id)"
                      styleClass="p-button-sm"
                    ></p-button>
                    <p-button
                      icon="pi pi-trash"
                      [label]="i18nStore.t('templates.delete')"
                      [text]="true"
                      severity="danger"
                      (onClick)="deleteTemplate(tpl)"
                      styleClass="p-button-sm"
                    ></p-button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      <!-- Dialog Content Template -->
      <ng-template #newTemplateDialog>
        <div class="flex flex-col gap-4 py-2">
          <div class="flex flex-col gap-2">
            <label for="templateName" class="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {{ i18nStore.t('templates.name.label') }}
            </label>
            <input
              id="templateName"
              pInputText
              [(ngModel)]="newTemplateName"
              [placeholder]="i18nStore.t('templates.name.placeholder')"
              class="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
            @if (createError) {
              <p class="text-xs text-red-500 mt-1 flex items-center gap-1">
                <i class="pi pi-exclamation-circle"></i>
                {{ createError }}
              </p>
            }
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class TemplatesListPageComponent implements OnInit {
  @ViewChild('newTemplateDialog', { static: true }) newTemplateDialog!: TemplateRef<any>;

  templates: EmailTemplate[] = [];
  loading = false;
  newTemplateName = '';
  createError = '';

  constructor(
    public readonly i18nStore: I18nStore,
    private readonly templateService: TemplateComponentService,
    private readonly dialog: DialogService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.templateService.listTemplates().subscribe({
      next: (res) => {
        this.templates = res.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openCreateDialog(): void {
    this.newTemplateName = '';
    this.createError = '';
    this.dialog.open(
      {
        title: this.i18nStore.t('templates.create.title'),
        buttons: {
          position: 'right',
          buttons: [
            {
              text: this.i18nStore.t('wizard.cancel'),
              click: () => this.dialog.close(),
              type: 'cancel',
            },
            {
              text: this.i18nStore.t('templates.new'),
              click: () => this.confirmCreateTemplate(),
              type: 'success',
            },
          ],
        },
        outsideClick: true,
        exitButton: true,
      },
      this.newTemplateDialog
    );
  }

  confirmCreateTemplate(): void {
    if (!this.newTemplateName || !this.newTemplateName.trim()) {
      this.createError = this.i18nStore.t('validation.required');
      return;
    }

    this.createError = '';
    this.templateService.createTemplate(this.newTemplateName.trim()).subscribe({
      next: (res) => {
        this.dialog.close();
        this.router.navigate(['/app/templates', res.data.id, 'edit']);
      },
      error: (err) => {
        this.createError = err.error?.error?.message || this.i18nStore.t('templates.error.create');
        this.cdr.markForCheck();
      },
    });
  }

  editTemplate(id: string): void {
    this.router.navigate(['/app/templates', id, 'edit']);
  }

  deleteTemplate(template: EmailTemplate): void {
    this.dialog.open({
      title: this.i18nStore.t('templates.delete'),
      description: this.i18nStore.t('templates.delete.confirm'),
      buttons: {
        position: 'right',
        buttons: [
          {
            text: this.i18nStore.t('wizard.cancel'),
            click: () => this.dialog.close(),
            type: 'cancel',
          },
          {
            text: this.i18nStore.t('templates.delete'),
            click: () => this.confirmDeleteTemplate(template.id),
            type: 'danger',
          },
        ],
      },
      outsideClick: true,
      exitButton: true,
    });
  }

  confirmDeleteTemplate(id: string): void {
    this.templateService.deleteTemplate(id).subscribe({
      next: () => {
        this.dialog.close();
        this.loadTemplates();
      },
      error: (err) => {
        this.dialog.close();
        this.dialog.open({
          title: this.i18nStore.t('templates.error.title'),
          description: err.error?.error?.message || this.i18nStore.t('templates.error.delete'),
          buttons: {
            position: 'right',
            buttons: [
              {
                text: this.i18nStore.t('templates.error.ok'),
                click: () => this.dialog.close(),
                type: 'danger',
              },
            ],
          },
        });
        this.cdr.markForCheck();
      },
    });
  }

  getLatestVersionNumber(template: EmailTemplate): number {
    return template.versions?.[0]?.version_number ?? 1;
  }

  getLatestVersionState(template: EmailTemplate): 'draft' | 'published' {
    return template.versions?.[0]?.state ?? 'draft';
  }

  getFormattedDate(template: EmailTemplate): Date {
    const dateStr = template.updated_at || template.created_at;
    return dateStr ? new Date(dateStr) : new Date();
  }
}
