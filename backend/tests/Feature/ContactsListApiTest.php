<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Contact;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ContactsListApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => 'testing-jwt-secret-1234567890-abcdef',
        ]);
    }

    public function test_contacts_endpoint_returns_workspace_scoped_contacts(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext();

        Contact::query()->create([
            'workspace_id' => $workspace->id,
            'email' => 'ana@example.com',
            'email_normalized' => 'ana@example.com',
            'first_name' => 'Ana',
            'last_name' => 'Ruiz',
            'phone' => '+34111111111',
        ]);

        $otherWorkspace = Workspace::query()->create([
            'account_id' => $workspace->account_id,
            'name' => 'Other Workspace',
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        Contact::query()->create([
            'workspace_id' => $otherWorkspace->id,
            'email' => 'hidden@example.com',
            'email_normalized' => 'hidden@example.com',
            'first_name' => 'Hidden',
            'last_name' => 'Contact',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson('/api/contacts');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'ana@example.com')
            ->assertJsonMissingPath('data.1');
    }

    public function test_contacts_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/contacts');

        $response->assertUnauthorized();
    }

    /**
     * @return array{0: string, 1: Workspace, 2: User}
     */
    private function authenticatedWorkspaceContext(): array
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

        return [$token, $workspace, $user];
    }
}
