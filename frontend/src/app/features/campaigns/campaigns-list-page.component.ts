import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CampaignApiService } from '../../core/campaigns/campaign-api.service';
import { CampaignSummary } from '../../core/campaigns/campaign.models';
import { I18nStore } from '../../core/i18n/i18n.store';

@Component({
  selector: 'app-campaigns-list-page',
  imports: [RouterLink, ButtonModule, CardModule, TableModule],
  template: `
    <div class="space-y-6">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-light text-slate-800 dark:text-slate-100">{{ i18nStore.t('campaigns.list.title') }}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ i18nStore.t('campaigns.list.subtitle') }}</p>
        </div>
        <a routerLink="/app/campaigns/new"><p-button [label]="i18nStore.t('campaigns.actions.new')" icon="pi pi-plus" /></a>
      </header>

      <p-card>
        @if (loading()) {
          <p>{{ i18nStore.t('campaigns.list.loading') }}</p>
        } @else if (campaigns().length === 0) {
          <p>{{ i18nStore.t('campaigns.list.empty') }}</p>
        } @else {
          <p-table [value]="campaigns()">
            <ng-template #header>
              <tr>
                <th>{{ i18nStore.t('campaigns.fields.name') }}</th>
                <th>{{ i18nStore.t('campaigns.fields.status') }}</th>
                <th>{{ i18nStore.t('campaigns.fields.recipientCount') }}</th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template #body let-campaign>
              <tr>
                <td>{{ campaign.name }}</td>
                <td>{{ campaign.status }}</td>
                <td>{{ campaign.recipient_count }}</td>
                <td class="text-right">
                  <a [routerLink]="['/app/campaigns', campaign.id]">
                    <p-button [label]="i18nStore.t('campaigns.actions.view')" severity="secondary" [text]="true" />
                  </a>
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
export class CampaignsListPageComponent {
  private readonly campaignsApi = inject(CampaignApiService);
  readonly i18nStore = inject(I18nStore);

  readonly loading = signal(true);
  readonly campaigns = signal<CampaignSummary[]>([]);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const remembered = this.campaignsApi.getRememberedCampaigns();
    if (remembered.length === 0) {
      this.loading.set(false);
      return;
    }

    const summaries: CampaignSummary[] = [];

    for (const campaign of remembered) {
      try {
        const response = await firstValueFrom(this.campaignsApi.getCampaignSummary(campaign.id));
        summaries.push(response.data);
      } catch {
        continue;
      }
    }

    this.campaigns.set(summaries);
    this.loading.set(false);
  }
}
