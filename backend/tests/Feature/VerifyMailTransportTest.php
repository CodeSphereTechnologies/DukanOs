<?php

namespace Tests\Feature;

use Tests\TestCase;

class VerifyMailTransportTest extends TestCase
{
    public function test_it_reports_missing_credentials_before_sending(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.from.address' => 'noreply@dukanos.pk',
            'mail.mailers.smtp' => [
                'transport' => 'smtp',
                'host' => 'smtp.example.com',
                'port' => 465,
                'username' => '',
                'password' => '',
            ],
        ]);

        $this->artisan('mail:verify --skip-send')
            ->expectsOutputToContain('MAIL_username is empty')
            ->expectsOutputToContain('MAIL_password is empty')
            // A sender on a different domain than the account cannot pass SPF.
            ->assertExitCode(1);
    }

    public function test_it_warns_when_the_sender_domain_differs_from_the_smtp_account(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.from.address' => 'noreply@dukanos.pk',
            'mail.mailers.smtp' => [
                'transport' => 'smtp',
                'host' => 'smtp.hostinger.com',
                'port' => 465,
                'username' => 'someone@example.com',
                'password' => 'secret',
            ],
        ]);

        $this->artisan('mail:verify --skip-send')
            ->expectsOutputToContain('SPF/DMARC')
            ->assertExitCode(1);
    }

    public function test_it_flags_a_log_mailer_as_non_delivering(): void
    {
        config(['mail.default' => 'log']);

        $this->artisan('mail:verify --skip-send')
            ->expectsOutputToContain('does not deliver real email')
            ->assertExitCode(1);
    }

    public function test_it_fails_loudly_when_delivery_cannot_complete(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.from.address' => 'someone@example.com',
            'mail.mailers.smtp' => [
                'transport' => 'smtp',
                'host' => '127.0.0.1',
                'port' => 1,
                'username' => 'someone@example.com',
                'password' => 'secret',
                'timeout' => 2,
            ],
        ]);

        $this->artisan('mail:verify --to=someone@example.com')
            ->expectsOutputToContain('failed')
            ->assertExitCode(1);
    }
}
