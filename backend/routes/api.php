<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactsImportController;
use App\Http\Controllers\Api\WorkspaceBootstrapController;
use App\Http\Controllers\Api\VariableCatalogController;
use App\Http\Controllers\Api\ComponentLibraryController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\CampaignController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('auth:api');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:api');
});

Route::middleware('auth:api')->group(function (): void {
    Route::post('/workspaces/bootstrap', [WorkspaceBootstrapController::class, 'bootstrap']);
});

Route::middleware(['auth:api', 'workspace.context'])->group(function (): void {
    Route::get('/workspaces/current', [WorkspaceBootstrapController::class, 'current']);
    Route::post('/contacts/import', [ContactsImportController::class, 'import']);

    // Variables
    Route::get('/variables/catalog', [VariableCatalogController::class, 'index']);

    // Components
    Route::apiResource('/components', ComponentLibraryController::class);

    // Templates
    Route::apiResource('/templates', TemplateController::class);
    Route::post('/templates/{template}/versions', [TemplateController::class, 'createVersion']);
    Route::put('/templates/{template}/versions/{versionNumber}', [TemplateController::class, 'updateVersion']);
    Route::post('/templates/{template}/versions/{versionNumber}/publish', [TemplateController::class, 'publishVersion']);

    // Campaigns
    Route::post('/campaigns', [CampaignController::class, 'store']);
    Route::post('/campaigns/{campaign}/dispatch', [CampaignController::class, 'dispatch']);
    Route::get('/campaigns/{campaign}/summary', [CampaignController::class, 'summary']);
});
