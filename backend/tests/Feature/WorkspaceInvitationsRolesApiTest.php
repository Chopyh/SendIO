<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class WorkspaceInvitationsRolesApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['jwt.secret' => 'testing-jwt-secret-1234567890-abcdef']);
    }

    public function test_owner_can_invite_and_user_can_accept_with_matching_email(): void
    {
        [$token, $workspace] = $this->authContext('owner');
        $invitee = User::factory()->create(['email' => 'invitee@example.com', 'password' => Hash::make('secret123')]);
        Mail::fake();

        $createResponse = $this->withHeaders($this->workspaceHeaders($token, $workspace->id))
            ->postJson('/api/workspaces/invitations', [
                'email' => 'invitee@example.com',
                'role' => 'editor',
            ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.role', 'editor')
            ->assertJsonMissingPath('data.token')
            ->assertJsonMissingPath('data.token_hash')
            ->assertJsonMissingPath('data.email_normalized');

        $invitationMail = null;
        Mail::assertSent(\App\Mail\WorkspaceInvitationMail::class, function ($mail) use (&$invitationMail): bool {
            $invitationMail = $mail;

            return true;
        });

        $plainToken = (string) parse_url((string) $invitationMail?->invitationUrl, PHP_URL_QUERY);
        parse_str($plainToken, $query);
        $plainToken = (string) ($query['token'] ?? '');
        $this->assertNotSame('', $plainToken);

        $this->getJson('/api/workspaces/invitations/resolve/'.$plainToken)
            ->assertOk()
            ->assertJsonPath('data.email', 'invitee@example.com')
            ->assertJsonPath('data.workspace_name', 'Main Workspace')
            ->assertJsonPath('data.has_account', true)
            ->assertJsonMissingPath('data.token_hash')
            ->assertJsonMissingPath('data.email_normalized');

        Mail::assertSent(\App\Mail\WorkspaceInvitationMail::class, 1);

        $inviteeToken = $this->postJson('/api/auth/login', ['email' => 'invitee@example.com', 'password' => 'secret123'])->json('data.access_token');

        $this->withHeader('Authorization', 'Bearer '.$inviteeToken)
            ->postJson('/api/workspaces/invitations/accept', ['token' => $plainToken])
            ->assertOk();

        $this->assertDatabaseHas('workspace_members', [
            'workspace_id' => $workspace->id,
            'user_id' => $invitee->id,
            'role' => 'editor',
        ]);

        $this->assertDatabaseHas('workspace_invitations', [
            'workspace_id' => $workspace->id,
            'status' => 'accepted',
        ]);

        $this->assertDatabaseHas('audit_events', ['workspace_id' => $workspace->id, 'event_key' => 'workspace.invitation.accepted']);
    }

    public function test_resolve_returns_has_account_false_for_non_registered_email(): void
    {
        [$token, $workspace] = $this->authContext('owner');
        Mail::fake();

        $createResponse = $this->withHeaders($this->workspaceHeaders($token, $workspace->id))
            ->postJson('/api/workspaces/invitations', [
                'email' => 'new-user@example.com',
                'role' => 'viewer',
            ]);

        $createResponse->assertJsonMissingPath('data.token');

        $invitationMail = null;
        Mail::assertSent(\App\Mail\WorkspaceInvitationMail::class, function ($mail) use (&$invitationMail): bool {
            $invitationMail = $mail;

            return true;
        });

        $plainToken = (string) parse_url((string) $invitationMail?->invitationUrl, PHP_URL_QUERY);
        parse_str($plainToken, $query);
        $plainToken = (string) ($query['token'] ?? '');
        $this->assertNotSame('', $plainToken);

        $this->getJson('/api/workspaces/invitations/resolve/'.$plainToken)
            ->assertOk()
            ->assertJsonPath('data.email', 'new-user@example.com')
            ->assertJsonPath('data.workspace_id', $workspace->id)
            ->assertJsonPath('data.role', 'viewer')
            ->assertJsonPath('data.status', WorkspaceInvitation::STATUS_PENDING)
            ->assertJsonPath('data.has_account', false);
    }

    public function test_non_owner_cannot_invite_or_mutate_members(): void
    {
        [$token, $workspace] = $this->authContext('viewer');

        $this->withHeaders($this->workspaceHeaders($token, $workspace->id))
            ->postJson('/api/workspaces/invitations', ['email' => 'x@example.com', 'role' => 'viewer'])
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'workspace.forbidden');
    }

    public function test_owner_can_update_member_role_and_remove_non_owner_member(): void
    {
        [$token, $workspace] = $this->authContext('owner');
        $member = User::factory()->create();

        $membership = WorkspaceMember::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $member->id,
            'role' => 'viewer',
            'joined_at' => now(),
        ]);

        $this->withHeaders($this->workspaceHeaders($token, $workspace->id))
            ->patchJson('/api/workspaces/members/'.$membership->id, ['role' => 'editor'])
            ->assertOk()
            ->assertJsonPath('data.role', 'editor');

        $this->withHeaders($this->workspaceHeaders($token, $workspace->id))
            ->deleteJson('/api/workspaces/members/'.$membership->id)
            ->assertOk();

        $this->assertDatabaseMissing('workspace_members', ['id' => $membership->id]);
        $this->assertDatabaseHas('audit_events', ['workspace_id' => $workspace->id, 'event_key' => 'workspace.member.role_updated']);
        $this->assertDatabaseHas('audit_events', ['workspace_id' => $workspace->id, 'event_key' => 'workspace.member.removed']);
    }

    public function test_accept_rejects_expired_invitation(): void
    {
        $invitee = User::factory()->create(['email' => 'expired@example.com', 'password' => Hash::make('secret123')]);
        $invitation = WorkspaceInvitation::query()->create([
            'workspace_id' => Workspace::query()->create([
                'account_id' => Account::query()->create(['name' => 'Acme'])->id,
                'name' => 'Main Workspace',
                'timezone' => 'UTC',
                'locale_default' => 'en',
            ])->id,
            'invited_by_user_id' => $invitee->id,
            'email' => 'expired@example.com',
            'email_normalized' => 'expired@example.com',
            'role' => 'viewer',
            'token_hash' => hash('sha256', 'expired-token'),
            'status' => WorkspaceInvitation::STATUS_PENDING,
            'expires_at' => now()->subMinute(),
        ]);

        $inviteeToken = $this->postJson('/api/auth/login', ['email' => 'expired@example.com', 'password' => 'secret123'])->json('data.access_token');

        $this->withHeader('Authorization', 'Bearer '.$inviteeToken)
            ->postJson('/api/workspaces/invitations/accept', ['token' => 'expired-token'])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'invitation.not_acceptable');

        $this->assertDatabaseHas('workspace_invitations', ['id' => $invitation->id, 'status' => WorkspaceInvitation::STATUS_PENDING]);
    }

    public function test_accept_rejects_revoked_invitation(): void
    {
        $invitee = User::factory()->create(['email' => 'revoked@example.com', 'password' => Hash::make('secret123')]);
        $invitation = WorkspaceInvitation::query()->create([
            'workspace_id' => Workspace::query()->create([
                'account_id' => Account::query()->create(['name' => 'Acme'])->id,
                'name' => 'Main Workspace',
                'timezone' => 'UTC',
                'locale_default' => 'en',
            ])->id,
            'invited_by_user_id' => $invitee->id,
            'email' => 'revoked@example.com',
            'email_normalized' => 'revoked@example.com',
            'role' => 'editor',
            'token_hash' => hash('sha256', 'revoked-token'),
            'status' => WorkspaceInvitation::STATUS_REVOKED,
            'revoked_at' => now(),
            'expires_at' => now()->addDay(),
        ]);

        $inviteeToken = $this->postJson('/api/auth/login', ['email' => 'revoked@example.com', 'password' => 'secret123'])->json('data.access_token');

        $this->withHeader('Authorization', 'Bearer '.$inviteeToken)
            ->postJson('/api/workspaces/invitations/accept', ['token' => 'revoked-token'])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'invitation.not_acceptable');

        $this->assertDatabaseHas('workspace_invitations', ['id' => $invitation->id, 'status' => WorkspaceInvitation::STATUS_REVOKED]);
    }

    public function test_accept_rejects_already_accepted_invitation(): void
    {
        $invitee = User::factory()->create(['email' => 'accepted@example.com', 'password' => Hash::make('secret123')]);
        $invitation = WorkspaceInvitation::query()->create([
            'workspace_id' => Workspace::query()->create([
                'account_id' => Account::query()->create(['name' => 'Acme'])->id,
                'name' => 'Main Workspace',
                'timezone' => 'UTC',
                'locale_default' => 'en',
            ])->id,
            'invited_by_user_id' => $invitee->id,
            'email' => 'accepted@example.com',
            'email_normalized' => 'accepted@example.com',
            'role' => 'viewer',
            'token_hash' => hash('sha256', 'accepted-token'),
            'status' => WorkspaceInvitation::STATUS_ACCEPTED,
            'accepted_at' => now(),
            'expires_at' => now()->addDay(),
        ]);

        $inviteeToken = $this->postJson('/api/auth/login', ['email' => 'accepted@example.com', 'password' => 'secret123'])->json('data.access_token');

        $this->withHeader('Authorization', 'Bearer '.$inviteeToken)
            ->postJson('/api/workspaces/invitations/accept', ['token' => 'accepted-token'])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'invitation.not_acceptable');

        $this->assertDatabaseHas('workspace_invitations', ['id' => $invitation->id, 'status' => WorkspaceInvitation::STATUS_ACCEPTED]);
    }

    /**
     * @return array{0: string, 1: Workspace, 2: User}
     */
    private function authContext(string $role): array
    {
        $user = User::factory()->create(['password' => Hash::make('secret123')]);
        $workspace = Workspace::query()->create([
            'account_id' => Account::query()->create(['name' => 'Acme'])->id,
            'name' => 'Main Workspace',
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => $role,
            'joined_at' => now(),
        ]);

        $token = $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'secret123'])->json('data.access_token');

        return [$token, $workspace, $user];
    }

    /**
     * @return array{Authorization: string, X-Workspace-Id: string}
     */
    private function workspaceHeaders(string $token, string $workspaceId): array
    {
        return [
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => $workspaceId,
        ];
    }
}
