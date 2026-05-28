<?php

namespace App\Mail;

use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkspaceInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $workspaceName,
        public readonly string $role,
        public readonly string $invitationUrl,
        public readonly ?CarbonInterface $expiresAt,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You were invited to join '.$this->workspaceName.' on SendIO',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.workspace-invitation',
        );
    }
}
