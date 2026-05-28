<?php

namespace App\Services;

use App\Models\AuditEvent;

class AuditEventLogger
{
    /**
     * @param  array<string, mixed>  $context
     */
    public function record(string $workspaceId, ?string $actorUserId, string $eventKey, array $context = []): void
    {
        AuditEvent::query()->create([
            'workspace_id' => $workspaceId,
            'actor_user_id' => $actorUserId,
            'event_key' => $eventKey,
            'context_json' => $context,
            'occurred_at' => now(),
        ]);
    }
}
