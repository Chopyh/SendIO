<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CampaignRecipient extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'workspace_id',
        'campaign_id',
        'contact_id',
        'email',
        'status',
        'attempt_count',
        'last_error',
        'last_attempt_at',
        'next_retry_at',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'last_attempt_at' => 'datetime',
            'next_retry_at' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(DeliveryAttempt::class);
    }
}
