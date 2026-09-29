<?php

namespace App\Console\Commands;

use App\Mail\StaffInvitation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Smoke-test the configured mail transport.
 *
 * A misconfigured mailer is invisible until someone waits on an invitation that
 * never arrives, so this makes the current settings and an actual delivery
 * attempt verifiable in one command. Suitable as a container healthcheck.
 */
class VerifyMailTransport extends Command
{
    protected $signature = 'mail:verify
                            {--to= : Recipient address; defaults to MAIL_FROM_ADDRESS}
                            {--skip-send : Report configuration only, without delivering a message}';

    protected $description = 'Verify the configured mail transport can actually deliver a message';

    public function handle(): int
    {
        $mailer = (string) config('mail.default');
        $config = (array) config("mail.mailers.{$mailer}", []);

        $this->components->info("Mailer: {$mailer}");

        foreach (['host', 'port', 'username', 'scheme', 'url'] as $key) {
            if (($config[$key] ?? null) === null || $config[$key] === '') {
                continue;
            }

            $this->line("  {$key}: {$this->mask($key, (string) $config[$key])}");
        }

        $this->line('  from: '.(string) config('mail.from.address')
            .' <'.(string) config('mail.from.name').'>');

        $problems = $this->configurationProblems($mailer, $config);

        foreach ($problems as $problem) {
            $this->components->warn($problem);
        }

        if ($this->option('skip-send')) {
            return $problems === [] ? self::SUCCESS : self::FAILURE;
        }

        $to = (string) ($this->option('to') ?: config('mail.from.address'));

        if ($to === '') {
            $this->components->error('No recipient to send to. Pass --to=someone@example.com.');

            return self::FAILURE;
        }

        try {
            Mail::mailer($mailer)->to($to)->send(new StaffInvitation(
                name: 'Mail Verification',
                email: $to,
                temporaryPassword: 'not-a-real-password',
                storeName: (string) config('app.name'),
                roleName: 'Transport Check',
            ));
        } catch (\Throwable $e) {
            $this->components->error('Delivery to '.$to.' failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->components->info("Test message delivered to {$to}.");

        return self::SUCCESS;
    }

    /**
     * Settings that are known to break delivery, checked before sending.
     *
     * @param  array<string, mixed>  $config
     * @return list<string>
     */
    private function configurationProblems(string $mailer, array $config): array
    {
        if (! in_array($mailer, ['smtp', 'sendmail', 'ses', 'ses-v2', 'postmark', 'resend', 'mailgun'], true)) {
            return ["Mailer [{$mailer}] does not deliver real email; invitations will only be written to the log."];
        }

        $problems = [];

        if ($mailer === 'smtp') {
            foreach (['username', 'password'] as $key) {
                if (($config[$key] ?? null) === null || $config[$key] === '') {
                    $problems[] = "MAIL_{$key} is empty; the SMTP server will reject the login.";
                }
            }
        }

        $from = (string) config('mail.from.address');

        if ($from === '') {
            $problems[] = 'MAIL_FROM_ADDRESS is empty; most servers reject mail without a valid sender.';
        }

        // A sender the provider is not authorised to send for is the most
        // common cause of "the transport works but nothing is delivered".
        if ($from !== '' && ($username = (string) ($config['username'] ?? '')) !== '') {
            $fromDomain = $this->domainOf($from);
            $userDomain = $this->domainOf($username);

            if ($fromDomain !== null && $userDomain !== null && $fromDomain !== $userDomain) {
                $problems[] = "MAIL_FROM_ADDRESS ({$from}) is on a different domain than the authenticated SMTP account ({$username}); SPF/DMARC will likely reject or divert the message.";
            }
        }

        return $problems;
    }

    private function mask(string $key, string $value): string
    {
        if ($key !== 'username' && $key !== 'password') {
            return $value;
        }

        return $value === '' ? '(empty)' : str_repeat('*', min(strlen($value), 4)).substr($value, -2);
    }

    private function domainOf(string $address): ?string
    {
        $domain = strrchr($address, '@');

        return $domain === false ? null : strtolower(substr($domain, 1));
    }
}
