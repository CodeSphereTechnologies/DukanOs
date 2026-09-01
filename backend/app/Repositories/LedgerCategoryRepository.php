<?php

namespace App\Repositories;

use App\Models\LedgerCategory;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class LedgerCategoryRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return LedgerCategory::class;
    }

    /**
     * @return Collection<int, LedgerCategory>
     */
    public function allForTenant(int $tenantId, ?string $type = null): Collection
    {
        return $this->tenantQuery($tenantId)
            ->when($type, fn ($q) => $q->where('type', $type))
            ->orderBy('type')
            ->orderBy('name')
            ->get();
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?string $type = null): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)
            ->when($type, fn ($q) => $q->where('type', $type))
            ->orderBy('type')
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?LedgerCategory
    {
        return $this->tenantQuery($tenantId)->find($id);
    }
}
