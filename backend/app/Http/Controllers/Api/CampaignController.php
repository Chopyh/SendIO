<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendCampaignRecipientJob;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Contact;
use App\Models\Template;
use App\Models\TemplateVersion;
use App\Services\AuditEventLogger;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CampaignController extends Controller
{
    public function __construct(private readonly AuditEventLogger $auditEventLogger) {}

    public function store(Request $request): JsonResponse
    {
        if (! $this->canManageCampaign($request)) {
            return ApiError::response('campaign.forbidden', 'Only Owner or Editor can manage campaigns.', 403);
        }

        $workspaceId = $request->attributes->get('workspace_id');

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:120'],
            'template_id' => ['required', 'uuid'],
            'template_version_number' => ['required', 'integer', 'min:1'],
            'recipient_ids' => ['required', 'array', 'min:1'],
            'recipient_ids.*' => ['required', 'uuid'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $template = Template::query()
            ->where('workspace_id', $workspaceId)
            ->find($request->string('template_id')->toString());

        if (! $template) {
            return ApiError::response('template.not_found', 'Template not found.', 404);
        }

        $version = TemplateVersion::query()
            ->where('template_id', $template->id)
            ->where('version_number', (int) $request->integer('template_version_number'))
            ->where('state', 'published')
            ->first();

        if (! $version) {
            return ApiError::response('template.version_not_found', 'Published template version not found.', 404);
        }

        $recipientIds = collect($request->input('recipient_ids', []))->map(static fn ($id): string => (string) $id)->values();

        $contacts = Contact::query()
            ->where('workspace_id', $workspaceId)
            ->whereIn('id', $recipientIds)
            ->get();

        if ($contacts->count() !== $recipientIds->count()) {
            return ApiError::response('campaign.recipients_invalid', 'Some recipients are invalid for this workspace.', 422);
        }

        $campaign = DB::transaction(function () use ($workspaceId, $template, $version, $contacts, $request): Campaign {
            $campaign = Campaign::query()->create([
                'workspace_id' => $workspaceId,
                'template_id' => $template->id,
                'template_version_id' => $version->id,
                'name' => $request->string('name')->toString(),
                'status' => 'draft',
                'recipient_count' => $contacts->count(),
            ]);

            foreach ($contacts as $contact) {
                CampaignRecipient::query()->create([
                    'workspace_id' => $workspaceId,
                    'campaign_id' => $campaign->id,
                    'contact_id' => $contact->id,
                    'email' => $contact->email,
                    'status' => 'pending',
                ]);
            }

            return $campaign;
        });

        return response()->json(['data' => $campaign], 201);
    }

    public function dispatch(Request $request, string $campaignId): JsonResponse
    {
        if (! $this->canManageCampaign($request)) {
            return ApiError::response('campaign.forbidden', 'Only Owner or Editor can manage campaigns.', 403);
        }

        $workspaceId = $request->attributes->get('workspace_id');

        $campaign = Campaign::query()
            ->where('workspace_id', $workspaceId)
            ->find($campaignId);

        if (! $campaign) {
            return ApiError::response('campaign.not_found', 'Campaign not found.', 404);
        }

        if (! in_array($campaign->status, ['draft', 'failed'], true)) {
            return ApiError::response('campaign.invalid_state', 'Campaign cannot be dispatched in current state.', 409);
        }

        $actorUserId = $request->user()?->id;

        $this->auditEventLogger->record($workspaceId, $actorUserId, 'campaign.dispatch.requested', [
            'campaign_id' => $campaign->id,
            'status_before' => $campaign->status,
        ]);

        $dispatched = DB::transaction(function () use ($campaign, $workspaceId, $actorUserId): bool {
            $updated = Campaign::query()
                ->where('workspace_id', $workspaceId)
                ->whereKey($campaign->id)
                ->whereIn('status', ['draft', 'failed'])
                ->update([
                    'status' => 'queued',
                    'dispatched_at' => now(),
                    'completed_at' => null,
                ]);

            if ($updated !== 1) {
                return false;
            }

            $recipients = CampaignRecipient::query()
                ->where('campaign_id', $campaign->id)
                ->where('status', 'pending')
                ->get();

            foreach ($recipients as $recipient) {
                SendCampaignRecipientJob::dispatch($campaign->id, $recipient->id);
            }

            $this->auditEventLogger->record($workspaceId, $actorUserId, 'campaign.dispatch.queued', [
                'campaign_id' => $campaign->id,
                'status_after' => 'queued',
                'recipients_queued_count' => $recipients->count(),
            ]);

            return true;
        });

        if (! $dispatched) {
            return ApiError::response('campaign.invalid_state', 'Campaign is already dispatched or cannot be dispatched in current state.', 409);
        }

        return response()->json(['data' => $campaign->fresh()]);
    }

    public function summary(Request $request, string $campaignId): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $campaign = Campaign::query()
            ->where('workspace_id', $workspaceId)
            ->withCount([
                'recipients as pending_recipients_count' => fn ($query) => $query->whereIn('status', ['pending', 'sending']),
                'recipients as sent_recipients_count' => fn ($query) => $query->where('status', 'sent'),
                'recipients as failed_recipients_count' => fn ($query) => $query->where('status', 'failed'),
            ])
            ->find($campaignId);

        if (! $campaign) {
            return ApiError::response('campaign.not_found', 'Campaign not found.', 404);
        }

        return response()->json(['data' => $campaign]);
    }

    private function canManageCampaign(Request $request): bool
    {
        $role = (string) $request->attributes->get('workspace_role');

        return in_array($role, ['Owner', 'Editor'], true);
    }
}
