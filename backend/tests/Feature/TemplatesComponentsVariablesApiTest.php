<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\ComponentLibraryItem;
use App\Models\Template;
use App\Models\TemplateVersion;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TemplatesComponentsVariablesApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => 'testing-jwt-secret-1234567890-abcdef',
        ]);
    }

    public function test_variable_catalog_endpoint_returns_grouped_catalog(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson('/api/variables/catalog');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'categories' => [
                        '*' => [
                            'name',
                            'variables' => [
                                '*' => ['name', 'description'],
                            ],
                        ],
                    ],
                ],
            ]);

        $response->assertJsonFragment(['name' => 'contact.first_name']);
        $response->assertJsonFragment(['name' => 'system.unsubscribe_url']);
    }

    public function test_component_library_crud_lifecycle_and_workspace_isolation(): void
    {
        [$token, $workspace, $user] = $this->authenticatedWorkspaceContext();

        // 1. Create a component
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/components', [
            'name' => 'My Custom Text Block',
            'component_type' => 'text',
            'schema_json' => ['default_text' => 'Hello World', 'font_size' => 14],
        ]);

        $response->assertStatus(201);
        $componentId = $response->json('data.id');
        $this->assertNotEmpty($componentId);

        // 2. Read component
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson("/api/components/{$componentId}");

        $response->assertOk()
            ->assertJsonPath('data.name', 'My Custom Text Block');

        // 3. Update component
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->putJson("/api/components/{$componentId}", [
            'name' => 'My Updated Text Block',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'My Updated Text Block');

        // 4. Workspace isolation: test access from another workspace
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

        // Attempting to retrieve from other workspace context must fail
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $otherWorkspace->id,
        ])->getJson("/api/components/{$componentId}");

        $response->assertStatus(403);

        // 5. Global scope test: Create global item
        $globalItem = ComponentLibraryItem::query()->create([
            'name' => 'Global Button',
            'component_type' => 'button',
            'scope' => 'global',
            'schema_json' => ['label' => 'Click Here'],
        ]);

        // Global items should be visible in any workspace
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson("/api/components/{$globalItem->id}");
        $response->assertOk();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $otherWorkspace->id,
        ])->getJson("/api/components/{$globalItem->id}");
        $response->assertOk();

        // But editing global items must be blocked
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->putJson("/api/components/{$globalItem->id}", [
            'name' => 'Hack Global Name',
        ]);
        $response->assertStatus(403);

        // 6. Delete item
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->deleteJson("/api/components/{$componentId}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('component_library_items', ['id' => $componentId]);
    }

    public function test_template_lifecycle_creation_and_versioning(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext();

        // 1. Create template (initial version v1 draft is created automatically)
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson('/api/templates', [
            'name' => 'Newsletter Template',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Newsletter Template');

        $templateId = $response->json('data.id');
        $this->assertNotEmpty($templateId);

        // Ensure v1 draft was created in database
        $this->assertDatabaseHas('template_versions', [
            'template_id' => $templateId,
            'version_number' => 1,
            'state' => 'draft',
        ]);

        // 2. Fetch list
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->getJson('/api/templates');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $templateId);

        // 3. Create a new version.
        // It should reject because v1 is still a draft.
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson("/api/templates/{$templateId}/versions");

        $response->assertStatus(409)
            ->assertJsonPath('error.code', 'template.draft_exists');
    }

    public function test_template_version_update_validation_and_immutability(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext();

        $template = Template::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Test Template',
        ]);

        $version = TemplateVersion::query()->create([
            'template_id' => $template->id,
            'version_number' => 1,
            'state' => 'draft',
            'snapshot_json' => ['sections' => []],
        ]);

        // 1. Test validation failure - missing sections
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->putJson("/api/templates/{$template->id}/versions/1", [
            'snapshot_json' => ['invalid' => 'format'],
        ]);
        $response->assertStatus(422)
            ->assertJsonFragment(['code' => 'validation.failed']);

        // 2. Test validation failure - invalid component type
        $invalidSnapshot = [
            'sections' => [
                [
                    'sectionName' => 'Header Section',
                    'components' => [
                        [
                            'blockId' => 101,
                            'blockName' => 'My Block',
                            'type' => 'invalid-type', // Allowed: text, image, button, separator
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->putJson("/api/templates/{$template->id}/versions/1", [
            'snapshot_json' => $invalidSnapshot,
        ]);
        $response->assertStatus(422);

        // 3. Test validation success with valid snapshot
        $validSnapshot = [
            'sections' => [
                [
                    'sectionName' => 'Header Section',
                    'components' => [
                        [
                            'blockId' => 101,
                            'blockName' => 'My Block',
                            'type' => 'text',
                            'content' => 'Hello {{contact.first_name}}',
                        ],
                        [
                            'blockId' => 102,
                            'blockName' => 'Action Button',
                            'type' => 'button',
                            'url' => '{{unsubscribe_url}}',
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->putJson("/api/templates/{$template->id}/versions/1", [
            'snapshot_json' => $validSnapshot,
        ]);
        $response->assertOk();

        // 4. Test immutability after publishing
        $version->update(['state' => 'published']);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->putJson("/api/templates/{$template->id}/versions/1", [
            'snapshot_json' => $validSnapshot,
        ]);
        $response->assertStatus(409)
            ->assertJsonPath('error.code', 'template.version_immutable');
    }

    public function test_template_publish_extracts_variables_and_requires_unsubscribe_url(): void
    {
        [$token, $workspace] = $this->authenticatedWorkspaceContext();

        $template = Template::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Variables Template',
        ]);

        // Snapshot 1: Missing unsubscribe url
        $snapshotNoUnsubscribe = [
            'sections' => [
                [
                    'sectionName' => 'Main',
                    'components' => [
                        [
                            'blockId' => 1,
                            'blockName' => 'Welcome',
                            'type' => 'text',
                            'content' => 'Hi {{contact.first_name}}!',
                        ],
                    ],
                ],
            ],
        ];

        $version = TemplateVersion::query()->create([
            'template_id' => $template->id,
            'version_number' => 1,
            'state' => 'draft',
            'snapshot_json' => $snapshotNoUnsubscribe,
        ]);

        // Attempting to publish without unsubscribe URL fails
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson("/api/templates/{$template->id}/versions/1/publish");

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'template.missing_unsubscribe');

        // Snapshot 2: Invalid variable category
        $snapshotInvalidVar = [
            'sections' => [
                [
                    'sectionName' => 'Main',
                    'components' => [
                        [
                            'blockId' => 1,
                            'blockName' => 'Welcome',
                            'type' => 'text',
                            'content' => 'Hi {{invalid_placeholder_name}}! Unsubscribe: {{system.unsubscribe_url}}',
                        ],
                    ],
                ],
            ],
        ];

        $version->update(['snapshot_json' => $snapshotInvalidVar]);

        // Attempting to publish with invalid variable category fails
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson("/api/templates/{$template->id}/versions/1/publish");

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'template.invalid_placeholders');

        // Snapshot 3: Valid and compliant snapshot
        $snapshotValid = [
            'sections' => [
                [
                    'sectionName' => 'Main',
                    'components' => [
                        [
                            'blockId' => 1,
                            'blockName' => 'Welcome',
                            'type' => 'text',
                            'content' => 'Hi {{contact.first_name}} {{contact.last_name}}! Welcome to {{workspace.name}}.',
                        ],
                        [
                            'blockId' => 2,
                            'blockName' => 'Opt Out',
                            'type' => 'button',
                            'url' => '{{unsubscribe_url}}',
                        ],
                    ],
                ],
            ],
        ];

        $version->update(['snapshot_json' => $snapshotValid]);

        // Publish should succeed
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson("/api/templates/{$template->id}/versions/1/publish");

        $response->assertOk()
            ->assertJsonPath('data.state', 'published')
            ->assertJsonPath('data.compliance_unsubscribe_url', true);

        // Verify variables were registered in database
        $this->assertDatabaseHas('template_variable_usages', [
            'template_version_id' => $version->id,
            'placeholder_name' => 'contact.first_name',
            'category' => 'Contact',
        ]);
        $this->assertDatabaseHas('template_variable_usages', [
            'template_version_id' => $version->id,
            'placeholder_name' => 'workspace.name',
            'category' => 'Workspace',
        ]);
        $this->assertDatabaseHas('template_variable_usages', [
            'template_version_id' => $version->id,
            'placeholder_name' => 'unsubscribe_url',
            'category' => 'System',
        ]);

        // Verify that creating a new version now succeeds (since the latest version v1 is published)
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Workspace-Id' => (string) $workspace->id,
        ])->postJson("/api/templates/{$template->id}/versions");

        $response->assertStatus(201)
            ->assertJsonPath('data.version_number', 2)
            ->assertJsonPath('data.state', 'draft');
    }

    /**
     * Helper to authenticate and get valid workspace context.
     *
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
