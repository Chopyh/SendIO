<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workspace extends Model
{
    use HasFactory;

    protected $fillable = ['account_id', 'name', 'timezone', 'locale_default'];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class);
    }
}
