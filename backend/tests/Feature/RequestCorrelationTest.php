<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RequestCorrelationTest extends TestCase
{
    public function test_generates_request_id_when_header_is_missing(): void
    {
        Log::spy();

        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);

        $requestId = $response->headers->get('X-Request-ID');

        $this->assertIsString($requestId);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $requestId
        );

        Log::shouldHaveReceived('shareContext')
            ->once()
            ->with(['request_id' => $requestId]);
    }

    public function test_reuses_safe_inbound_request_id(): void
    {
        Log::spy();

        $requestId = 'req-auth-me-123456';

        $response = $this->withHeader('X-Request-ID', $requestId)
            ->getJson('/api/auth/me');

        $response->assertStatus(401)
            ->assertHeader('X-Request-ID', $requestId);

        Log::shouldHaveReceived('shareContext')
            ->once()
            ->with(['request_id' => $requestId]);
    }

    public function test_replaces_unsafe_inbound_request_id(): void
    {
        Log::spy();

        $unsafeRequestId = "unsafe\r\nX-Injected: true";

        $response = $this->withHeader('X-Request-ID', $unsafeRequestId)
            ->getJson('/api/auth/me');

        $response->assertStatus(401);

        $requestId = $response->headers->get('X-Request-ID');

        $this->assertIsString($requestId);
        $this->assertNotSame($unsafeRequestId, $requestId);
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9._:-]+$/', $requestId);

        Log::shouldHaveReceived('shareContext')
            ->once()
            ->with(['request_id' => $requestId]);
    }

    public function test_writes_request_id_to_log_entries(): void
    {
        $logPath = storage_path('logs/request-correlation-test.log');

        if (file_exists($logPath)) {
            unlink($logPath);
        }

        config([
            'logging.default' => 'single',
            'logging.channels.single.path' => $logPath,
        ]);

        Log::forgetChannel('single');

        Route::get('/api/request-correlation-probe', function () {
            Log::info('Request correlation probe');

            return response()->json(['ok' => true]);
        });

        $requestId = 'req-log-proof-123456';

        $this->withHeader('X-Request-ID', $requestId)
            ->getJson('/api/request-correlation-probe')
            ->assertOk()
            ->assertHeader('X-Request-ID', $requestId);

        $this->assertFileExists($logPath);
        $this->assertStringContainsString($requestId, (string) file_get_contents($logPath));
    }
}
