<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

class AuditEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $workspaceId = (string) $request->attributes->get('workspace_id');
        $perPage = min(max((int) $request->integer('per_page', 20), 1), 100);

        $query = AuditEvent::query()
            ->where('workspace_id', $workspaceId)
            ->with('actor:id,name,email')
            ->orderByDesc('occurred_at');

        if ($request->filled('event_key')) {
            $query->where('event_key', (string) $request->query('event_key'));
        }

        if ($request->filled('actor_user_id')) {
            $query->where('actor_user_id', (string) $request->query('actor_user_id'));
        }

        if ($request->filled('campaign_id')) {
            $query->whereRaw("(context_json->>'campaign_id') = ?", [(string) $request->query('campaign_id')]);
        }

        if ($request->filled('from')) {
            $query->where('occurred_at', '>=', Carbon::parse((string) $request->query('from')));
        }

        if ($request->filled('to')) {
            $query->where('occurred_at', '<=', Carbon::parse((string) $request->query('to')));
        }

        return response()->json($query->paginate($perPage));
    }
}
