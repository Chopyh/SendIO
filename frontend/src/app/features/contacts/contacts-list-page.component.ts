import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ContactsApiService } from '../../core/contacts/contacts-api.service';
import { WorkspaceContact } from '../../core/contacts/contacts.models';
import { I18nStore } from '../../core/i18n/i18n.store';

@Component({
  selector: 'app-contacts-list-page',
  imports: [CardModule, TableModule, Tag],
  template: `
    <div class="space-y-6">
      <header class="space-y-2">
        <h1 class="text-3xl font-light text-slate-800 dark:text-slate-100">{{ i18nStore.t('contacts.list.title') }}</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ i18nStore.t('contacts.list.subtitle') }}</p>
      </header>

      <p-card styleClass="shadow-sm border border-slate-200/60 dark:border-slate-800/80">
        @if (loading()) {
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ i18nStore.t('contacts.list.loading') }}</p>
        } @else if (loadError()) {
          <div class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            {{ i18nStore.t('contacts.list.errors.generic') }}
          </div>
        } @else if (isEmpty()) {
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ i18nStore.t('contacts.list.empty') }}</p>
        } @else {
          <p-table [value]="contacts()" styleClass="p-datatable-sm">
            <ng-template #header>
              <tr>
                <th>{{ i18nStore.t('contacts.list.table.email') }}</th>
                <th>{{ i18nStore.t('contacts.list.table.firstName') }}</th>
                <th>{{ i18nStore.t('contacts.list.table.lastName') }}</th>
                <th>{{ i18nStore.t('contacts.list.table.phone') }}</th>
              </tr>
            </ng-template>
            <ng-template #body let-contact>
              <tr>
                <td class="font-medium">{{ contact.email }}</td>
                <td>{{ contact.first_name || '-' }}</td>
                <td>{{ contact.last_name || '-' }}</td>
                <td>
                  @if (contact.phone) {
                    <p-tag severity="secondary" [value]="contact.phone" />
                  } @else {
                    -
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsListPageComponent {
  private readonly contactsApi = inject(ContactsApiService);
  readonly i18nStore = inject(I18nStore);

  readonly contacts = signal<WorkspaceContact[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly isEmpty = computed(() => this.contacts().length === 0);

  constructor() {
    void this.loadContacts();
  }

  private async loadContacts(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);

    try {
      this.contacts.set(await firstValueFrom(this.contactsApi.listContacts()));
    } catch {
      this.loadError.set(true);
      this.contacts.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
