<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportingController extends Controller
{
    public function campaigns(Request $request): JsonResponse
    {
        $workspaceId = (string) $request->attributes->get('workspace_id');

        $perPage = min(max((int) $request->integer('per_page', 20), 1), 100);

        $campaigns = Campaign::query()
            ->where('workspace_id', $workspaceId)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($campaigns);
    }

    public function metrics(Request $request, string $campaignId): JsonResponse
    {
        $workspaceId = (string) $request->attributes->get('workspace_id');

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

        $totalAttempts = (int) $campaign->recipients()
            ->selectRaw('COALESCE(SUM(attempt_count), 0) as attempts_total')
            ->value('attempts_total');

        return response()->json([
            'data' => [
                'campaign_id' => $campaign->id,
                'status' => $campaign->status,
                'recipient_count' => $campaign->recipient_count,
                'sent_count' => $campaign->sent_count,
                'failed_count' => $campaign->failed_count,
                'pending_recipients_count' => $campaign->pending_recipients_count,
                'sent_recipients_count' => $campaign->sent_recipients_count,
                'failed_recipients_count' => $campaign->failed_recipients_count,
                'attempts_total' => $totalAttempts,
                'dispatched_at' => $campaign->dispatched_at,
                'completed_at' => $campaign->completed_at,
            ],
        ]);
    }
}
