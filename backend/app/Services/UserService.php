<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
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

        $role = Role::where('slug', $data['role'])->first();

        if (! $role || $role->slug === Role::SUPER_ADMIN) {
            throw ValidationException::withMessages(['role' => ['A valid store role is required.']]);
        }

        $user = $this->users->create([
            'tenant_id' => $actor->tenant_id,
            'role_id' => $role->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::log($actor, 'created', 'users', 'user', $user->id, null, $user->only(['name', 'email']));

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
