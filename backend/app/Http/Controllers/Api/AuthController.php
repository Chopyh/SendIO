<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
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
