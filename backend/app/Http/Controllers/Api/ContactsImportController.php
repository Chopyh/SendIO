<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ContactsImportService;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContactsImportController extends Controller
{
    public function __construct(private readonly ContactsImportService $contactsImportService) {}

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

        return response()->json([
            'data' => [
                'summary' => $summary,
            ],
        ]);
    }
}
