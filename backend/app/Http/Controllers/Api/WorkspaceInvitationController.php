<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\WorkspaceInvitationMail;
use App\Models\User;
use App\Models\WorkspaceInvitation;
use App\Models\WorkspaceMember;
use App\Services\AuditEventLogger;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class WorkspaceInvitationController extends Controller
{
    public function __construct(private readonly AuditEventLogger $auditEventLogger) {}

    public function index(Request $request): JsonResponse
    {
        $workspaceId = (string) $request->attributes->get('workspace_id');

        $rows = WorkspaceInvitation::query()
            ->where('workspace_id', $workspaceId)
            ->latest()
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->isOwner($request)) {
            return ApiError::response('workspace.forbidden', 'Only workspace owners can perform this action.', 403);
        }

        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'role' => ['required', 'in:editor,viewer'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $workspaceId = (string) $request->attributes->get('workspace_id');
        $actorUserId = (string) $request->user()->id;
        $payload = $validator->validated();
        $normalizedEmail = strtolower(trim($payload['email']));

        if (WorkspaceMember::query()->where('workspace_id', $workspaceId)->whereHas('user', fn ($q) => $q->where('email', $normalizedEmail))->exists()) {
            return ApiError::response('invitation.member_exists', 'User already belongs to this workspace.', 409);
        }

        $plainToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $plainToken);

        $invitation = WorkspaceInvitation::query()->create([
            'workspace_id' => $workspaceId,
            'invited_by_user_id' => $actorUserId,
            'email' => $payload['email'],
            'email_normalized' => $normalizedEmail,
            'role' => $payload['role'],
            'token_hash' => $tokenHash,
            'status' => WorkspaceInvitation::STATUS_PENDING,
            'expires_at' => now()->addDays(7),
        ]);

        Mail::to($invitation->email)->send(new WorkspaceInvitationMail(
            workspaceName: (string) $invitation->workspace->name,
            role: (string) $invitation->role,
            invitationUrl: $this->buildInvitationAcceptUrl($plainToken),
            expiresAt: $invitation->expires_at,
        ));

        $this->auditEventLogger->record($workspaceId, $actorUserId, 'workspace.invitation.created', [
            'invitation_id' => $invitation->id,
            'email' => $invitation->email,
            'role' => $invitation->role,
        ]);

        return response()->json([
            'data' => $invitation,
        ], 201);
    }

    public function resolve(string $token): JsonResponse
    {
        $invitation = $this->findByToken($token);

        if (! $invitation) {
            return ApiError::response('invitation.not_found', 'Invitation token is invalid.', 404);
        }

        if (! $invitation->isAcceptable()) {
            return ApiError::response('invitation.not_acceptable', 'Invitation can no longer be accepted.', 422);
        }

        return response()->json([
            'data' => [
                'workspace_id' => $invitation->workspace_id,
                'workspace_name' => (string) $invitation->workspace->name,
                'email' => $invitation->email,
                'role' => $invitation->role,
                'expires_at' => $invitation->expires_at,
                'status' => $invitation->status,
                'has_account' => User::query()->where('email', $invitation->email_normalized)->exists(),
            ],
        ]);
    }

    public function revoke(Request $request, string $id): JsonResponse
    {
        if (! $this->isOwner($request)) {
            return ApiError::response('workspace.forbidden', 'Only workspace owners can perform this action.', 403);
        }

        $workspaceId = (string) $request->attributes->get('workspace_id');
        $actorUserId = (string) $request->user()->id;
        $invitation = WorkspaceInvitation::query()->where('workspace_id', $workspaceId)->where('id', $id)->first();

        if (! $invitation) {
            return ApiError::response('invitation.not_found', 'Invitation was not found.', 404);
        }

        if ($invitation->status !== WorkspaceInvitation::STATUS_PENDING) {
            return ApiError::response('invitation.not_pending', 'Only pending invitations can be revoked.', 422);
        }

        $invitation->update([
            'status' => WorkspaceInvitation::STATUS_REVOKED,
            'revoked_at' => now(),
        ]);

        $this->auditEventLogger->record($workspaceId, $actorUserId, 'workspace.invitation.revoked', [
            'invitation_id' => $invitation->id,
        ]);

        return response()->json(['data' => $invitation->fresh()]);
    }

    public function accept(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), ['token' => ['required', 'string']]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $invitation = $this->findByToken($validator->validated()['token']);
        if (! $invitation) {
            return ApiError::response('invitation.not_found', 'Invitation token is invalid.', 404);
        }

        if (! $invitation->isAcceptable()) {
            return ApiError::response('invitation.not_acceptable', 'Invitation can no longer be accepted.', 422);
        }

        $user = $request->user();
        if (strtolower((string) $user->email) !== $invitation->email_normalized) {
            return ApiError::response('invitation.email_mismatch', 'Invitation email does not match authenticated user.', 403);
        }

        WorkspaceMember::query()->firstOrCreate([
            'workspace_id' => $invitation->workspace_id,
            'user_id' => $user->id,
        ], [
            'role' => $invitation->role,
            'joined_at' => now(),
        ]);

        $invitation->update([
            'status' => WorkspaceInvitation::STATUS_ACCEPTED,
            'accepted_at' => now(),
        ]);

        $this->auditEventLogger->record((string) $invitation->workspace_id, (string) $user->id, 'workspace.invitation.accepted', [
            'invitation_id' => $invitation->id,
            'role' => $invitation->role,
        ]);

        return response()->json(['data' => $invitation->fresh()]);
    }

    private function findByToken(string $token): ?WorkspaceInvitation
    {
        return WorkspaceInvitation::query()
            ->where('token_hash', hash('sha256', $token))
            ->first();
    }

    private function isOwner(Request $request): bool
    {
        $role = strtolower((string) $request->attributes->get('workspace_role'));

        return $role === 'owner';
    }

    private function buildInvitationAcceptUrl(string $token): string
    {
        $baseUrl = rtrim((string) config('app.frontend_url', config('app.url', 'http://localhost:4200')), '/');

        return $baseUrl.'/invitations/accept?token='.urlencode($token);
    }
}
