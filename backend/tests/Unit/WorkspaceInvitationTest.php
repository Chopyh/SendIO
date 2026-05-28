<?php

namespace Tests\Unit;

use App\Models\WorkspaceInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_invitation_is_acceptable_when_not_expired(): void
    {
        $invitation = new WorkspaceInvitation([
            'status' => WorkspaceInvitation::STATUS_PENDING,
            'expires_at' => now()->addDay(),
        ]);

        $this->assertTrue($invitation->isAcceptable());
    }

    public function test_non_pending_or_expired_invitation_is_not_acceptable(): void
    {
        $accepted = new WorkspaceInvitation([
            'status' => WorkspaceInvitation::STATUS_ACCEPTED,
            'expires_at' => now()->addDay(),
        ]);

        $expired = new WorkspaceInvitation([
            'status' => WorkspaceInvitation::STATUS_PENDING,
            'expires_at' => now()->subMinute(),
        ]);

        $this->assertFalse($accepted->isAcceptable());
        $this->assertFalse($expired->isAcceptable());
    }
}
