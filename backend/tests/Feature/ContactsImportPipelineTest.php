<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Contact;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ContactsImportPipelineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => 'testing-jwt-secret-1234567890-abcdef',
        ]);
    }

    public function test_import_processes_valid_rows_and_returns_summary(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext();

        $file = UploadedFile::fake()->createWithContent('contacts.csv', implode("\n", [
            'email,first_name,last_name,phone',
            'ana@example.com,Ana,Ruiz,+34111111111',
            'leo@example.com,Leo,Gomez,+34222222222',
        ]));

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/contacts/import', [
            'file' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.summary.processed', 2)
            ->assertJsonPath('data.summary.skipped', 0)
            ->assertJsonPath('data.summary.failed', 0);

        $this->assertDatabaseHas('contacts', [
            'workspace_id' => $workspace->id,
            'email' => 'ana@example.com',
            'email_normalized' => 'ana@example.com',
        ]);
    }

    public function test_import_rejects_invalid_header_schema(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext();

        $file = UploadedFile::fake()->createWithContent('contacts.csv', implode("\n", [
            'email,name,phone',
            'ana@example.com,Ana Ruiz,+34111111111',
        ]));

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/contacts/import', [
            'file' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.summary.processed', 0)
            ->assertJsonPath('data.summary.failed', 1)
            ->assertJsonPath('data.summary.details.failed.0.row', 1);

        $this->assertDatabaseCount('contacts', 0);
    }

    public function test_import_skips_duplicates_and_reports_failed_rows(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext();

        Contact::query()->create([
            'workspace_id' => $workspace->id,
            'email' => 'ana@example.com',
            'email_normalized' => 'ana@example.com',
            'first_name' => 'Ana',
            'last_name' => 'Ruiz',
        ]);

        $file = UploadedFile::fake()->createWithContent('contacts.csv', implode("\n", [
            'email,first_name,last_name,phone',
            'ana@example.com,Ana,Ruiz,+34111111111',
            'invalid-email,No,Valid,+34000000000',
            'maria@example.com,Maria,Lopez,+34333333333',
        ]));

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/contacts/import', [
            'file' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.summary.processed', 1)
            ->assertJsonPath('data.summary.skipped', 1)
            ->assertJsonPath('data.summary.failed', 1)
            ->assertJsonPath('data.summary.details.skipped.0.email', 'ana@example.com')
            ->assertJsonPath('data.summary.details.failed.0.email', 'invalid-email');

        $this->assertDatabaseHas('contacts', [
            'workspace_id' => $workspace->id,
            'email' => 'maria@example.com',
        ]);
    }

    public function test_import_isolated_per_workspace_for_deduplication(): void
    {
        [$token, $workspace, $user] = $this->authenticatedWorkspaceContext();

        $otherWorkspace = Workspace::query()->create([
            'account_id' => $workspace->account_id,
            'name' => 'Secondary Workspace',
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $otherWorkspace->id,
            'user_id' => $user->id,
            'role' => 'Editor',
            'joined_at' => now(),
        ]);

        Contact::query()->create([
            'workspace_id' => $workspace->id,
            'email' => 'shared@example.com',
            'email_normalized' => 'shared@example.com',
        ]);

        $file = UploadedFile::fake()->createWithContent('contacts.csv', implode("\n", [
            'email,first_name,last_name,phone',
            'shared@example.com,Shared,Contact,+34999999999',
        ]));

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $otherWorkspace->id,
        ])->postJson('/api/contacts/import', [
            'file' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.summary.processed', 1)
            ->assertJsonPath('data.summary.skipped', 0)
            ->assertJsonPath('data.summary.failed', 0);

        $this->assertDatabaseHas('contacts', [
            'workspace_id' => $otherWorkspace->id,
            'email_normalized' => 'shared@example.com',
        ]);
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
