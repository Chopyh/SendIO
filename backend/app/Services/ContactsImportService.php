<?php

namespace App\Services;

use App\Models\Contact;
use Illuminate\Http\UploadedFile;

class ContactsImportService
{
    /**
     * @return array{
     *   processed:int,
     *   skipped:int,
     *   failed:int,
     *   details:array{skipped:array<int, array<string, mixed>>, failed:array<int, array<string, mixed>>}
     * }
     */
    public function importFromCsv(UploadedFile $file, int $workspaceId): array
    {
        $rows = array_map('str_getcsv', file($file->getRealPath()));

        $headers = array_map(static fn ($value): string => strtolower(trim((string) $value)), $rows[0] ?? []);
        $expectedHeaders = ['email', 'first_name', 'last_name', 'phone'];

        if ($headers !== $expectedHeaders) {
            return [
                'processed' => 0,
                'skipped' => 0,
                'failed' => 1,
                'details' => [
                    'skipped' => [],
                    'failed' => [[
                        'row' => 1,
                        'reason' => 'Invalid CSV schema. Expected headers: email,first_name,last_name,phone',
                    ]],
                ],
            ];
        }

        $summary = [
            'processed' => 0,
            'skipped' => 0,
            'failed' => 0,
            'details' => [
                'skipped' => [],
                'failed' => [],
            ],
        ];

        foreach ($rows as $index => $row) {
            if ($index === 0) {
                continue;
            }

            if ($this->rowIsEmpty($row)) {
                continue;
            }

            $lineNumber = $index + 1;
            $payload = [
                'email' => trim((string) ($row[0] ?? '')),
                'first_name' => trim((string) ($row[1] ?? '')),
                'last_name' => trim((string) ($row[2] ?? '')),
                'phone' => trim((string) ($row[3] ?? '')),
            ];

            if (! filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
                $summary['failed']++;
                $summary['details']['failed'][] = [
                    'row' => $lineNumber,
                    'email' => $payload['email'],
                    'reason' => 'Invalid email format.',
                ];

                continue;
            }

            $normalizedEmail = mb_strtolower($payload['email']);

            $exists = Contact::query()
                ->where('workspace_id', $workspaceId)
                ->where('email_normalized', $normalizedEmail)
                ->exists();

            if ($exists) {
                $summary['skipped']++;
                $summary['details']['skipped'][] = [
                    'row' => $lineNumber,
                    'email' => $payload['email'],
                    'reason' => 'Duplicate email in workspace.',
                ];

                continue;
            }

            Contact::query()->create([
                'workspace_id' => $workspaceId,
                'email' => $payload['email'],
                'email_normalized' => $normalizedEmail,
                'first_name' => $payload['first_name'] !== '' ? $payload['first_name'] : null,
                'last_name' => $payload['last_name'] !== '' ? $payload['last_name'] : null,
                'phone' => $payload['phone'] !== '' ? $payload['phone'] : null,
            ]);

            $summary['processed']++;
        }

        return $summary;
    }

    /**
     * @param array<int, mixed> $row
     */
    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $column) {
            if (trim((string) $column) !== '') {
                return false;
            }
        }

        return true;
    }
}
