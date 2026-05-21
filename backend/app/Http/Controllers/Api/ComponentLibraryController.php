<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ComponentLibraryItem;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ComponentLibraryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $components = ComponentLibraryItem::query()
            ->where(function ($query) use ($workspaceId): void {
                $query->where('workspace_id', $workspaceId)
                    ->orWhere('scope', 'global');
            })
            ->get();

        return response()->json([
            'data' => $components,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:120'],
            'component_type' => ['required', 'string', 'max:50'],
            'schema_json' => ['required', 'array'],
            'scope' => ['nullable', 'string', 'in:workspace,global'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $payload = $validator->validated();
        $payload['workspace_id'] = $workspaceId;
        $payload['scope'] = $payload['scope'] ?? 'workspace';

        $component = ComponentLibraryItem::query()->create($payload);

        return response()->json([
            'data' => $component,
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $component = ComponentLibraryItem::query()->find($id);

        if (! $component) {
            return ApiError::response('component.not_found', 'Component not found.', 404);
        }

        // Verify isolation: component must be global or belong to current workspace
        if ($component->scope !== 'global' && $component->workspace_id !== $workspaceId) {
            return ApiError::response('component.forbidden', 'Access denied to this component.', 403);
        }

        return response()->json([
            'data' => $component,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $component = ComponentLibraryItem::query()->find($id);

        if (! $component) {
            return ApiError::response('component.not_found', 'Component not found.', 404);
        }

        // Verify ownership: only allow editing workspace-specific components
        if ($component->workspace_id !== $workspaceId) {
            return ApiError::response('component.forbidden', 'Access denied to edit this component.', 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'component_type' => ['sometimes', 'required', 'string', 'max:50'],
            'schema_json' => ['sometimes', 'required', 'array'],
            'scope' => ['nullable', 'string', 'in:workspace,global'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $component->update($validator->validated());

        return response()->json([
            'data' => $component,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $component = ComponentLibraryItem::query()->find($id);

        if (! $component) {
            return ApiError::response('component.not_found', 'Component not found.', 404);
        }

        // Verify ownership
        if ($component->workspace_id !== $workspaceId) {
            return ApiError::response('component.forbidden', 'Access denied to delete this component.', 403);
        }

        $component->delete();

        return response()->json(null, 204);
    }
}
