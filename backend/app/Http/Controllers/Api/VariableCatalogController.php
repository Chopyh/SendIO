<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class VariableCatalogController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'categories' => [
                    [
                        'name' => 'Contact',
                        'variables' => [
                            ['name' => 'contact.first_name', 'description' => 'First name of the recipient'],
                            ['name' => 'contact.last_name', 'description' => 'Last name of the recipient'],
                            ['name' => 'contact.email', 'description' => 'Email address of the recipient'],
                            ['name' => 'contact.phone', 'description' => 'Phone number of the recipient'],
                        ],
                    ],
                    [
                        'name' => 'Workspace',
                        'variables' => [
                            ['name' => 'workspace.name', 'description' => 'Name of the active workspace'],
                        ],
                    ],
                    [
                        'name' => 'System',
                        'variables' => [
                            ['name' => 'unsubscribe_url', 'description' => 'Direct unsubscribe link'],
                            ['name' => 'system.unsubscribe_url', 'description' => 'System-provided unsubscribe link'],
                        ],
                    ],
                ],
            ],
        ]);
    }
}
