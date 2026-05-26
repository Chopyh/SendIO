<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditEventLogger;
use App\Services\ContactsImportService;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContactsImportController extends Controller
{
    public function __construct(
        private readonly ContactsImportService $contactsImportService,
        private readonly AuditEventLogger $auditEventLogger,
    ) {}

    public function import(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => ['required', 'file', 'mimetypes:text/plain,text/csv,text/x-csv,application/csv,application/vnd.ms-excel'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $workspaceId = $request->attributes->get('workspace_id');
        $summary = $this->contactsImportService->importFromCsv($request->file('file'), $workspaceId);

        $eventKey = 'contacts.import.completed';
        if (($summary['failed'] ?? 0) === 1 && ($summary['processed'] ?? 0) === 0 && ($summary['skipped'] ?? 0) === 0) {
            $firstFailureReason = (string) data_get($summary, 'details.failed.0.reason', '');
            if ($firstFailureReason === 'Invalid CSV schema. Expected headers: email,first_name,last_name,phone') {
                $eventKey = 'contacts.import.rejected_schema';
            }
        }

        $this->auditEventLogger->record(
            (string) $workspaceId,
            $request->user()?->id,
            $eventKey,
            [
                'processed_count' => (int) ($summary['processed'] ?? 0),
                'skipped_count' => (int) ($summary['skipped'] ?? 0),
                'failed_count' => (int) ($summary['failed'] ?? 0),
            ]
        );

        return response()->json([
            'data' => [
                'summary' => $summary,
            ],
        ]);
    }
}
