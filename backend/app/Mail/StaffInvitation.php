<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $temporaryPassword,
        public readonly string $storeName,
        public readonly string $roleName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your '.config('app.name').' store account credentials',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.staff-invitation',
            with: [
                'name' => $this->name,
                'email' => $this->email,
                'temporaryPassword' => $this->temporaryPassword,
                'storeName' => $this->storeName,
                'roleName' => $this->roleName,
                'loginUrl' => rtrim((string) config('app.frontend_url'), '/').'/login',
            ],
        );
    }
}