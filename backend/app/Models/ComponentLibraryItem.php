<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComponentLibraryItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'workspace_id',
        'scope',
        'name',
        'component_type',
        'schema_json',
    ];

    protected $casts = [
        'schema_json' => 'array',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
