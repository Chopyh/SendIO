import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CampaignApiService } from '../../core/campaigns/campaign-api.service';
import { CampaignSummary } from '../../core/campaigns/campaign.models';
import { I18nStore } from '../../core/i18n/i18n.store';

@Component({
  selector: 'app-campaign-detail-page',
  imports: [RouterLink, CardModule, ButtonModule],
  template: `
    <div class="space-y-6">
      <a routerLink="/app/campaigns"><p-button [label]="i18nStore.t('campaigns.actions.backToList')" icon="pi pi-arrow-left" [text]="true" /></a>

      @if (loading()) {
        <p>{{ i18nStore.t('campaigns.detail.loading') }}</p>
      } @else if (!campaign()) {
        <div class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{{ i18nStore.t('campaigns.detail.notFound') }}</div>
      } @else {
        <header>
          <h1 class="text-3xl font-light text-slate-800 dark:text-slate-100">{{ campaign()!.name }}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ i18nStore.t('campaigns.fields.status') }}: {{ campaign()!.status }}</p>
        </header>

        <div class="grid gap-4 md:grid-cols-3">
          <p-card>
            <div class="text-xs text-slate-500">{{ i18nStore.t('campaigns.metrics.pending') }}</div>
            <div class="text-2xl font-semibold">{{ campaign()!.pending_recipients_count }}</div>
          </p-card>
          <p-card>
            <div class="text-xs text-slate-500">{{ i18nStore.t('campaigns.metrics.sent') }}</div>
            <div class="text-2xl font-semibold">{{ campaign()!.sent_recipients_count }}</div>
          </p-card>
          <p-card>
            <div class="text-xs text-slate-500">{{ i18nStore.t('campaigns.metrics.failed') }}</div>
            <div class="text-2xl font-semibold">{{ campaign()!.failed_recipients_count }}</div>
          </p-card>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly campaignsApi = inject(CampaignApiService);
  readonly i18nStore = inject(I18nStore);

  readonly loading = signal(true);
  readonly campaign = signal<CampaignSummary | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }

    try {
      const response = await firstValueFrom(this.campaignsApi.getCampaignSummary(id));
      this.campaign.set(response.data);
    } catch {
      this.campaign.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
