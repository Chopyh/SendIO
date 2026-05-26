<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\AuditEvent;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Contact;
use App\Models\Template;
use App\Models\TemplateVersion;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ReportingAuditTrailApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => 'testing-jwt-secret-1234567890-abcdef',
        ]);
    }

    public function test_reports_campaigns_list_and_metrics_are_workspace_scoped(): void
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

        $campaign = $this->campaignInWorkspace($workspace, 'Main Campaign');
        $otherCampaign = $this->campaignInWorkspace($otherWorkspace, 'Other Campaign');

        CampaignRecipient::query()->create([
            'workspace_id' => $workspace->id,
            'campaign_id' => $campaign->id,
            'contact_id' => Contact::query()->create([
                'workspace_id' => $workspace->id,
                'email' => 'sent@example.com',
                'email_normalized' => 'sent@example.com',
            ])->id,
            'email' => 'sent@example.com',
            'status' => 'sent',
            'attempt_count' => 1,
        ]);

        CampaignRecipient::query()->create([
            'workspace_id' => $workspace->id,
            'campaign_id' => $campaign->id,
            'contact_id' => Contact::query()->create([
                'workspace_id' => $workspace->id,
                'email' => 'failed@example.com',
                'email_normalized' => 'failed@example.com',
            ])->id,
            'email' => 'failed@example.com',
            'status' => 'failed',
            'attempt_count' => 2,
        ]);

        $listResponse = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson('/api/reports/campaigns');

        $listResponse->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $campaign->id);

        $metricsResponse = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson("/api/reports/campaigns/{$campaign->id}/metrics");

        $metricsResponse->assertOk()
            ->assertJsonPath('data.campaign_id', $campaign->id)
            ->assertJsonPath('data.sent_recipients_count', 1)
            ->assertJsonPath('data.failed_recipients_count', 1)
            ->assertJsonPath('data.attempts_total', 3);

        $forbiddenMetrics = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson("/api/reports/campaigns/{$otherCampaign->id}/metrics");

        $forbiddenMetrics->assertStatus(404)
            ->assertJsonPath('error.code', 'campaign.not_found');
    }

    public function test_audit_events_are_emitted_for_dispatch_import_and_publish(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext('Owner');
        [$template, $version] = $this->publishedTemplateInWorkspace($workspace);
        $contacts = $this->createContacts($workspace, 1);

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
        ])->postJson("/api/campaigns/{$campaignId}/dispatch")->assertOk();

        $importFile = UploadedFile::fake()->createWithContent('contacts.csv', implode("\n", [
            'email,first_name,last_name,phone',
            'ana@example.com,Ana,Ruiz,+34111111111',
        ]));

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/contacts/import', ['file' => $importFile])->assertOk();

        $draftTemplate = Template::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Draft Template',
        ]);

        TemplateVersion::query()->create([
            'template_id' => $draftTemplate->id,
            'version_number' => 1,
            'state' => 'draft',
            'snapshot_json' => [
                'sections' => [[
                    'sectionName' => 'Main',
                    'components' => [[
                        'blockId' => 1,
                        'blockName' => 'Body',
                        'type' => 'text',
                        'content' => 'Hi {{contact.first_name}} {{unsubscribe_url}}',
                        'posX' => 0,
                        'posY' => 0,
                    ]],
                ]],
            ],
            'compliance_unsubscribe_url' => false,
        ]);

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson("/api/templates/{$draftTemplate->id}/versions/1/publish")->assertOk();

        $this->assertDatabaseHas('audit_events', ['workspace_id' => $workspace->id, 'event_key' => 'campaign.dispatch.requested']);
        $this->assertDatabaseHas('audit_events', ['workspace_id' => $workspace->id, 'event_key' => 'campaign.dispatch.queued']);
        $this->assertDatabaseHas('audit_events', ['workspace_id' => $workspace->id, 'event_key' => 'contacts.import.completed']);
        $this->assertDatabaseHas('audit_events', ['workspace_id' => $workspace->id, 'event_key' => 'template.version.published']);
    }

    public function test_contacts_import_rejected_schema_emits_audit_event(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext('Owner');

        $invalidSchemaFile = UploadedFile::fake()->createWithContent('contacts.csv', implode("\n", [
            'email,name,phone',
            'ana@example.com,Ana Ruiz,+34111111111',
        ]));

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/contacts/import', ['file' => $invalidSchemaFile])->assertOk();

        $this->assertDatabaseHas('audit_events', [
            'workspace_id' => $workspace->id,
            'event_key' => 'contacts.import.rejected_schema',
        ]);
    }

    public function test_audit_events_query_supports_filters_pagination_and_workspace_isolation(): void
    {
        [$token, $workspace, $user] = $this->authenticatedWorkspaceContext('Owner');

        $otherWorkspace = Workspace::query()->create([
            'account_id' => $workspace->account_id,
            'name' => 'Audit Other Workspace',
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $otherWorkspace->id,
            'user_id' => $user->id,
            'role' => 'Owner',
            'joined_at' => now(),
        ]);

        $campaign = $this->campaignInWorkspace($workspace, 'Audit Campaign');

        AuditEvent::query()->create([
            'workspace_id' => $workspace->id,
            'actor_user_id' => $user->id,
            'event_key' => 'campaign.dispatch.requested',
            'context_json' => ['campaign_id' => $campaign->id, 'status_before' => 'draft'],
            'occurred_at' => now()->subMinutes(2),
        ]);

        AuditEvent::query()->create([
            'workspace_id' => $workspace->id,
            'actor_user_id' => null,
            'event_key' => 'campaign.dispatch.queued',
            'context_json' => ['campaign_id' => $campaign->id, 'status_after' => 'queued'],
            'occurred_at' => now()->subMinute(),
        ]);

        AuditEvent::query()->create([
            'workspace_id' => $otherWorkspace->id,
            'actor_user_id' => $user->id,
            'event_key' => 'campaign.dispatch.requested',
            'context_json' => ['campaign_id' => 'foreign'],
            'occurred_at' => now(),
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson('/api/audit/events?event_key=campaign.dispatch.requested&campaign_id='.$campaign->id.'&per_page=1');

        $response->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('per_page', 1)
            ->assertJsonPath('data.0.workspace_id', $workspace->id)
            ->assertJsonPath('data.0.event_key', 'campaign.dispatch.requested');
    }

    public function test_audit_events_query_returns_validation_error_for_invalid_from(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext('Owner');

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson('/api/audit/events?from=not-a-date');

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'validation.failed');
    }

    public function test_audit_events_query_returns_validation_error_for_invalid_to(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext('Owner');

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson('/api/audit/events?to=not-a-date');

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'validation.failed');
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

    private function campaignInWorkspace(Workspace $workspace, string $name): Campaign
    {
        [$template, $version] = $this->publishedTemplateInWorkspace($workspace);

        return Campaign::query()->create([
            'workspace_id' => $workspace->id,
            'template_id' => $template->id,
            'template_version_id' => $version->id,
            'name' => $name,
            'status' => 'queued',
            'recipient_count' => 2,
            'sent_count' => 1,
            'failed_count' => 1,
        ]);
    }

    /**
     * @return array{0: Template, 1: TemplateVersion}
     */
    private function publishedTemplateInWorkspace(Workspace $workspace): array
    {
        $template = Template::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Campaign Template',
        ]);

        $version = TemplateVersion::query()->create([
            'template_id' => $template->id,
            'version_number' => 1,
            'state' => 'published',
            'snapshot_json' => [
                'sections' => [[
                    'sectionName' => 'Main',
                    'components' => [[
                        'blockId' => 1,
                        'blockName' => 'Body',
                        'type' => 'text',
                        'content' => 'Hello {{contact.first_name}}',
                        'posX' => 0,
                        'posY' => 0,
                    ]],
                ]],
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
                'email_normalized' => strtolower($email),
                'first_name' => 'Contact',
                'last_name' => (string) $index,
            ]);
        }

        return $contacts;
    }
}
