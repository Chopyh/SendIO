<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthWorkspaceBootstrapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => 'testing-jwt-secret-1234567890-abcdef',
        ]);
    }

    public function test_user_can_login_get_me_and_refresh_token(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $loginResponse->assertOk()->assertJsonPath('data.token_type', 'bearer');

        $token = $loginResponse->json('data.access_token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/refresh')
            ->assertOk()
            ->assertJsonStructure(['data' => ['access_token', 'token_type', 'expires_in', 'refresh_ttl']]);
    }

    public function test_workspace_bootstrap_creates_owner_membership(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ])->json('data.access_token');

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/workspaces/bootstrap', [
                'account_name' => 'Acme Account',
                'workspace_name' => 'Acme Main',
                'timezone' => 'UTC',
                'locale_default' => 'en',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.workspace.role', 'Owner')
            ->assertJsonPath('data.workspace.name', 'Acme Main');

        $this->assertDatabaseHas('workspace_members', [
            'user_id' => $user->id,
            'role' => 'Owner',
        ]);
    }

    public function test_workspace_scoped_endpoint_rejects_when_unauthenticated(): void
    {
        $this->getJson('/api/workspaces/current')
            ->assertStatus(401)
            ->assertJsonPath('error.code', 'auth.unauthenticated');
    }

    public function test_workspace_scoped_endpoint_rejects_when_workspace_header_is_missing(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
        ]);

        $workspace = Workspace::query()->create([
            'account_id' => Account::query()->create(['name' => 'Acme'])->id,
            'name' => 'Main Workspace',
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => 'Owner',
            'joined_at' => now(),
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ])->json('data.access_token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/workspaces/current')
            ->assertStatus(400)
            ->assertJsonPath('error.code', 'workspace.required');
    }

    public function test_workspace_scoped_endpoint_rejects_when_user_is_not_member(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
        ]);

        $workspace = Workspace::query()->create([
            'account_id' => Account::query()->create(['name' => 'Acme'])->id,
            'name' => 'Main Workspace',
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ])->json('data.access_token');

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson('/api/workspaces/current')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'workspace.forbidden');
    }
}
