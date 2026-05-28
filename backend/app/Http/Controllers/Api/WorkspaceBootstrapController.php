<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class WorkspaceBootstrapController extends Controller
{
    private const LEGACY_OWNER_ROLE = 'Owner';

    public function bootstrap(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'account_name' => ['required', 'string', 'max:120'],
            'workspace_name' => ['required', 'string', 'max:120'],
            'timezone' => ['required', 'string', 'max:80'],
            'locale_default' => ['required', 'string', 'in:en,es'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $user = $request->user();

        if ($user->workspaceMemberships()->exists()) {
            return ApiError::response('workspace.bootstrap_conflict', 'User already belongs to a workspace.', 409);
        }

        $payload = $validator->validated();

        $result = DB::transaction(function () use ($payload, $user): array {
            $account = Account::query()->create([
                'name' => $payload['account_name'],
            ]);

            $workspace = Workspace::query()->create([
                'account_id' => $account->id,
                'name' => $payload['workspace_name'],
                'timezone' => $payload['timezone'],
                'locale_default' => $payload['locale_default'],
            ]);

            WorkspaceMember::query()->create([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'role' => 'owner',
                'joined_at' => now(),
            ]);

            return [$account, $workspace];
        });

        /** @var array{0: Account, 1: Workspace} $result */
        [$account, $workspace] = $result;

        return response()->json([
            'data' => [
                'account' => [
                    'id' => $account->id,
                    'name' => $account->name,
                ],
                'workspace' => [
                    'id' => $workspace->id,
                    'name' => $workspace->name,
                    'timezone' => $workspace->timezone,
                    'locale_default' => $workspace->locale_default,
                    'role' => self::LEGACY_OWNER_ROLE,
                ],
            ],
        ], 201);
    }

    public function current(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'workspace_id' => $request->attributes->get('workspace_id'),
                'role' => $request->attributes->get('workspace_role'),
            ],
        ]);
    }
}
