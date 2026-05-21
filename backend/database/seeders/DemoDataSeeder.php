<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Contact;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Database\Seeder;

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

        $this->contacts($mainWorkspace, [
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
     */
    private function contacts(Workspace $workspace, array $contacts): void
    {
        foreach ($contacts as [$email, $firstName, $lastName, $phone, $metadata]) {
            Contact::query()->updateOrCreate([
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
    }
}
