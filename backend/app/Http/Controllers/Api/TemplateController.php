<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplateVersion;
use App\Models\TemplateVariableUsage;
use App\Support\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $templates = Template::query()
            ->where('workspace_id', $workspaceId)
            ->with(['versions' => function ($query): void {
                $query->orderBy('version_number', 'desc');
            }])
            ->get();

        return response()->json([
            'data' => $templates,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:120'],
            'content' => ['nullable', 'array'],
            'snapshot_json' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $snapshot = $this->resolveTemplateContentFromRequest($request) ?? ['sections' => []];
        $snapshot = $this->normalizeTemplateContent($snapshot);

        if ($err = $this->validateSnapshotStructure($snapshot)) {
            return ApiError::response('validation.failed', $err, 422);
        }

        $template = DB::transaction(function () use ($workspaceId, $request, $snapshot) {
            $template = Template::query()->create([
                'workspace_id' => $workspaceId,
                'name' => $request->get('name'),
            ]);

            TemplateVersion::query()->create([
                'template_id' => $template->id,
                'version_number' => 1,
                'state' => 'draft',
                'snapshot_json' => $snapshot,
                'compliance_unsubscribe_url' => false,
            ]);

            return $template;
        });

        $template->load(['versions' => function ($query): void {
            $query->orderBy('version_number', 'desc');
        }]);

        return response()->json([
            'data' => $template,
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $template = Template::query()
            ->where('workspace_id', $workspaceId)
            ->with(['versions' => function ($query): void {
                $query->orderBy('version_number', 'desc');
            }])
            ->find($id);

        if (! $template) {
            return ApiError::response('template.not_found', 'Template not found.', 404);
        }

        return response()->json([
            'data' => $template,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $template = Template::query()
            ->where('workspace_id', $workspaceId)
            ->find($id);

        if (! $template) {
            return ApiError::response('template.not_found', 'Template not found.', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:120'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        $template->update($validator->validated());

        return response()->json([
            'data' => $template,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $template = Template::query()
            ->where('workspace_id', $workspaceId)
            ->find($id);

        if (! $template) {
            return ApiError::response('template.not_found', 'Template not found.', 404);
        }

        $template->delete();

        return response()->json(null, 204);
    }

    public function createVersion(Request $request, string $templateId): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $template = Template::query()
            ->where('workspace_id', $workspaceId)
            ->find($templateId);

        if (! $template) {
            return ApiError::response('template.not_found', 'Template not found.', 404);
        }

        $latestVersion = TemplateVersion::query()
            ->where('template_id', $template->id)
            ->orderBy('version_number', 'desc')
            ->first();

        if ($latestVersion && $latestVersion->state === 'draft') {
            return ApiError::response(
                'template.draft_exists',
                "A draft version already exists (version {$latestVersion->version_number}).",
                409
            );
        }

        $newVersionNumber = $latestVersion ? $latestVersion->version_number + 1 : 1;
        $snapshot = $latestVersion ? $this->normalizeTemplateContent($latestVersion->snapshot_json ?? []) : ['sections' => []];

        $newVersion = TemplateVersion::query()->create([
            'template_id' => $template->id,
            'version_number' => $newVersionNumber,
            'state' => 'draft',
            'snapshot_json' => $snapshot,
            'compliance_unsubscribe_url' => false,
        ]);

        return response()->json([
            'data' => $newVersion,
        ], 201);
    }

    public function updateVersion(Request $request, string $templateId, int $versionNumber): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $template = Template::query()
            ->where('workspace_id', $workspaceId)
            ->find($templateId);

        if (! $template) {
            return ApiError::response('template.not_found', 'Template not found.', 404);
        }

        $version = TemplateVersion::query()
            ->where('template_id', $template->id)
            ->where('version_number', $versionNumber)
            ->first();

        if (! $version) {
            return ApiError::response('template.version_not_found', 'Template version not found.', 404);
        }

        if ($version->state === 'published') {
            return ApiError::response(
                'template.version_immutable',
                'Published versions are immutable. You must create a new draft version to edit.',
                409
            );
        }

        $validator = Validator::make($request->all(), [
            'content' => ['sometimes', 'array'],
            'snapshot_json' => ['sometimes', 'array'],
        ]);

        if ($validator->fails()) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, $validator->errors()->toArray());
        }

        if ($this->resolveTemplateContentFromRequest($request) === null) {
            return ApiError::response('validation.failed', 'Validation failed.', 422, [
                'content' => ['The content field is required.'],
            ]);
        }

        $snapshot = $this->resolveTemplateContentFromRequest($request);
        $snapshot = $this->normalizeTemplateContent($snapshot ?? []);

        if ($err = $this->validateSnapshotStructure($snapshot)) {
            return ApiError::response('validation.failed', $err, 422);
        }

        $version->update([
            'snapshot_json' => $snapshot,
        ]);

        return response()->json([
            'data' => $version,
        ]);
    }

    public function publishVersion(Request $request, string $templateId, int $versionNumber): JsonResponse
    {
        $workspaceId = $request->attributes->get('workspace_id');

        $template = Template::query()
            ->where('workspace_id', $workspaceId)
            ->find($templateId);

        if (! $template) {
            return ApiError::response('template.not_found', 'Template not found.', 404);
        }

        $version = TemplateVersion::query()
            ->where('template_id', $template->id)
            ->where('version_number', $versionNumber)
            ->first();

        if (! $version) {
            return ApiError::response('template.version_not_found', 'Template version not found.', 404);
        }

        if ($version->state === 'published') {
            return ApiError::response(
                'template.already_published',
                'This template version is already published.',
                409
            );
        }

        $extracted = $this->extractVariables($version->snapshot_json ?? []);

        $allowedVariables = [
            'contact.first_name',
            'contact.last_name',
            'contact.email',
            'contact.phone',
            'workspace.name',
            'unsubscribe_url',
            'system.unsubscribe_url',
        ];

        $invalidVariables = array_diff($extracted, $allowedVariables);

        if (! empty($invalidVariables)) {
            return ApiError::response(
                'template.invalid_placeholders',
                'Template contains invalid placeholders: ' . implode(', ', $invalidVariables),
                422,
                ['invalid_placeholders' => array_values($invalidVariables)]
            );
        }

        $hasUnsubscribe = in_array('unsubscribe_url', $extracted, true) || in_array('system.unsubscribe_url', $extracted, true);
        if (! $hasUnsubscribe) {
            return ApiError::response(
                'template.missing_unsubscribe',
                'Template must contain an unsubscribe URL placeholder ({{unsubscribe_url}} or {{system.unsubscribe_url}}).',
                422
            );
        }

        DB::transaction(function () use ($version, $extracted): void {
            // Delete previous variable usages for this version
            TemplateVariableUsage::query()->where('template_version_id', $version->id)->delete();

            // Insert new usages
            foreach ($extracted as $placeholder) {
                $category = 'System';
                if (str_starts_with($placeholder, 'contact.')) {
                    $category = 'Contact';
                } elseif (str_starts_with($placeholder, 'workspace.')) {
                    $category = 'Workspace';
                }

                TemplateVariableUsage::query()->create([
                    'template_version_id' => $version->id,
                    'placeholder_name' => $placeholder,
                    'category' => $category,
                    'required' => true,
                ]);
            }

            $version->update([
                'state' => 'published',
                'compliance_unsubscribe_url' => true,
            ]);
        });

        $version->load('variableUsages');

        return response()->json([
            'data' => $version,
        ]);
    }

    private function validateSnapshotStructure(?array $snapshot): ?string
    {
        if ($snapshot === null) {
            return null;
        }

        if (! isset($snapshot['sections']) || ! is_array($snapshot['sections'])) {
            return 'The snapshot_json must contain a "sections" array.';
        }

        foreach ($snapshot['sections'] as $sIndex => $section) {
            if (! is_array($section)) {
                return "Section at index {$sIndex} must be an object.";
            }
            if (! isset($section['sectionName']) || ! is_string($section['sectionName'])) {
                return "Section at index {$sIndex} must have a string \"sectionName\".";
            }
            if (! isset($section['components']) || ! is_array($section['components'])) {
                return "Section at index {$sIndex} must contain a \"components\" array.";
            }

            foreach ($section['components'] as $cIndex => $component) {
                if (! is_array($component)) {
                    return "Component at index {$cIndex} in section {$sIndex} must be an object.";
                }
                if (! isset($component['blockId']) || ! is_numeric($component['blockId'])) {
                    return "Component at index {$cIndex} in section {$sIndex} must have a numeric \"blockId\".";
                }
                if (! isset($component['blockName']) || ! is_string($component['blockName'])) {
                    return "Component at index {$cIndex} in section {$sIndex} must have a string \"blockName\".";
                }
                if (! isset($component['type']) || ! is_string($component['type'])) {
                    return "Component at index {$cIndex} in section {$sIndex} must have a string \"type\".";
                }
                if (! array_key_exists('posX', $component) || ! is_numeric($component['posX'])) {
                    return "Component at index {$cIndex} in section {$sIndex} must have numeric \"posX\".";
                }
                if (! array_key_exists('posY', $component) || ! is_numeric($component['posY'])) {
                    return "Component at index {$cIndex} in section {$sIndex} must have numeric \"posY\".";
                }
                if (array_key_exists('sizeX', $component) && ! is_numeric($component['sizeX'])) {
                    return "Component at index {$cIndex} in section {$sIndex} must have numeric \"sizeX\" when present.";
                }

                $allowedTypes = ['text', 'image', 'button', 'separator'];
                if (! in_array($component['type'], $allowedTypes, true)) {
                    return "Component type \"{$component['type']}\" at index {$cIndex} in section {$sIndex} is invalid. Allowed: " . implode(', ', $allowedTypes);
                }
            }
        }

        return null;
    }

    private function extractVariables(array $snapshot): array
    {
        $variables = [];
        if (empty($snapshot['sections']) || ! is_array($snapshot['sections'])) {
            return $variables;
        }

        foreach ($snapshot['sections'] as $section) {
            if (empty($section['components']) || ! is_array($section['components'])) {
                continue;
            }

            foreach ($section['components'] as $component) {
                // Inspect 'content'
                if (isset($component['content']) && is_string($component['content'])) {
                    preg_match_all('/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/', $component['content'], $matches);
                    if (! empty($matches[1])) {
                        foreach ($matches[1] as $match) {
                            $variables[] = trim($match);
                        }
                    }
                }

                // Inspect 'url'
                if (isset($component['url']) && is_string($component['url'])) {
                    preg_match_all('/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/', $component['url'], $matches);
                    if (! empty($matches[1])) {
                        foreach ($matches[1] as $match) {
                            $variables[] = trim($match);
                        }
                    }
                }
            }
        }

        return array_values(array_unique($variables));
    }

    private function resolveTemplateContentFromRequest(Request $request): ?array
    {
        $payload = $request->get('content');

        if (is_array($payload)) {
            return $payload;
        }

        $legacyPayload = $request->get('snapshot_json');
        if (is_array($legacyPayload)) {
            return $legacyPayload;
        }

        return null;
    }

    private function normalizeTemplateContent(array $snapshot): array
    {
        if (! isset($snapshot['sections']) || ! is_array($snapshot['sections'])) {
            return $snapshot;
        }

        $snapshot['sections'] = array_map(function ($section): array {
            if (! is_array($section) || ! isset($section['components']) || ! is_array($section['components'])) {
                return is_array($section) ? $section : [];
            }

            $section['components'] = array_map(function ($component): array {
                if (! is_array($component)) {
                    return [];
                }

                if (! array_key_exists('sizeX', $component) || ! is_numeric($component['sizeX'])) {
                    $component['sizeX'] = 1;
                } else {
                    $component['sizeX'] = max((float) $component['sizeX'], 0.1);
                }

                return $component;
            }, $section['components']);

            return $section;
        }, $snapshot['sections']);

        return $snapshot;
    }
}
