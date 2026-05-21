# UUID Convention — Database Standards

All tables in SendIO MUST use UUID as the primary key type. This is a non-negotiable standard.

## Rationale

- **Distributed-safe**: UUIDs can be generated on the client, server, or any service without coordination.
- **Privacy-safe**: Sequential integers expose record counts and creation order to consumers of the API.
- **Consistent across all integrations**: All consumers of the API (frontend, third-party integrations) receive the same opaque identifier regardless of context.
- **Referential integrity**: UUID foreign keys align precisely with UUID primary keys without implicit casting ambiguity.

## Rules

### Primary Keys

All tables MUST declare a UUID primary key:

```php
$table->uuid('id')->primary();
```

### Foreign Keys

All foreign keys referencing UUID primary keys MUST use `foreignUuid`:

```php
$table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
```

### Morph Relationships

All polymorphic relationships MUST use `uuidMorphs` to ensure the `_id` column stores a UUID:

```php
$table->uuidMorphs('tokenable');
```

### Eloquent Models

All Eloquent models MUST include the `HasUuids` trait. This ensures Laravel auto-generates UUIDs on creation:

```php
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MyModel extends Model
{
    use HasUuids;
}
```

> [!IMPORTANT]
> Do NOT use `$incrementing = false` or `$keyType = 'string'` manually. `HasUuids` handles both automatically.

### API Layer

Controllers and middleware MUST pass workspace and entity IDs as **strings** (not cast to `int`). Casting a UUID to `int` via `(int)` will silently truncate it to `0`.

```php
// ✅ Correct
$workspaceId = $request->attributes->get('workspace_id');

// ❌ Wrong — will truncate UUID to 0
$workspaceId = (int) $request->attributes->get('workspace_id');
```

## Enforcement

This standard applies to:

- All new tables created in any migration.
- All new Eloquent models.
- Any modification to an existing table's schema that involves primary or foreign key columns.

Deviations from this standard must be approved and documented here as exceptions with a clear technical justification.
