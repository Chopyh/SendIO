<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\ComponentLibraryItem;
use App\Models\Contact;
use App\Models\DeliveryAttempt;
use App\Models\Template;
use App\Models\TemplateVariableUsage;
use App\Models\TemplateVersion;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $mainAccount = Account::query()->firstOrCreate([
            'name' => 'SendIO Demo Account',
        ]);

        $mainWorkspace = Workspace::query()->updateOrCreate([
            'account_id' => $mainAccount->id,
            'name' => 'SendIO Demo Workspace',
        ], [
            'timezone' => 'UTC',
            'locale_default' => 'en',
        ]);

        $owner = $this->user('Demo Owner', 'owner@sendio.test');
        $editor = $this->user('Demo Editor', 'editor@sendio.test');
        $viewer = $this->user('Demo Viewer', 'viewer@sendio.test');

        $this->member($mainWorkspace, $owner, 'Owner');
        $this->member($mainWorkspace, $editor, 'Editor');
        $this->member($mainWorkspace, $viewer, 'Viewer');

        $this->user('Empty Workspace User', 'empty@sendio.test');

        $isolationAccount = Account::query()->firstOrCreate([
            'name' => 'SendIO Isolation Account',
        ]);

        $isolationWorkspace = Workspace::query()->updateOrCreate([
            'account_id' => $isolationAccount->id,
            'name' => 'SendIO Isolation Workspace',
        ], [
            'timezone' => 'Europe/Madrid',
            'locale_default' => 'es',
        ]);

        $isolationOwner = $this->user('Isolation Owner', 'isolation-owner@sendio.test');
        $this->member($isolationWorkspace, $isolationOwner, 'Owner');

        $mainContacts = $this->contacts($mainWorkspace, [
            ['ana.ruiz@example.test', 'Ana', 'Ruiz', '+34 600 100 001', ['source' => 'csv-import', 'segment' => 'Newsletter', 'language' => 'es']],
            ['leo.gomez@example.test', 'Leo', 'Gomez', '+34 600 100 002', ['source' => 'csv-import', 'segment' => 'Leads', 'language' => 'es']],
            ['maria.lopez@example.test', 'Maria', 'Lopez', '+34 600 100 003', ['source' => 'manual', 'segment' => 'Customers', 'language' => 'es']],
            ['john.smith@example.test', 'John', 'Smith', '+1 415 555 0104', ['source' => 'api', 'segment' => 'Trial', 'language' => 'en']],
            ['sarah.connor@example.test', 'Sarah', 'Connor', '+1 415 555 0105', ['source' => 'csv-import', 'segment' => 'Customers', 'language' => 'en']],
            ['diego.martin@example.test', 'Diego', 'Martin', '+34 600 100 006', ['source' => 'manual', 'segment' => 'Newsletter', 'language' => 'es']],
            ['lucia.fernandez@example.test', 'Lucia', 'Fernandez', '+34 600 100 007', ['source' => 'api', 'segment' => 'Leads', 'language' => 'es']],
            ['noah.williams@example.test', 'Noah', 'Williams', '+1 212 555 0108', ['source' => 'csv-import', 'segment' => 'Trial', 'language' => 'en']],
            ['emma.brown@example.test', 'Emma', 'Brown', '+44 20 7946 0109', ['source' => 'manual', 'segment' => 'Customers', 'language' => 'en']],
            ['carlos.navarro@example.test', 'Carlos', 'Navarro', '+34 600 100 010', ['source' => 'csv-import', 'segment' => 'Newsletter', 'language' => 'es']],
            ['sofia.ortega@example.test', 'Sofia', 'Ortega', '+34 600 100 011', ['source' => 'api', 'segment' => 'Trial', 'language' => 'es']],
            ['olivia.johnson@example.test', 'Olivia', 'Johnson', '+1 646 555 0112', ['source' => 'manual', 'segment' => 'Leads', 'language' => 'en']],
            ['pablo.santos@example.test', 'Pablo', 'Santos', '+34 600 100 013', ['source' => 'csv-import', 'segment' => 'Customers', 'language' => 'es']],
            ['mia.davis@example.test', 'Mia', 'Davis', '+1 312 555 0114', ['source' => 'api', 'segment' => 'Newsletter', 'language' => 'en']],
            ['valentina.castro@example.test', 'Valentina', 'Castro', '+34 600 100 015', ['source' => 'manual', 'segment' => 'Leads', 'language' => 'es']],
            ['liam.miller@example.test', 'Liam', 'Miller', '+1 617 555 0116', ['source' => 'csv-import', 'segment' => 'Trial', 'language' => 'en']],
        ]);

        $this->contacts($isolationWorkspace, [
            ['shared@example.test', 'Shared', 'Isolation', '+34 699 200 001', ['source' => 'isolation', 'segment' => 'Duplicate Email Test', 'language' => 'en']],
            ['ana.ruiz@example.test', 'Ana', 'Other Workspace', '+34 699 200 002', ['source' => 'isolation', 'segment' => 'Workspace Scope Test', 'language' => 'es']],
        ]);

        $this->componentLibrary($mainWorkspace);

        [$welcomeTemplate, $welcomeVersion] = $this->template(
            $mainWorkspace,
            'Welcome Journey Template',
            1,
            $this->welcomeSnapshot(),
            [
                ['contact.first_name', 'Contact', true],
                ['contact.last_name', 'Contact', false],
                ['system.unsubscribe_url', 'System', true],
            ]
        );

        [$newsletterTemplate, $newsletterVersion] = $this->template(
            $mainWorkspace,
            'Monthly Newsletter Template',
            1,
            $this->newsletterSnapshot(),
            [
                ['contact.first_name', 'Contact', true],
                ['unsubscribe_url', 'System', true],
            ]
        );

        [$promoTemplate, $promoVersion] = $this->template(
            $mainWorkspace,
            'Product Launch Promo Template',
            1,
            $this->promoSnapshot(),
            [
                ['contact.first_name', 'Contact', true],
                ['unsubscribe_url', 'System', true],
            ]
        );

        [$premiumTemplate, $premiumVersion] = $this->template(
            $mainWorkspace,
            'Premium Feature Announcement',
            1,
            $this->premiumSnapshot(),
            [
                ['contact.first_name', 'Contact', true],
                ['unsubscribe_url', 'System', true],
            ]
        );

        $this->campaigns($mainWorkspace, [
            'welcome' => [$welcomeTemplate, $welcomeVersion],
            'newsletter' => [$newsletterTemplate, $newsletterVersion],
            'promo' => [$promoTemplate, $promoVersion],
            'premium' => [$premiumTemplate, $premiumVersion],
        ], array_values($mainContacts));
    }

    private function user(string $name, string $email): User
    {
        return User::query()->updateOrCreate([
            'email' => $email,
        ], [
            'name' => $name,
            'password' => 'password',
        ]);
    }

    private function member(Workspace $workspace, User $user, string $role): WorkspaceMember
    {
        return WorkspaceMember::query()->updateOrCreate([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
        ], [
            'role' => $role,
            'joined_at' => now(),
        ]);
    }

    /**
     * @param  array<int, array{0: string, 1: string, 2: string, 3: string, 4: array<string, string>}>  $contacts
     * @return array<string, Contact>
     */
    private function contacts(Workspace $workspace, array $contacts): array
    {
        $seeded = [];

        foreach ($contacts as [$email, $firstName, $lastName, $phone, $metadata]) {
            $seeded[$email] = Contact::query()->updateOrCreate([
                'workspace_id' => $workspace->id,
                'email_normalized' => strtolower($email),
            ], [
                'email' => $email,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'phone' => $phone,
                'metadata' => $metadata,
            ]);
        }

        return $seeded;
    }

    private function componentLibrary(Workspace $workspace): void
    {
        $this->component($workspace, 'Hero Headline', 'text', [
            'content' => '<h1>Hello {{contact.first_name}}, welcome to SendIO</h1>',
            'styles' => ['fontSize' => '32px', 'fontWeight' => '700', 'textColor' => '#0f172a'],
        ]);

        $this->component($workspace, 'Primary CTA Button', 'button', [
            'url' => 'https://sendio.local/demo',
            'styles' => ['backgroundColor' => '#2563eb', 'textColor' => '#ffffff', 'borderRadius' => '8px'],
        ]);

        $this->component($workspace, 'Compliance Footer', 'text', [
            'content' => '<p>You can unsubscribe at any time: {{unsubscribe_url}}</p>',
            'styles' => ['fontSize' => '12px', 'textColor' => '#64748b'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $schema
     */
    private function component(Workspace $workspace, string $name, string $type, array $schema): ComponentLibraryItem
    {
        return ComponentLibraryItem::query()->updateOrCreate([
            'workspace_id' => $workspace->id,
            'name' => $name,
        ], [
            'scope' => 'workspace',
            'component_type' => $type,
            'schema_json' => $schema,
        ]);
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @param  array<int, array{0: string, 1: string, 2: bool}>  $variables
     * @return array{0: Template, 1: TemplateVersion}
     */
    private function template(Workspace $workspace, string $name, int $versionNumber, array $snapshot, array $variables): array
    {
        $template = Template::query()->updateOrCreate([
            'workspace_id' => $workspace->id,
            'name' => $name,
        ], [
            'name' => $name,
        ]);

        $version = TemplateVersion::query()->updateOrCreate([
            'template_id' => $template->id,
            'version_number' => $versionNumber,
        ], [
            'state' => 'published',
            'snapshot_json' => $snapshot,
            'compliance_unsubscribe_url' => true,
        ]);

        foreach ($variables as [$placeholder, $category, $required]) {
            TemplateVariableUsage::query()->updateOrCreate([
                'template_version_id' => $version->id,
                'placeholder_name' => $placeholder,
            ], [
                'category' => $category,
                'required' => $required,
            ]);
        }

        return [$template, $version];
    }

    /**
     * @param  array{welcome: array{0: Template, 1: TemplateVersion}, newsletter: array{0: Template, 1: TemplateVersion}, promo: array{0: Template, 1: TemplateVersion}, premium: array{0: Template, 1: TemplateVersion}}  $templates
     * @param  array<int, Contact>  $contacts
     */
    private function campaigns(Workspace $workspace, array $templates, array $contacts): void
    {
        [$welcomeTemplate, $welcomeVersion] = $templates['welcome'];
        [$newsletterTemplate, $newsletterVersion] = $templates['newsletter'];
        [$promoTemplate, $promoVersion] = $templates['promo'];
        [$premiumTemplate, $premiumVersion] = $templates['premium'];

        $this->campaign($workspace, $newsletterTemplate, $newsletterVersion, 'June Newsletter Draft', 'draft', [
            [$contacts[0], 'pending', 0, null],
            [$contacts[1], 'pending', 0, null],
            [$contacts[2], 'pending', 0, null],
        ], null, null);

        $this->campaign($workspace, $welcomeTemplate, $welcomeVersion, 'Trial Welcome Queue', 'queued', [
            [$contacts[3], 'pending', 0, null],
            [$contacts[7], 'pending', 0, null],
            [$contacts[10], 'pending', 0, null],
            [$contacts[15], 'pending', 0, null],
        ], now()->subHours(2), null);

        $this->campaign($workspace, $promoTemplate, $promoVersion, 'Customer Winback Running', 'running', [
            [$contacts[4], 'sent', 1, null],
            [$contacts[8], 'sent', 1, null],
            [$contacts[12], 'failed', 3, 'Mailtrap demo throttle simulation'],
            [$contacts[14], 'sending', 1, null],
            [$contacts[2], 'pending', 0, null],
        ], now()->subDay(), null);

        $this->campaign($workspace, $newsletterTemplate, $newsletterVersion, 'May Newsletter Completed', 'completed', [
            [$contacts[0], 'sent', 1, null],
            [$contacts[5], 'sent', 1, null],
            [$contacts[9], 'sent', 1, null],
            [$contacts[13], 'sent', 1, null],
        ], now()->subDays(7), now()->subDays(7)->addMinutes(15));

        $this->campaign($workspace, $promoTemplate, $promoVersion, 'Spring Promo Failed', 'failed', [
            [$contacts[1], 'failed', 3, 'SMTP sandbox rejected the demo message'],
            [$contacts[6], 'failed', 3, 'SMTP sandbox rejected the demo message'],
            [$contacts[11], 'failed', 3, 'SMTP sandbox rejected the demo message'],
        ], now()->subDays(14), now()->subDays(14)->addMinutes(30));

        $this->campaign($workspace, $premiumTemplate, $premiumVersion, 'Premium Features Launch', 'completed', [
            [$contacts[0], 'sent', 1, null],
            [$contacts[3], 'sent', 1, null],
            [$contacts[6], 'sent', 1, null],
            [$contacts[9], 'sent', 1, null],
        ], now()->subDays(3), now()->subDays(3)->addMinutes(12));
    }

    /**
     * @param  array<int, array{0: Contact, 1: string, 2: int, 3: string|null}>  $recipientStates
     */
    private function campaign(
        Workspace $workspace,
        Template $template,
        TemplateVersion $version,
        string $name,
        string $status,
        array $recipientStates,
        ?Carbon $dispatchedAt,
        ?Carbon $completedAt,
    ): Campaign {
        $sentCount = count(array_filter($recipientStates, static fn (array $state): bool => $state[1] === 'sent'));
        $failedCount = count(array_filter($recipientStates, static fn (array $state): bool => $state[1] === 'failed'));

        $campaign = Campaign::query()->updateOrCreate([
            'workspace_id' => $workspace->id,
            'name' => $name,
        ], [
            'template_id' => $template->id,
            'template_version_id' => $version->id,
            'status' => $status,
            'recipient_count' => count($recipientStates),
            'sent_count' => $sentCount,
            'failed_count' => $failedCount,
            'dispatched_at' => $dispatchedAt,
            'completed_at' => $completedAt,
        ]);

        foreach ($recipientStates as [$contact, $recipientStatus, $attemptCount, $lastError]) {
            $lastAttemptAt = $attemptCount > 0 ? now()->subMinutes(30 + $attemptCount) : null;

            $recipient = CampaignRecipient::query()->updateOrCreate([
                'campaign_id' => $campaign->id,
                'contact_id' => $contact->id,
            ], [
                'workspace_id' => $workspace->id,
                'email' => $contact->email,
                'status' => $recipientStatus,
                'attempt_count' => $attemptCount,
                'last_error' => $lastError,
                'last_attempt_at' => $lastAttemptAt,
                'next_retry_at' => $recipientStatus === 'pending' && $attemptCount > 0 ? now()->addMinutes(10) : null,
                'sent_at' => $recipientStatus === 'sent' ? now()->subMinutes(20 + $attemptCount) : null,
            ]);

            $this->deliveryAttempts($campaign, $recipient, $recipientStatus, $attemptCount, $lastError);
        }

        return $campaign;
    }

    private function deliveryAttempts(
        Campaign $campaign,
        CampaignRecipient $recipient,
        string $recipientStatus,
        int $attemptCount,
        ?string $lastError,
    ): void {
        if ($attemptCount === 0) {
            return;
        }

        for ($attempt = 1; $attempt <= $attemptCount; $attempt++) {
            $isFinalAttempt = $attempt === $attemptCount;
            $status = $isFinalAttempt && $recipientStatus === 'sent' ? 'sent' : 'failed';

            DeliveryAttempt::query()->updateOrCreate([
                'campaign_recipient_id' => $recipient->id,
                'attempt_number' => $attempt,
            ], [
                'campaign_id' => $campaign->id,
                'status' => $status,
                'error_message' => $status === 'failed' ? ($lastError ?? 'Transient demo delivery failure') : null,
                'attempted_at' => now()->subMinutes(60 - ($attempt * 5)),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function welcomeSnapshot(): array
    {
        return [
            'sections' => [
                [
                    'sectionId' => 'welcome-hero',
                    'sectionName' => 'Welcome Hero',
                    'rowMinHeights' => [180, 72],
                    'components' => [
                        $this->textBlock(101, 'Welcome headline', '<h1>Welcome to SendIO, {{contact.first_name}}</h1><p>Your workspace is ready to build campaigns with your team.</p>', 0, 0, 2),
                        $this->buttonBlock(102, 'Open dashboard button', 'https://sendio.local/app?contact={{contact.first_name}}', 0, 1, 1),
                    ],
                ],
                [
                    'sectionId' => 'welcome-footer',
                    'sectionName' => 'Compliance Footer',
                    'rowMinHeights' => [48],
                    'components' => [
                        $this->textBlock(103, 'Unsubscribe footer', '<p style="font-size:12px;color:#64748b;">No longer interested? <a href="{{system.unsubscribe_url}}">Unsubscribe here</a>.</p>', 0, 0, 1),
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function newsletterSnapshot(): array
    {
        return [
            'sections' => [
                [
                    'sectionId' => 'newsletter-intro',
                    'sectionName' => 'Newsletter Intro',
                    'rowMinHeights' => [160, 96],
                    'components' => [
                        $this->textBlock(201, 'Newsletter lead', '<h1>Monthly product notes</h1><p>Hi {{contact.first_name}}, here are the latest SendIO improvements for your campaigns.</p>', 0, 0, 2),
                        $this->textBlock(202, 'Feature summary', '<ul><li>Reusable blocks</li><li>Workspace roles</li><li>Campaign reporting</li></ul>', 0, 1, 2),
                    ],
                ],
                [
                    'sectionId' => 'newsletter-footer',
                    'sectionName' => 'Newsletter Footer',
                    'rowMinHeights' => [48],
                    'components' => [
                        $this->textBlock(203, 'Unsubscribe footer', '<p style="font-size:12px;color:#64748b;">Manage your preferences or unsubscribe: {{unsubscribe_url}}</p>', 0, 0, 1),
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function promoSnapshot(): array
    {
        return [
            'sections' => [
                [
                    'sectionId' => 'promo-offer',
                    'sectionName' => 'Launch Offer',
                    'rowMinHeights' => [160, 72],
                    'components' => [
                        $this->textBlock(301, 'Promo headline', '<h1>Launch faster with SendIO</h1><p>{{contact.first_name}}, build your next email in minutes with reusable components.</p>', 0, 0, 2),
                        $this->buttonBlock(302, 'Promo CTA', 'https://sendio.local/demo/promo', 0, 1, 1),
                    ],
                ],
                [
                    'sectionId' => 'promo-footer',
                    'sectionName' => 'Promo Footer',
                    'rowMinHeights' => [48],
                    'components' => [
                        $this->textBlock(303, 'Unsubscribe footer', '<p style="font-size:12px;color:#64748b;">You are receiving this as a SendIO demo contact. Unsubscribe: {{unsubscribe_url}}</p>', 0, 0, 1),
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function textBlock(int $id, string $name, string $content, int $posX, int $posY, float $sizeX): array
    {
        return [
            'blockId' => $id,
            'blockName' => $name,
            'type' => 'text',
            'content' => $content,
            'posX' => $posX,
            'posY' => $posY,
            'sizeX' => $sizeX,
            'styles' => ['textColor' => '#0f172a', 'backgroundColor' => '#ffffff'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buttonBlock(int $id, string $name, string $url, int $posX, int $posY, float $sizeX): array
    {
        return [
            'blockId' => $id,
            'blockName' => $name,
            'type' => 'button',
            'url' => $url,
            'posX' => $posX,
            'posY' => $posY,
            'sizeX' => $sizeX,
            'styles' => ['backgroundColor' => '#2563eb', 'textColor' => '#ffffff', 'borderRadius' => '8px'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function premiumSnapshot(): array
    {
        return [
            'sections' => [
                [
                    'sectionId' => 'premium-hero',
                    'sectionName' => 'Premium Hero',
                    'rowMinHeights' => [240, 80],
                    'components' => [
                        $this->textBlock(401, 'Hero banner', '
                            <div style="background-color: #1e293b; padding: 40px 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                                <h1 style="color: #38bdf8; font-family: \'Outfit\', sans-serif; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.2; letter-spacing: -0.025em;">
                                    ¡Hola {{contact.first_name}}! 🎉
                                </h1>
                                <p style="color: #f1f5f9; font-family: \'Inter\', sans-serif; font-size: 18px; font-weight: 500; margin: 0 0 12px 0; line-height: 1.5;">
                                    Lanzamos nuevas características premium en tu workspace.
                                </p>
                                <p style="color: #94a3b8; font-family: \'Inter\', sans-serif; font-size: 14px; margin: 0; line-height: 1.6;">
                                    Disfruta de más velocidad, plantillas exclusivas y automatizaciones avanzadas.
                                </p>
                            </div>', 0, 0, 2),
                        $this->buttonBlock(402, 'Main CTA button', 'https://sendio.local/app/features?ref=email_hero', 0, 1, 2),
                    ],
                ],
                [
                    'sectionId' => 'premium-features',
                    'sectionName' => 'Featured Layouts',
                    'rowMinHeights' => [180, 180, 80],
                    'components' => [
                        $this->textBlock(403, 'Feature one', '
                            <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                                <h3 style="color: #0f172a; font-family: \'Outfit\', sans-serif; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                                    🚀 1. Plantillas Avanzadas
                                </h3>
                                <p style="color: #475569; font-family: \'Inter\', sans-serif; font-size: 14px; margin: 0; line-height: 1.5;">
                                    Layouts optimizados para móviles, con soporte total para i18n y espaciados personalizables en un clic.
                                </p>
                            </div>', 0, 0, 1),
                        $this->textBlock(404, 'Feature two', '
                            <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                                <h3 style="color: #0f172a; font-family: \'Outfit\', sans-serif; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                                    📊 2. Reportes de Campaña
                                </h3>
                                <p style="color: #475569; font-family: \'Inter\', sans-serif; font-size: 14px; margin: 0; line-height: 1.5;">
                                    Auditoría completa e histórico de envíos con estados detallados (entregado, fallido, reenviando).
                                </p>
                            </div>', 1, 0, 1),
                        $this->textBlock(405, 'Feature three', '
                            <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px; text-align: center;">
                                <h3 style="color: #0f172a; font-family: \'Outfit\', sans-serif; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                                    🔒 3. Aislamiento Completo
                                </h3>
                                <p style="color: #475569; font-family: \'Inter\', sans-serif; font-size: 14px; margin: 0; line-height: 1.5; max-width: 500px; margin-left: auto; margin-right: auto;">
                                    Seguridad robusta a nivel de Workspace. Tus datos y contactos están completamente aislados de otros entornos.
                                </p>
                            </div>', 0, 1, 2),
                        $this->buttonBlock(406, 'Sub CTA button', 'https://sendio.local/app/features?ref=email_features', 0, 2, 2),
                    ],
                ],
                [
                    'sectionId' => 'premium-footer',
                    'sectionName' => 'Compliance Footer',
                    'rowMinHeights' => [100],
                    'components' => [
                        $this->textBlock(407, 'Footer details', '
                            <div style="padding: 24px 20px; text-align: center; border-top: 1px solid #e2e8f0; margin-top: 20px;">
                                <p style="color: #64748b; font-family: \'Inter\', sans-serif; font-size: 12px; margin: 0 0 8px 0; line-height: 1.5;">
                                    Este correo de prueba fue enviado para validar las capacidades del motor de SendIO.
                                </p>
                                <p style="color: #64748b; font-family: \'Inter\', sans-serif; font-size: 12px; margin: 0; line-height: 1.5;">
                                    ¿No deseas recibir estos correos? <a href="{{unsubscribe_url}}" style="color: #2563eb; text-decoration: underline; font-weight: 500;">Darse de baja</a>.
                                </p>
                            </div>', 0, 0, 2),
                    ],
                ],
            ],
        ];
    }
}
