<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('templates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('template_versions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('template_id')->constrained()->cascadeOnDelete();
            $table->integer('version_number');
            $table->string('state')->default('draft'); // 'draft', 'published'
            $table->json('snapshot_json')->nullable();
            $table->boolean('compliance_unsubscribe_url')->default(false);
            $table->timestamps();

            // Combined unique index to ensure version uniqueness per template
            $table->unique(['template_id', 'version_number']);
        });

        Schema::create('template_variable_usages', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('template_version_id')->constrained()->cascadeOnDelete();
            $table->string('placeholder_name');
            $table->string('category'); // 'Contact', 'Workspace', 'System'
            $table->boolean('required')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_variable_usages');
        Schema::dropIfExists('template_versions');
        Schema::dropIfExists('templates');
    }
};
