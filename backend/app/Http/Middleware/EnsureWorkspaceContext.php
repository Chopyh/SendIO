<?php

namespace App\Http\Middleware;

use App\Models\WorkspaceMember;
use App\Support\ApiError;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkspaceContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return ApiError::response('auth.unauthenticated', 'Authentication is required.', 401);
        }

        $workspaceId = $request->header('X-Workspace-Id');

        if (! $workspaceId) {
            return ApiError::response(
                'workspace.required',
                'Workspace context is required.',
                400,
                ['header' => 'X-Workspace-Id']
            );
        }

        $membership = WorkspaceMember::query()
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $user->id)
            ->first();

        if (! $membership) {
            return ApiError::response('workspace.forbidden', 'User is not a member of this workspace.', 403);
        }

        $request->attributes->set('workspace_id', $workspaceId);
        $request->attributes->set('workspace_role', $membership->role);

        return $next($request);
    }
}
