<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_invitations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('invited_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('email');
            $table->string('email_normalized');
            $table->string('role', 20);
            $table->string('token_hash', 128)->unique();
            $table->string('status', 20)->default('pending');
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
            $table->index(['email_normalized', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_invitations');
    }
};
