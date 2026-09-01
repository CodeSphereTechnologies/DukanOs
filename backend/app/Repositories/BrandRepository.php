<?php

namespace App\Repositories;

use App\Models\Brand;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class BrandRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return Brand::class;
    }

    /**
     * @return Collection<int, Brand>
     */
    public function allForTenant(int $tenantId): Collection
    {
        return $this->tenantQuery($tenantId)->orderBy('name')->get();
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)->orderBy('name')->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?Brand
    {
        return $this->tenantQuery($tenantId)->find($id);
    }

    public function existsForTenant(int $tenantId, string $slug, ?int $exceptId = null): bool
    {
        return $this->tenantQuery($tenantId)
            ->where('slug', $slug)
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }
}
