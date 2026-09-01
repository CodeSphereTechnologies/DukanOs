<?php

namespace App\Repositories;

use App\Models\Category;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CategoryRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return Category::class;
    }

    /**
     * @return Collection<int, Category>
     */
    public function allForTenant(int $tenantId): Collection
    {
        return $this->tenantQuery($tenantId)
            ->with('children')
            ->orderBy('sort_order')
            ->get();
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?int $parentId = null): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)
            ->with('parent')
            ->when($parentId, fn ($q) => $q->where('parent_id', $parentId))
            ->orderBy('sort_order')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?Category
    {
        return $this->tenantQuery($tenantId)->with('parent', 'children')->find($id);
    }

    public function existsForTenant(int $tenantId, string $slug, ?int $exceptId = null): bool
    {
        return $this->tenantQuery($tenantId)
            ->where('slug', $slug)
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }
}
