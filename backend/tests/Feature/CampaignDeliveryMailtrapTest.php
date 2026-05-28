<?php

namespace Tests\Feature;

use App\Jobs\SendCampaignRecipientJob;
use App\Models\Account;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Contact;
use App\Models\Template;
use App\Models\TemplateVersion;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class CampaignDeliveryMailtrapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => 'testing-jwt-secret-1234567890-abcdef',
            'queue.default' => 'sync',
        ]);
    }

    public function test_owner_can_create_campaign_and_dispatch_jobs(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext('Owner');
        [$template, $version] = $this->publishedTemplateInWorkspace($workspace);
        $contacts = $this->createContacts($workspace, 2);

        Queue::fake();

        $createResponse = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/campaigns', [
            'name' => 'Launch Campaign',
            'template_id' => $template->id,
            'template_version_number' => $version->version_number,
            'recipient_ids' => array_map(static fn (Contact $contact): string => $contact->id, $contacts),
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.recipient_count', 2);

        $campaignId = $createResponse->json('data.id');

        $dispatchResponse = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson("/api/campaigns/{$campaignId}/dispatch");

        $dispatchResponse->assertOk()
            ->assertJsonPath('data.status', 'queued');

        Queue::assertPushed(SendCampaignRecipientJob::class, 2);
    }

    public function test_dispatch_rejects_duplicate_request_with_conflict_and_no_extra_jobs(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext('Owner');
        [$template, $version] = $this->publishedTemplateInWorkspace($workspace);
        $contacts = $this->createContacts($workspace, 2);

        Queue::fake();

        $campaignId = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/campaigns', [
            'name' => 'Launch Campaign',
            'template_id' => $template->id,
            'template_version_number' => $version->version_number,
            'recipient_ids' => array_map(static fn (Contact $contact): string => $contact->id, $contacts),
        ])->json('data.id');

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson("/api/campaigns/{$campaignId}/dispatch")
            ->assertOk();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson("/api/campaigns/{$campaignId}/dispatch")
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'campaign.invalid_state');

        Queue::assertPushed(SendCampaignRecipientJob::class, 2);
    }

    public function test_dispatch_rejects_non_workspace_template_or_version(): void
    {
        [$token, $workspace, $user] = $this->authenticatedWorkspaceContext('Owner');
        $otherWorkspace = Workspace::query()->create([
            'account_id' => $workspace->account_id,
            'name' => 'Other Workspace',
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $otherWorkspace->id,
            'user_id' => $user->id,
            'role' => 'Owner',
            'joined_at' => now(),
        ]);

        [$template, ] = $this->publishedTemplateInWorkspace($otherWorkspace);
        $contacts = $this->createContacts($workspace, 1);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/campaigns', [
            'name' => 'Invalid Campaign',
            'template_id' => $template->id,
            'template_version_number' => 1,
            'recipient_ids' => [$contacts[0]->id],
        ]);

        $response->assertStatus(404)
            ->assertJsonPath('error.code', 'template.not_found');
    }

    public function test_job_marks_recipient_sent_when_mail_send_succeeds(): void
    {
        [$workspace] = $this->workspaceContextOnly();
        [$campaign, $recipient] = $this->campaignWithSingleRecipient($workspace);

        Mail::fake();

        $job = new SendCampaignRecipientJob($campaign->id, $recipient->id);
        $job->handle();

        $this->assertDatabaseHas('campaign_recipients', [
            'id' => $recipient->id,
            'status' => 'sent',
            'attempt_count' => 1,
        ]);

        $this->assertDatabaseHas('delivery_attempts', [
            'campaign_recipient_id' => $recipient->id,
            'attempt_number' => 1,
            'status' => 'sent',
        ]);
    }

    public function test_job_tracks_failure_and_retries_until_max_attempts(): void
    {
        [$workspace] = $this->workspaceContextOnly();
        [$campaign, $recipient] = $this->campaignWithSingleRecipient($workspace);

        Mail::shouldReceive('html')->andThrow(new \RuntimeException('SMTP rejected recipient'));

        $job = new SendCampaignRecipientJob($campaign->id, $recipient->id);

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            try {
                $job->handle();
            } catch (\Throwable) {
            }
        }

        $this->assertDatabaseHas('campaign_recipients', [
            'id' => $recipient->id,
            'status' => 'failed',
            'attempt_count' => 3,
        ]);

        $this->assertDatabaseHas('campaigns', [
            'id' => $campaign->id,
            'failed_count' => 1,
        ]);
    }

    public function test_job_does_not_send_when_recipient_is_already_claimed_or_terminal(): void
    {
        [$workspace] = $this->workspaceContextOnly();
        [$campaign, $recipient] = $this->campaignWithSingleRecipient($workspace);

        Mail::fake();

        CampaignRecipient::query()->whereKey($recipient->id)->update([
            'status' => 'sending',
            'last_attempt_at' => now(),
        ]);
        (new SendCampaignRecipientJob($campaign->id, $recipient->id))->handle();

        $this->assertDatabaseHas('campaign_recipients', [
            'id' => $recipient->id,
            'status' => 'sending',
            'attempt_count' => 0,
        ]);

        CampaignRecipient::query()->whereKey($recipient->id)->update(['status' => 'sent']);
        (new SendCampaignRecipientJob($campaign->id, $recipient->id))->handle();

        Mail::assertNothingSent();
        $this->assertDatabaseCount('delivery_attempts', 0);
    }

    public function test_job_reclaims_stale_sending_recipient_after_lease_timeout(): void
    {
        [$workspace] = $this->workspaceContextOnly();
        [$campaign, $recipient] = $this->campaignWithSingleRecipient($workspace);

        CampaignRecipient::query()->whereKey($recipient->id)->update([
            'status' => 'sending',
            'last_attempt_at' => now()->subMinutes(16),
        ]);

        Mail::fake();

        (new SendCampaignRecipientJob($campaign->id, $recipient->id))->handle();

        $this->assertDatabaseHas('campaign_recipients', [
            'id' => $recipient->id,
            'status' => 'sent',
            'attempt_count' => 1,
        ]);

        $this->assertDatabaseHas('delivery_attempts', [
            'campaign_recipient_id' => $recipient->id,
            'attempt_number' => 1,
            'status' => 'sent',
        ]);
    }

    public function test_job_sends_html_body_and_replaces_recipient_and_unsubscribe_placeholders(): void
    {
        [$workspace] = $this->workspaceContextOnly();
        [$campaign, $recipient] = $this->campaignWithSingleRecipient($workspace);

        $campaign->templateVersion->update([
            'snapshot_json' => [
                'sections' => [
                    [
                        'sectionName' => 'Main',
                        'components' => [
                            [
                                'type' => 'text',
                                'content' => '<h1>Hello {{contact.first_name}} {{contact.last_name}}</h1>',
                            ],
                            [
                                'type' => 'button',
                                'url' => '{{system.unsubscribe_url}}',
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        Mail::shouldReceive('html')
            ->once()
            ->withArgs(function (string $body, callable $callback): bool {
                return str_contains($body, '<!doctype html>')
                    && str_contains($body, '<html lang="en">')
                    && str_contains($body, '<body')
                    && str_contains($body, '<h1>Hello Contact 1</h1>')
                    && str_contains($body, '<table role="presentation"')
                    && str_contains($body, 'href="http://localhost/unsubscribe?campaign_recipient_id=')
                    && ! str_contains($body, '{{contact.first_name}}')
                    && ! str_contains($body, '{{system.unsubscribe_url}}');
            });

        (new SendCampaignRecipientJob($campaign->id, $recipient->id))->handle();
    }

    public function test_job_wraps_unsubscribe_only_content_in_complete_html_document(): void
    {
        [$workspace] = $this->workspaceContextOnly();
        [$campaign, $recipient] = $this->campaignWithSingleRecipient($workspace);

        $campaign->templateVersion->update([
            'snapshot_json' => [
                'sections' => [
                    [
                        'sectionName' => 'Main',
                        'components' => [
                            [
                                'type' => 'button',
                                'url' => '{{system.unsubscribe_url}}',
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        Mail::shouldReceive('html')
            ->once()
            ->withArgs(function (string $body, callable $callback): bool {
                return str_starts_with($body, '<!doctype html>')
                    && str_contains($body, '<html lang="en">')
                    && str_contains($body, '<head>')
                    && str_contains($body, '<body')
                    && str_contains($body, '<a href="http://localhost/unsubscribe?campaign_recipient_id=')
                    && str_contains($body, '</body>')
                    && str_contains($body, '</html>')
                    && ! str_contains($body, '{{system.unsubscribe_url}}');
            });

        (new SendCampaignRecipientJob($campaign->id, $recipient->id))->handle();
    }

    public function test_job_replaces_legacy_unsubscribe_url_placeholder(): void
    {
        [$workspace] = $this->workspaceContextOnly();
        [$campaign, $recipient] = $this->campaignWithSingleRecipient($workspace);

        $campaign->templateVersion->update([
            'snapshot_json' => [
                'sections' => [
                    [
                        'sectionName' => 'Main',
                        'components' => [
                            [
                                'type' => 'text',
                                'content' => '<p>Unsubscribe here: {{unsubscribe_url}}</p>',
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        Mail::shouldReceive('html')
            ->once()
            ->withArgs(function (string $body, callable $callback): bool {
                return str_contains($body, 'http://localhost/unsubscribe?campaign_recipient_id=')
                    && ! str_contains($body, '{{unsubscribe_url}}');
            });

        (new SendCampaignRecipientJob($campaign->id, $recipient->id))->handle();
    }

    public function test_workspace_isolation_and_role_authorization_are_enforced(): void
    {
        [$ownerToken, $workspace] = $this->authenticatedWorkspaceContext('Owner');
        [$viewerToken] = $this->authenticatedWorkspaceContext('Viewer', $workspace);
        [$template, $version] = $this->publishedTemplateInWorkspace($workspace);
        $contacts = $this->createContacts($workspace, 1);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$viewerToken,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/campaigns', [
            'name' => 'Viewer Campaign',
            'template_id' => $template->id,
            'template_version_number' => $version->version_number,
            'recipient_ids' => [$contacts[0]->id],
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'campaign.forbidden');

        $campaign = Campaign::query()->create([
            'workspace_id' => $workspace->id,
            'template_id' => $template->id,
            'template_version_id' => $version->id,
            'name' => 'Owner Campaign',
            'status' => 'draft',
            'recipient_count' => 0,
        ]);

        $summaryResponse = $this->withHeaders([
            'Authorization' => 'Bearer '.$ownerToken,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson("/api/campaigns/{$campaign->id}/summary");

        $summaryResponse->assertOk()
            ->assertJsonPath('data.id', $campaign->id);
    }

    /**
     * @return array{0: string, 1: Workspace, 2: User}
     */
    private function authenticatedWorkspaceContext(string $role, ?Workspace $workspace = null): array
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
        ]);

        $workspace = $workspace ?? Workspace::query()->create([
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

        $token = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ])->json('data.access_token');

        return [$token, $workspace, $user];
    }

    /**
     * @return array{0: Workspace}
     */
    private function workspaceContextOnly(): array
    {
        $workspace = Workspace::query()->create([
            'account_id' => Account::query()->create(['name' => 'Acme'])->id,
            'name' => 'Main Workspace',
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        return [$workspace];
    }

    /**
     * @return array{0: Template, 1: TemplateVersion}
     */
    private function publishedTemplateInWorkspace(Workspace $workspace): array
    {
        $template = Template::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Welcome Template',
        ]);

        $version = TemplateVersion::query()->create([
            'template_id' => $template->id,
            'version_number' => 1,
            'state' => 'published',
            'snapshot_json' => [
                'sections' => [
                    [
                        'sectionName' => 'Body',
                        'components' => [
                            [
                                'type' => 'text',
                                'content' => 'Hello {{contact.first_name}}',
                            ],
                        ],
                    ],
                ],
            ],
            'compliance_unsubscribe_url' => true,
        ]);

        return [$template, $version];
    }

    /**
     * @return array<int, Contact>
     */
    private function createContacts(Workspace $workspace, int $count): array
    {
        $contacts = [];

        for ($index = 1; $index <= $count; $index++) {
            $email = "contact{$index}@example.com";

            $contacts[] = Contact::query()->create([
                'workspace_id' => $workspace->id,
                'email' => $email,
                'email_normalized' => $email,
                'first_name' => 'Contact',
                'last_name' => (string) $index,
            ]);
        }

        return $contacts;
    }

    /**
     * @return array{0: Campaign, 1: CampaignRecipient}
     */
    private function campaignWithSingleRecipient(Workspace $workspace): array
    {
        [$template, $version] = $this->publishedTemplateInWorkspace($workspace);
        $contact = $this->createContacts($workspace, 1)[0];

        $campaign = Campaign::query()->create([
            'workspace_id' => $workspace->id,
            'template_id' => $template->id,
            'template_version_id' => $version->id,
            'name' => 'Single Recipient Campaign',
            'status' => 'queued',
            'recipient_count' => 1,
        ]);

        $recipient = CampaignRecipient::query()->create([
            'workspace_id' => $workspace->id,
            'campaign_id' => $campaign->id,
            'contact_id' => $contact->id,
            'email' => $contact->email,
            'status' => 'pending',
            'attempt_count' => 0,
        ]);

        return [$campaign, $recipient];
    }
}
