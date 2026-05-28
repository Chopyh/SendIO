import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { I18nStore } from '../../core/i18n/i18n.store';
import { SessionStore } from '../../core/auth/session.store';
import { WorkspaceMembersApiService } from '../../core/workspaces/workspace-members-api.service';

@Component({
  selector: 'app-invitation-accept-page',
  imports: [ButtonModule, CardModule],
  template: `
    <section class="mx-auto max-w-xl py-8">
      <p-card>
        <ng-template pTemplate="title">{{ i18nStore.t('invitation.accept.title') }}</ng-template>
        <p>{{ message() }}</p>
        @if (canAccept()) {
          <p-button [label]="i18nStore.t('invitation.accept.action')" (onClick)="accept()" />
        }
      </p-card>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationAcceptPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly i18nStore = inject(I18nStore);
  private readonly sessionStore = inject(SessionStore);
  private readonly api = inject(WorkspaceMembersApiService);

  readonly token = this.route.snapshot.queryParamMap.get('token') ?? this.route.snapshot.paramMap.get('token') ?? '';
  readonly message = signal(this.i18nStore.t('invitation.accept.loading'));
  readonly invitationEmail = signal<string | null>(null);
  readonly canAccept = computed(() => this.sessionStore.isAuthenticated() && !!this.invitationEmail());

  constructor() {
    void this.resolve();
  }

  async resolve(): Promise<void> {
    if (!this.token) {
      this.message.set(this.i18nStore.t('invitation.accept.invalid'));
      return;
    }

    try {
      const response = await firstValueFrom(this.api.resolveInvitation(this.token));
      const invitationEmail = response.data.email.trim().toLowerCase();
      this.invitationEmail.set(invitationEmail);

      if (!this.sessionStore.isAuthenticated()) {
        const route = response.data.has_account ? '/auth/login' : '/auth/register';
        await this.router.navigate([route], {
          queryParams: {
            returnUrl: `/invitations/accept?token=${encodeURIComponent(this.token)}`,
            invitationEmail,
          },
        });
        return;
      }

      this.message.set(this.i18nStore.t('invitation.accept.ready'));
    } catch {
      this.message.set(this.i18nStore.t('invitation.accept.invalid'));
    }
  }

  async accept(): Promise<void> {
    await firstValueFrom(this.api.acceptInvitation(this.token));
    await this.sessionStore.hydrateCurrentUser();
    this.message.set(this.i18nStore.t('invitation.accept.success'));
    await this.router.navigateByUrl('/app');
  }
}
