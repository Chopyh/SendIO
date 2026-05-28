<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    private const LEGACY_OWNER_ROLE = 'Owner';

    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $credentials = $validator->validated();

        if (! $token = auth('api')->attempt($credentials)) {
            return ApiError::response('auth.invalid_credentials', 'Invalid credentials.', 401);
        }

        return $this->tokenResponse($token);
    }

    public function refresh(): JsonResponse
    {
        try {
            $token = auth('api')->refresh();
        } catch (\Throwable $exception) {
            return ApiError::response('auth.invalid_token', 'Token is invalid or expired.', 401);
        }

        return $this->tokenResponse($token);
    }

    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'terms_accepted' => ['required', 'accepted'],
            'account_name' => ['nullable', 'string', 'max:120'],
            'workspace_name' => ['nullable', 'string', 'max:120'],
            'timezone' => ['required', 'string', 'max:80'],
            'locale_default' => ['nullable', 'string', 'in:en,es'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $payload = $validator->validated();

        $result = DB::transaction(function () use ($payload): array {
            $user = User::query()->create([
                'name' => trim($payload['first_name'].' '.$payload['last_name']),
                'email' => strtolower(trim($payload['email'])),
                'password' => $payload['password'],
            ]);

            $workspaceName = ! empty($payload['workspace_name'])
                ? trim($payload['workspace_name'])
                : trim($payload['first_name']).'-workspace';

            $accountName = ! empty($payload['account_name'])
                ? trim($payload['account_name'])
                : $workspaceName;

            $account = Account::query()->create(['name' => $accountName]);

            $workspace = Workspace::query()->create([
                'account_id' => $account->id,
                'name' => $workspaceName,
                'timezone' => $payload['timezone'],
                'locale_default' => $payload['locale_default'] ?? 'en',
            ]);

            WorkspaceMember::query()->create([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'role' => 'owner',
                'joined_at' => now(),
            ]);

            $token = auth('api')->login($user);

            return [$user, $account, $workspace, $token];
        });

        /** @var array{0: User, 1: Account, 2: Workspace, 3: string} $result */
        [$user, $account, $workspace, $token] = $result;

        return response()->json([
            'data' => [
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'refresh_ttl' => (int) config('jwt.refresh_ttl') * 60,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
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

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $memberships = $user->workspaceMemberships()->with('workspace')->get();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'workspaces' => $memberships->map(fn ($membership) => [
                    'id' => $membership->workspace_id,
                    'name' => $membership->workspace?->name,
                    'role' => $membership->role,
                ])->values(),
            ],
        ]);
    }

    private function tokenResponse(string $token): JsonResponse
    {
        return response()->json([
            'data' => [
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'refresh_ttl' => (int) config('jwt.refresh_ttl') * 60,
            ],
        ]);
    }
}
