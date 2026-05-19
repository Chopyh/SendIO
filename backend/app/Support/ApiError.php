<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiError
{
    public static function response(string $code, string $message, int $status, array $details = []): JsonResponse
    {
        return response()->json([
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details,
            ],
        ], $status);
    }
}
