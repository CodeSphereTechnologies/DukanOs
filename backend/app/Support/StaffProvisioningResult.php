<?php

namespace App\Support;

use App\Models\User;

/**
 * The outcome of provisioning a store user.
 *
 * The account is persisted whether or not the invitation email goes out, but
 * that email is the only channel that discloses the initial password. Swallowing
 * a transport failure therefore leaves the administrator believing onboarding
 * finished when the new staff member has no way to learn their credentials.
 */
readonly class StaffProvisioningResult
{
    public function __construct(
        public User $user,
        public bool $invitationSent,
        public ?string $invitationError = null,
        public ?string $initialPassword = null,
    ) {}

    /**
     * The password to hand over by hand.
     *
     * Only meaningful when the invitation could not be delivered — once the
     * staff member has the email, the plaintext is never disclosed again.
     */
    public function recoveryPassword(): ?string
    {
        return $this->invitationSent ? null : $this->initialPassword;
    }
}
