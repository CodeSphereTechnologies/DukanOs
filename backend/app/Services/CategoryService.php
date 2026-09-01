<?php

namespace App\Services;

use App\Models\Category;
use App\Models\User;
use App\Repositories\CategoryRepository;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    public function __construct(private readonly CategoryRepository $categories) {}

    public function create(User $user, array $data): Category
    {
        $tenantId = $user->tenant_id;

        if ($this->categories->existsForTenant($tenantId, $data['slug'])) {
            throw ValidationException::withMessages(['slug' => ['This slug is already in use.']]);
        }

        $category = $this->categories->create([
            'tenant_id' => $tenantId,
            'parent_id' => $data['parent_id'] ?? null,
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'] ?? null,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::log($user, 'created', 'categories', 'category', $category->id, null, $category->only(['name', 'slug']));

        return $category;
    }

    public function update(User $user, Category $category, array $data): Category
    {
        if ($this->categories->existsForTenant($user->tenant_id, $data['slug'], $category->id)) {
            throw ValidationException::withMessages(['slug' => ['This slug is already in use.']]);
        }

        $old = $category->only(['name', 'slug', 'status']);

        $category->update([
            'parent_id' => $data['parent_id'] ?? $category->parent_id,
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'] ?? $category->description,
            'sort_order' => (int) ($data['sort_order'] ?? $category->sort_order),
            'status' => $data['status'] ?? $category->status,
        ]);

        AuditService::log($user, 'updated', 'categories', 'category', $category->id, $old, $category->only(['name', 'slug', 'status']));

        return $category;
    }

    public function delete(User $user, Category $category): void
    {
        AuditService::log($user, 'deleted', 'categories', 'category', $category->id, $category->only(['name', 'slug']), null);
        $this->categories->delete($category);
    }
}
