<?php

namespace App\Services;

use App\Mail\StaffInvitation;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Support\StaffProvisioningResult;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UserService
{
    public function __construct(private readonly UserRepository $users) {}

    /**
     * Create a store user (owner/manager/cashier/accountant) for a tenant.
     *
     * Store users are always created inside their own tenant. Super admins
     * have no tenant of their own, so they must target one explicitly.
     */
    public function create(User $actor, array $data): StaffProvisioningResult
    {
        if ($this->users->existsEmail($data['email'])) {
            throw ValidationException::withMessages(['email' => ['This email is already registered.']]);
        }

        $tenant = $this->resolveTargetTenant($actor, $data);

        $role = Role::where('slug', $data['role'])->first();

        if (! $role || $role->slug === Role::SUPER_ADMIN) {
            throw ValidationException::withMessages(['role' => ['A valid store role is required.']]);
        }

        $initialPassword = $data['password'] ?? Str::random(12);

        $user = $this->users->create([
            'tenant_id' => $tenant->id,
            'role_id' => $role->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($initialPassword),
            'phone' => $data['phone'] ?? null,
            'status' => $data['status'] ?? 'active',
            // The account is provisioned with credentials by an admin, so it
            // is usable immediately and must not sit behind email verification.
            'email_verified_at' => now(),
        ]);

        AuditService::log($actor, 'created', 'users', 'user', $user->id, null, [
            ...$user->only(['name', 'email']),
            'tenant_id' => $tenant->id,
        ]);

        $delivery = $this->sendInvitation($user, $role, $tenant, $initialPassword);

        return new StaffProvisioningResult(
            user: $user->load('role'),
            invitationSent: $delivery['sent'],
            invitationError: $delivery['error'],
            initialPassword: $initialPassword,
        );
    }

    /**
     * Resolve the tenant a new user belongs to.
     */
    private function resolveTargetTenant(User $actor, array $data): Tenant
    {
        if (! $actor->isSuperAdmin()) {
            if (! $actor->tenant_id) {
                throw ValidationException::withMessages(['role' => ['Log in with a store account before creating staff.']]);
            }

            $tenant = $actor->tenant()->first();

            if (! $tenant) {
                throw ValidationException::withMessages(['tenant_id' => ['Your store account is not linked to a valid store.']]);
            }

            return $tenant;
        }

        $tenant = Tenant::find($data['tenant_id'] ?? null);

        if (! $tenant) {
            throw ValidationException::withMessages(['tenant_id' => ['Select the store this staff member belongs to.']]);
        }

        return $tenant;
    }

    /**
     * Email the new staff member their sign-in credentials.
     *
     * Delivery is reported rather than swallowed: this email is the only place
     * the initial password is disclosed, so a failure has to reach the caller
     * for the administrator to hand the credentials over by hand. The account
     * itself stays valid either way.
     *
     * @return array{sent: bool, error: string|null}
     */
    private function sendInvitation(User $user, Role $role, Tenant $tenant, string $initialPassword): array
    {
        try {
            Mail::to($user->email)->send(new StaffInvitation(
                name: $user->name,
                email: $user->email,
                temporaryPassword: $initialPassword,
                storeName: $tenant->name ?? config('app.name'),
                roleName: $role->name,
            ));

            return ['sent' => true, 'error' => null];
        } catch (\Throwable $e) {
            report($e);

            Log::error('Staff invitation email failed to send.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);

            return ['sent' => false, 'error' => $e->getMessage()];
        }
    }

    public function update(User $actor, User $user, array $data): User
    {
        if ($this->users->existsEmail($data['email'], $user->id)) {
            throw ValidationException::withMessages(['email' => ['This email is already registered.']]);
        }

        $old = $user->only(['name', 'email', 'status', 'role_id']);

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? $user->phone,
            'status' => $data['status'] ?? $user->status,
        ];

        if (isset($data['role'])) {
            $role = Role::where('slug', $data['role'])->first();

            if (! $role || $role->slug === Role::SUPER_ADMIN) {
                throw ValidationException::withMessages(['role' => ['A valid store role is required.']]);
            }

            $payload['role_id'] = $role->id;
        }

        if (! empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
        }

        $user->update($payload);

        AuditService::log($actor, 'updated', 'users', 'user', $user->id, $old, $user->only(['name', 'email', 'status', 'role_id']));

        return $user->fresh('role');
    }

    public function delete(User $actor, User $user): void
    {
        if ($user->id === $actor->id) {
            throw ValidationException::withMessages(['user' => ['You cannot delete your own account.']]);
        }

        AuditService::log($actor, 'deleted', 'users', 'user', $user->id, $user->only(['name', 'email']), null);
        $user->delete();
    }
}
