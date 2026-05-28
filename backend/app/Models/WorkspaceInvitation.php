<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceInvitation extends Model
{
    use HasFactory, HasUuids;

    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_REVOKED = 'revoked';

    public const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'workspace_id',
        'invited_by_user_id',
        'email',
        'email_normalized',
        'role',
        'token_hash',
        'status',
        'expires_at',
        'accepted_at',
        'revoked_at',
    ];

    protected $hidden = [
        'token_hash',
        'email_normalized',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }

    public function isAcceptable(): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }

        return $this->expires_at === null || $this->expires_at->isFuture();
    }
}
