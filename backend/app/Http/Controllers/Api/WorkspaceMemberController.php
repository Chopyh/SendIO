<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkspaceMember;
use App\Services\AuditEventLogger;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WorkspaceMemberController extends Controller
{
    public function __construct(private readonly AuditEventLogger $auditEventLogger) {}

    public function index(Request $request): JsonResponse
    {
        $workspaceId = (string) $request->attributes->get('workspace_id');

        $members = WorkspaceMember::query()
            ->where('workspace_id', $workspaceId)
            ->with('user:id,email,name')
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $members]);
    }

    public function updateRole(Request $request, string $id): JsonResponse
    {
        if (! $this->isOwner($request)) {
            return ApiError::response('workspace.forbidden', 'Only workspace owners can perform this action.', 403);
        }

        $validator = Validator::make($request->all(), ['role' => ['required', 'in:editor,viewer']]);
        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $workspaceId = (string) $request->attributes->get('workspace_id');
        $member = WorkspaceMember::query()->where('workspace_id', $workspaceId)->where('id', $id)->first();
        if (! $member) {
            return ApiError::response('member.not_found', 'Member was not found.', 404);
        }

        if (strtolower($member->role) === 'owner') {
            return ApiError::response('member.owner_role_locked', 'Owner role cannot be changed.', 422);
        }

        $oldRole = $member->role;
        $member->update(['role' => $validator->validated()['role']]);

        $this->auditEventLogger->record($workspaceId, (string) $request->user()->id, 'workspace.member.role_updated', [
            'member_id' => $member->id,
            'old_role' => $oldRole,
            'new_role' => $member->role,
        ]);

        return response()->json(['data' => $member->fresh('user')]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        if (! $this->isOwner($request)) {
            return ApiError::response('workspace.forbidden', 'Only workspace owners can perform this action.', 403);
        }

        $workspaceId = (string) $request->attributes->get('workspace_id');
        $member = WorkspaceMember::query()->where('workspace_id', $workspaceId)->where('id', $id)->first();
        if (! $member) {
            return ApiError::response('member.not_found', 'Member was not found.', 404);
        }

        if (strtolower($member->role) === 'owner') {
            return ApiError::response('member.owner_remove_forbidden', 'Workspace owner cannot be removed.', 422);
        }

        $memberId = $member->id;
        $member->delete();

        $this->auditEventLogger->record($workspaceId, (string) $request->user()->id, 'workspace.member.removed', [
            'member_id' => $memberId,
        ]);

        return response()->json(['data' => ['removed' => true, 'member_id' => $memberId]]);
    }

    private function isOwner(Request $request): bool
    {
        return strtolower((string) $request->attributes->get('workspace_role')) === 'owner';
    }
}
