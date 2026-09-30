<?php

namespace App\Repositories;

use App\Models\Quotation;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class QuotationRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return Quotation::class;
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)
            ->with(['customer', 'items', 'creator'])
            ->when($search, fn ($q) => $q->where('quotation_number', 'like', "%{$search}%"))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderByDesc('quotation_date')->orderByDesc('id')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?Quotation
    {
        return $this->tenantQuery($tenantId)
            ->with(['customer', 'items', 'creator', 'invoice'])
            ->find($id);
    }
}
