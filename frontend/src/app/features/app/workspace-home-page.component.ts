import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectButton } from 'primeng/selectbutton';
import { I18nStore } from '../../core/i18n/i18n.store';

interface MetricInfo {
  value: string;
  trend: string;
  trendGood: boolean;
  sparkline: string;
}

interface DashboardData {
  metrics: {
    sent: MetricInfo;
    open: MetricInfo;
    click: MetricInfo;
    bounce: MetricInfo;
  };
  chartPoints: { label: string; sent: number; opened: number; clicked: number }[];
}

@Component({
  selector: 'app-workspace-home-page',
  standalone: true,
  imports: [ButtonModule, CardModule, RouterLink, SelectButton, FormsModule],
  templateUrl: './workspace-home-page.component.html',
  styleUrl: './workspace-home-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceHomePageComponent {
  readonly i18nStore = inject(I18nStore);

  readonly activeRange = signal<'7d' | '30d' | '90d'>('30d');
  readonly hoveredIndex = signal<number | null>(null);

  readonly timeRanges = [
    { label: '7D', value: '7d' as const },
    { label: '30D', value: '30d' as const },
    { label: '90D', value: '90d' as const }
  ];

  readonly dashboardDatasets: Record<'7d' | '30d' | '90d', DashboardData> = {
    '7d': {
      metrics: {
        sent: { value: '8,430', trend: '+12.4%', trendGood: true, sparkline: 'M 0 25 Q 20 10, 40 18 T 80 15 T 100 5' },
        open: { value: '64.2%', trend: '+3.1%', trendGood: true, sparkline: 'M 0 20 Q 20 22, 40 15 T 80 10 T 100 8' },
        click: { value: '22.8%', trend: '+8.5%', trendGood: true, sparkline: 'M 0 28 Q 20 25, 40 22 T 80 15 T 100 12' },
        bounce: { value: '1.1%', trend: '-15.2%', trendGood: true, sparkline: 'M 0 12 Q 20 18, 40 10 T 80 15 T 100 24' }
      },
      chartPoints: [
        { label: 'Mon', sent: 1000, opened: 650, clicked: 200 },
        { label: 'Tue', sent: 1200, opened: 780, clicked: 250 },
        { label: 'Wed', sent: 900, opened: 580, clicked: 180 },
        { label: 'Thu', sent: 1500, opened: 950, clicked: 350 },
        { label: 'Fri', sent: 1300, opened: 820, clicked: 300 },
        { label: 'Sat', sent: 800, opened: 500, clicked: 150 },
        { label: 'Sun', sent: 1730, opened: 1150, clicked: 450 }
      ]
    },
    '30d': {
      metrics: {
        sent: { value: '32,450', trend: '+8.2%', trendGood: true, sparkline: 'M 0 25 Q 15 15, 30 20 T 60 12 T 90 8 T 100 4' },
        open: { value: '58.7%', trend: '+1.5%', trendGood: true, sparkline: 'M 0 22 Q 15 25, 30 20 T 60 18 T 90 14 T 100 10' },
        click: { value: '18.4%', trend: '+4.2%', trendGood: true, sparkline: 'M 0 28 Q 15 26, 30 24 T 60 20 T 90 15 T 100 12' },
        bounce: { value: '1.4%', trend: '-5.7%', trendGood: true, sparkline: 'M 0 10 Q 15 12, 30 8 T 60 14 T 90 18 T 100 22' }
      },
      chartPoints: [
        { label: 'W1', sent: 6000, opened: 3500, clicked: 1100 },
        { label: 'W2', sent: 7500, opened: 4400, clicked: 1380 },
        { label: 'W3', sent: 8200, opened: 4800, clicked: 1500 },
        { label: 'W4', sent: 10750, opened: 6310, clicked: 1990 }
      ]
    },
    '90d': {
      metrics: {
        sent: { value: '98,120', trend: '+15.8%', trendGood: true, sparkline: 'M 0 28 Q 15 20, 30 24 T 60 15 T 90 10 T 100 2' },
        open: { value: '55.3%', trend: '-0.8%', trendGood: false, sparkline: 'M 0 18 Q 15 20, 30 18 T 60 22 T 90 20 T 100 24' },
        click: { value: '16.1%', trend: '+2.1%', trendGood: true, sparkline: 'M 0 26 Q 15 25, 30 23 T 60 24 T 90 21 T 100 22' },
        bounce: { value: '1.6%', trend: '+1.2%', trendGood: false, sparkline: 'M 0 15 Q 15 12, 30 14 T 60 10 T 90 12 T 100 10' }
      },
      chartPoints: [
        { label: 'Mar', sent: 28000, opened: 15400, clicked: 4500 },
        { label: 'Apr', sent: 32000, opened: 17600, clicked: 5100 },
        { label: 'May', sent: 38120, opened: 21120, clicked: 6200 }
      ]
    }
  };

  readonly activeDataset = computed(() => {
    return this.dashboardDatasets[this.activeRange()];
  });

  readonly chartData = computed(() => {
    const dataset = this.activeDataset();
    const points = dataset.chartPoints;
    const maxVal = Math.max(...points.map(p => p.sent)) * 1.15 || 1000;

    const left = 60;
    const right = 20;
    const top = 20;
    const bottom = 40;
    const width = 800;
    const height = 240;
    const effW = width - left - right;
    const effH = height - top - bottom;

    const coords = points.map((p, idx) => {
      const x = left + (idx * effW) / (points.length - 1);
      return {
        x,
        ySent: top + effH - (p.sent * effH) / maxVal,
        yOpened: top + effH - (p.opened * effH) / maxVal,
        yClicked: top + effH - (p.clicked * effH) / maxVal,
        label: p.label,
        sent: p.sent,
        opened: p.opened,
        clicked: p.clicked
      };
    });

    const pathSent = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.ySent}`).join(' ');
    const pathOpened = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.yOpened}`).join(' ');
    const pathClicked = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.yClicked}`).join(' ');

    const areaSent = coords.length ? `${pathSent} L ${coords[coords.length - 1].x} ${top + effH} L ${coords[0].x} ${top + effH} Z` : '';
    const areaOpened = coords.length ? `${pathOpened} L ${coords[coords.length - 1].x} ${top + effH} L ${coords[0].x} ${top + effH} Z` : '';
    const areaClicked = coords.length ? `${pathClicked} L ${coords[coords.length - 1].x} ${top + effH} L ${coords[0].x} ${top + effH} Z` : '';

    // Grid lines (y positions and labels)
    const gridCount = 4;
    const gridLines = Array.from({ length: gridCount }).map((_, idx) => {
      const val = (maxVal * idx) / (gridCount - 1);
      const y = top + effH - (val * effH) / maxVal;
      return {
        y,
        label: Math.round(val).toLocaleString()
      };
    });

    return {
      coords,
      pathSent,
      pathOpened,
      pathClicked,
      areaSent,
      areaOpened,
      areaClicked,
      gridLines,
      bottomY: top + effH,
      leftX: left,
      rightX: left + effW
    };
  });

  readonly recentActivities = [
    { type: 'sent', campaign: 'Newsletter Mayo 2026', timeKey: 'dashboard.time.1h', icon: 'pi pi-send', colorClass: 'text-emerald-600 bg-emerald-500/10' },
    { type: 'opened', campaign: 'Product Update', timeKey: 'dashboard.time.3h', icon: 'pi pi-eye', colorClass: 'text-blue-500 bg-blue-500/10' },
    { type: 'clicked', campaign: 'Promo Pack', timeKey: 'dashboard.time.5h', icon: 'pi pi-link', colorClass: 'text-teal-500 bg-teal-500/10' },
    { type: 'bounce', campaign: 'user@domain.com', timeKey: 'dashboard.time.1d', icon: 'pi pi-exclamation-triangle', colorClass: 'text-rose-500 bg-rose-500/10' }
  ];

  readonly upcomingCampaigns = [
    { name: 'Weekly Digest', contacts: 1250, date: 'May 24, 09:00 AM' },
    { name: 'Product Feedback', contacts: 500, date: 'Jun 01, 02:00 PM' }
  ];
}
