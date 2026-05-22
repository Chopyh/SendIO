<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspaceId = (string) $request->attributes->get('workspace_id');

        $contacts = Contact::query()
            ->where('workspace_id', $workspaceId)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->orderBy('email')
            ->get(['id', 'email', 'first_name', 'last_name', 'phone']);

        return response()->json([
            'data' => $contacts,
        ]);
    }
}
