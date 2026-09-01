<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Repositories\TenantRepository;
use Illuminate\Validation\ValidationException;

class TenantService
{
    public function __construct(private readonly TenantRepository $tenants) {}

    public function create(User $user, array $data): Tenant
    {
        if ($this->tenants->existsBySlug($data['slug'])) {
            throw ValidationException::withMessages(['slug' => ['This slug is already in use.']]);
        }

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

        AuditService::log($user, 'created', 'tenants', 'tenant', $tenant->id, null, $tenant->only(['name', 'slug']));

        return $tenant;
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
