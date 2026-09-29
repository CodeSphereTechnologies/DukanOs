<?php

namespace App\Services;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Repositories\TenantRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TenantService
{
    public function __construct(private readonly TenantRepository $tenants) {}

    public function create(User $user, array $data): Tenant
    {
        if ($this->tenants->existsBySlug($data['slug'])) {
            throw ValidationException::withMessages(['slug' => ['This slug is already in use.']]);
        }

        return DB::transaction(function () use ($user, $data) {
            return $this->createTenant($user, $data);
        });
    }

    private function createTenant(User $user, array $data): Tenant
    {
        $tenant = $this->tenants->create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'currency' => $data['currency'] ?? 'PKR',
            'timezone' => $data['timezone'] ?? 'Asia/Karachi',
            'status' => $data['status'] ?? 'active',
            'settings' => $data['settings'] ?? [],
        ]);

        $owner = $this->createOwnerAccount($tenant, $data);

        AuditService::log($user, 'created', 'tenants', 'tenant', $tenant->id, null, $tenant->only(['name', 'slug']));

        if ($owner) {
            AuditService::log($user, 'created', 'users', 'user', $owner->id, null, [
                'email' => $owner->email,
                'role' => 'owner',
            ]);
        }

        return $tenant;
    }

    /**
     * Create the store's first owner account.
     *
     * Without this a provisioned store has no one who can sign in: the tenant
     * row exists but login matches on users.email, so every credential is
     * rejected until an account is created.
     *
     * @return User|null null when no owner credentials were supplied
     */
    private function createOwnerAccount(Tenant $tenant, array $data): ?User
    {
        if (empty($data['owner_email'])) {
            return null;
        }

        $role = Role::query()->where('slug', 'owner')->first();

        if (! $role) {
            throw ValidationException::withMessages([
                'owner_email' => ['The owner role is missing. Seed the platform roles first.'],
            ]);
        }

        if (User::withTrashed()->where('email', $data['owner_email'])->exists()) {
            throw ValidationException::withMessages([
                'owner_email' => ['A user with this email already exists.'],
            ]);
        }

        return User::create([
            'tenant_id' => $tenant->id,
            'role_id' => $role->id,
            'name' => $data['owner_name'] ?? $data['owner_email'],
            'email' => $data['owner_email'],
            'password' => $data['owner_password'],
            'phone' => $data['phone'] ?? null,
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    public function update(User $user, Tenant $tenant, array $data): Tenant
    {
        if (isset($data['slug']) && $this->tenants->existsBySlug($data['slug'], $tenant->id)) {
            throw ValidationException::withMessages(['slug' => ['This slug is already in use.']]);
        }

        $old = $tenant->only(['name', 'slug', 'status']);

        $tenant->update([
            'name' => $data['name'] ?? $tenant->name,
            'slug' => $data['slug'] ?? $tenant->slug,
            'email' => $data['email'] ?? $tenant->email,
            'phone' => $data['phone'] ?? $tenant->phone,
            'address' => $data['address'] ?? $tenant->address,
            'city' => $data['city'] ?? $tenant->city,
            'state' => $data['state'] ?? $tenant->state,
            'postal_code' => $data['postal_code'] ?? $tenant->postal_code,
            'currency' => $data['currency'] ?? $tenant->currency,
            'timezone' => $data['timezone'] ?? $tenant->timezone,
            'status' => $data['status'] ?? $tenant->status,
            'settings' => $data['settings'] ?? $tenant->settings,
        ]);

        AuditService::log($user, 'updated', 'tenants', 'tenant', $tenant->id, $old, $tenant->only(['name', 'slug', 'status']));

        return $tenant;
    }

    public function delete(User $user, Tenant $tenant): void
    {
        AuditService::log($user, 'deleted', 'tenants', 'tenant', $tenant->id, $tenant->only(['name', 'slug']), null);
        $this->tenants->delete($tenant);
    }
}
