<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['jwt.secret' => 'testing-jwt-secret-1234567890-abcdef']);
    }

    public function test_register_creates_user_account_workspace_owner_membership_and_returns_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'terms_accepted' => true,
            'account_name' => 'Acme Corp',
            'workspace_name' => 'Acme Main',
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'data' => [
                    'access_token',
                    'token_type',
                    'expires_in',
                    'refresh_ttl',
                    'user' => ['id', 'name', 'email'],
                    'workspace' => ['id', 'name', 'timezone', 'locale_default', 'role'],
                ],
            ])
            ->assertJsonPath('data.token_type', 'bearer')
            ->assertJsonPath('data.user.email', 'jane@example.com')
            ->assertJsonPath('data.workspace.role', 'Owner')
            ->assertJsonPath('data.workspace.name', 'Acme Main');

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
        $this->assertDatabaseHas('accounts', ['name' => 'Acme Corp']);
        $this->assertDatabaseHas('workspaces', ['name' => 'Acme Main']);
        $this->assertDatabaseHas('workspace_members', ['role' => 'owner']);
    }

    public function test_register_derives_workspace_name_from_first_name_when_absent(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'email' => 'alice@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'terms_accepted' => true,
            'timezone' => 'America/New_York',
            'locale_default' => 'en',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.workspace.name', 'Alice-workspace');

        $this->assertDatabaseHas('workspaces', ['name' => 'Alice-workspace']);
    }

    public function test_register_derives_account_name_from_workspace_when_absent(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Bob',
            'last_name' => 'Jones',
            'email' => 'bob@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'terms_accepted' => true,
            'workspace_name' => 'Sales Team',
            'timezone' => 'Europe/Madrid',
            'locale_default' => 'es',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('accounts', ['name' => 'Sales Team']);
        $this->assertDatabaseHas('workspaces', ['name' => 'Sales Team']);
    }

    public function test_register_returns_409_on_duplicate_email_without_leaving_partial_records(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Someone',
            'last_name' => 'Else',
            'email' => 'taken@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'terms_accepted' => true,
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'validation.failed');

        $this->assertDatabaseMissing('workspace_members', []);
    }

    public function test_register_requires_terms_accepted(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'terms_accepted' => false,
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'validation.failed');
    }

    public function test_registered_user_can_call_auth_me_with_returned_token(): void
    {
        $registerResponse = $this->postJson('/api/auth/register', [
            'first_name' => 'John',
            'last_name' => 'Miller',
            'email' => 'john.miller@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'terms_accepted' => true,
            'workspace_name' => 'John-workspace',
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        $token = $registerResponse->json('data.access_token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'john.miller@example.com');
    }
}
