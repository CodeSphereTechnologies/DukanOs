<?php

namespace App\Services;

use App\Mail\StaffInvitation;
use App\Models\Role;
use App\Models\User;
use App\Repositories\UserRepository;
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
     */
    public function create(User $actor, array $data): User
    {
        if ($this->users->existsEmail($data['email'])) {
            throw ValidationException::withMessages(['email' => ['This email is already registered.']]);
        }

        if (! $actor->tenant_id) {
            throw ValidationException::withMessages(['role' => ['Log in with a store account before creating staff.']]);
        }

        $role = Role::where('slug', $data['role'])->first();

        if (! $role || $role->slug === Role::SUPER_ADMIN) {
            throw ValidationException::withMessages(['role' => ['A valid store role is required.']]);
        }

        $temporaryPassword = $data['password'] ?? Str::random(12);

        $user = $this->users->create([
            'tenant_id' => $actor->tenant_id,
            'role_id' => $role->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($temporaryPassword),
            'phone' => $data['phone'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::log($actor, 'created', 'users', 'user', $user->id, null, $user->only(['name', 'email']));

        try {
            Mail::to($user->email)->send(new StaffInvitation(
                name: $user->name,
                email: $user->email,
                temporaryPassword: $temporaryPassword,
                storeName: $actor->tenant?->name ?? config('app.name'),
                roleName: $role->name,
            ));
        } catch (\Throwable $e) {
            report($e);

            Log::error('Staff invitation email failed to send.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }

        return $user->load('role');
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
