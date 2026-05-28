<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\DeliveryAttempt;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendCampaignRecipientJob implements ShouldQueue
{
    use Queueable;

    private const SENDING_LEASE_TIMEOUT_MINUTES = 15;

    public int $tries = 3;

    public function __construct(public string $campaignId, public string $campaignRecipientId)
    {
    }

    public function handle(): void
    {
        $campaign = Campaign::query()->with('templateVersion')->findOrFail($this->campaignId);
        $claimTimestamp = now();
        $staleLeaseThreshold = $claimTimestamp->copy()->subMinutes(self::SENDING_LEASE_TIMEOUT_MINUTES);

        $claimed = CampaignRecipient::query()
            ->where('campaign_id', $campaign->id)
            ->whereKey($this->campaignRecipientId)
            ->where(function ($query) use ($staleLeaseThreshold): void {
                $query->where('status', 'pending')
                    ->orWhere(function ($staleQuery) use ($staleLeaseThreshold): void {
                        $staleQuery->where('status', 'sending')
                            ->where(function ($leaseQuery) use ($staleLeaseThreshold): void {
                                $leaseQuery->where('last_attempt_at', '<=', $staleLeaseThreshold)
                                    ->orWhereNull('last_attempt_at');
                            });
                    });
            })
            ->update([
                'status' => 'sending',
                'last_attempt_at' => $claimTimestamp,
            ]);

        if ($claimed !== 1) {
            return;
        }

        $recipient = CampaignRecipient::query()->where('campaign_id', $campaign->id)->findOrFail($this->campaignRecipientId);

        $attemptNumber = $recipient->attempt_count + 1;

        try {
            $body = $this->renderBody($campaign->templateVersion?->snapshot_json ?? [], $recipient);

            Mail::html($body, function ($message) use ($recipient, $campaign): void {
                $message->to($recipient->email)
                    ->subject($campaign->name);
            });

            DB::transaction(function () use ($campaign, $recipient, $attemptNumber, $claimTimestamp): void {
                $updated = CampaignRecipient::query()
                    ->whereKey($recipient->id)
                    ->where('status', 'sending')
                    ->where('last_attempt_at', $claimTimestamp)
                    ->update([
                    'status' => 'sent',
                    'attempt_count' => $attemptNumber,
                    'last_error' => null,
                    'sent_at' => now(),
                    'next_retry_at' => null,
                ]);

                if ($updated !== 1) {
                    return;
                }

                DeliveryAttempt::query()->create([
                    'campaign_id' => $campaign->id,
                    'campaign_recipient_id' => $recipient->id,
                    'attempt_number' => $attemptNumber,
                    'status' => 'sent',
                    'attempted_at' => now(),
                ]);

                $this->refreshCampaignCounters($campaign);
            });
        } catch (\Throwable $throwable) {
            DB::transaction(function () use ($campaign, $recipient, $attemptNumber, $throwable, $claimTimestamp): void {
                $isFinalAttempt = $attemptNumber >= 3;

                $updated = CampaignRecipient::query()
                    ->whereKey($recipient->id)
                    ->where('status', 'sending')
                    ->where('last_attempt_at', $claimTimestamp)
                    ->update([
                    'status' => $isFinalAttempt ? 'failed' : 'pending',
                    'attempt_count' => $attemptNumber,
                    'last_error' => $throwable->getMessage(),
                    'next_retry_at' => $isFinalAttempt ? null : now()->addMinute(),
                ]);

                if ($updated !== 1) {
                    return;
                }

                DeliveryAttempt::query()->create([
                    'campaign_id' => $campaign->id,
                    'campaign_recipient_id' => $recipient->id,
                    'attempt_number' => $attemptNumber,
                    'status' => 'failed',
                    'error_message' => $throwable->getMessage(),
                    'attempted_at' => now(),
                ]);

                $this->refreshCampaignCounters($campaign);
            });

            if ($attemptNumber < 3) {
                throw $throwable;
            }
        }
    }

    private function refreshCampaignCounters(Campaign $campaign): void
    {
        $sent = $campaign->recipients()->where('status', 'sent')->count();
        $failed = $campaign->recipients()->where('status', 'failed')->count();
        $pending = $campaign->recipients()->whereIn('status', ['pending', 'sending'])->count();

        $campaign->update([
            'sent_count' => $sent,
            'failed_count' => $failed,
            'status' => $pending === 0 ? 'completed' : 'running',
            'completed_at' => $pending === 0 ? now() : null,
        ]);
    }

    private function renderBody(array $snapshot, CampaignRecipient $recipient): string
    {
        $blocks = [];

        foreach ($snapshot['sections'] ?? [] as $section) {
            foreach ($section['components'] ?? [] as $component) {
                $type = (string) ($component['type'] ?? '');

                if ($type === 'text') {
                    $content = trim((string) ($component['content'] ?? ''));
                    if ($content !== '') {
                        $blocks[] = $content;
                    }
                    continue;
                }

                if ($type === 'button') {
                    $url = trim((string) ($component['url'] ?? ''));
                    if ($url !== '') {
                        $blocks[] = $this->renderButton($url);
                    }
                }
            }
        }

        $content = trim(implode("\n", $blocks));
        $content = $content !== '' ? $content : '<p>Campaign message</p>';
        $body = $this->wrapHtmlDocument($content);

        return $this->replacePlaceholders($body, $recipient);
    }

    private function renderButton(string $url): string
    {
        $escapedUrl = htmlspecialchars($url, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        return '<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">'
            .'<tr>'
            .'<td style="border-radius: 6px; background: #2563eb;">'
            .'<a href="'.$escapedUrl.'" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 18px; color: #ffffff; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; line-height: 1.2; text-decoration: none;">'
            .$escapedUrl
            .'</a>'
            .'</td>'
            .'</tr>'
            .'</table>';
    }

    private function wrapHtmlDocument(string $content): string
    {
        return '<!doctype html>'
            ."\n".'<html lang="en">'
            ."\n".'<head>'
            ."\n".'<meta charset="utf-8">'
            ."\n".'<meta name="viewport" content="width=device-width, initial-scale=1">'
            ."\n".'<title>SendIO Campaign</title>'
            ."\n".'</head>'
            ."\n".'<body style="margin: 0; padding: 0; background: #f8fafc;">'
            ."\n".'<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background: #f8fafc; margin: 0; padding: 24px 0; width: 100%;">'
            ."\n".'<tr>'
            ."\n".'<td align="center" style="padding: 0 16px;">'
            ."\n".'<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; max-width: 640px; width: 100%;">'
            ."\n".'<tr>'
            ."\n".'<td style="color: #0f172a; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; padding: 32px;">'
            ."\n".$content
            ."\n".'</td>'
            ."\n".'</tr>'
            ."\n".'</table>'
            ."\n".'</td>'
            ."\n".'</tr>'
            ."\n".'</table>'
            ."\n".'</body>'
            ."\n".'</html>';
    }

    private function replacePlaceholders(string $body, CampaignRecipient $recipient): string
    {
        $unsubscribeUrl = htmlspecialchars($this->resolveUnsubscribeUrl($recipient), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $firstName = htmlspecialchars((string) ($recipient->contact?->first_name ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $lastName = htmlspecialchars((string) ($recipient->contact?->last_name ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        $body = str_replace('{{contact.first_name}}', $firstName, $body);
        $body = str_replace('{{contact.last_name}}', $lastName, $body);
        $body = str_replace('{{unsubscribe_url}}', $unsubscribeUrl, $body);
        $body = str_replace('{{system.unsubscribe_url}}', $unsubscribeUrl, $body);

        return $body;
    }

    private function resolveUnsubscribeUrl(CampaignRecipient $recipient): string
    {
        $baseUrl = rtrim((string) config('app.url', 'http://localhost'), '/');

        return $baseUrl.'/unsubscribe?campaign_recipient_id='.$recipient->id;
    }
}
