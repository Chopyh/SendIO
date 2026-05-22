<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateVersion extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'template_id',
        'version_number',
        'state',
        'snapshot_json',
        'compliance_unsubscribe_url',
    ];

    protected $casts = [
        'snapshot_json' => 'array',
        'compliance_unsubscribe_url' => 'boolean',
    ];

    protected $appends = [
        'content',
    ];

    public function getContentAttribute(): ?array
    {
        return $this->snapshot_json;
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function variableUsages(): HasMany
    {
        return $this->hasMany(TemplateVariableUsage::class);
    }
}
