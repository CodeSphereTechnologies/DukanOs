<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\User;
use App\Repositories\BrandRepository;
use Illuminate\Validation\ValidationException;

class BrandService
{
    public function __construct(private readonly BrandRepository $brands) {}

    public function create(User $user, array $data): Brand
    {
        if ($this->brands->existsForTenant($user->tenant_id, $data['slug'])) {
            throw ValidationException::withMessages(['slug' => ['This slug is already in use.']]);
        }

        $brand = $this->brands->create([
            'tenant_id' => $user->tenant_id,
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::log($user, 'created', 'brands', 'brand', $brand->id, null, $brand->only(['name', 'slug']));

        return $brand;
    }

    public function update(User $user, Brand $brand, array $data): Brand
    {
        if ($this->brands->existsForTenant($user->tenant_id, $data['slug'], $brand->id)) {
            throw ValidationException::withMessages(['slug' => ['This slug is already in use.']]);
        }

        $old = $brand->only(['name', 'slug', 'status']);

        $brand->update([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'] ?? $brand->description,
            'status' => $data['status'] ?? $brand->status,
        ]);

        AuditService::log($user, 'updated', 'brands', 'brand', $brand->id, $old, $brand->only(['name', 'slug', 'status']));

        return $brand;
    }

    public function delete(User $user, Brand $brand): void
    {
        AuditService::log($user, 'deleted', 'brands', 'brand', $brand->id, $brand->only(['name', 'slug']), null);
        $this->brands->delete($brand);
    }
}
