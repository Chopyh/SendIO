<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class CorrelateRequests
{
    private const HeaderName = 'X-Request-ID';

    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $this->resolveRequestId($request);

        $request->attributes->set('request_id', $requestId);

        Log::shareContext([
            'request_id' => $requestId,
        ]);

        $response = $next($request);
        $response->headers->set(self::HeaderName, $requestId);

        return $response;
    }

    private function resolveRequestId(Request $request): string
    {
        $requestId = $request->headers->get(self::HeaderName);

        if (is_string($requestId) && $this->isSafeRequestId($requestId)) {
            return $requestId;
        }

        return (string) Str::uuid();
    }

    private function isSafeRequestId(string $requestId): bool
    {
        if (strlen($requestId) < 8 || strlen($requestId) > 128) {
            return false;
        }

        return preg_match('/^[A-Za-z0-9._:-]+$/', $requestId) === 1;
    }
}
