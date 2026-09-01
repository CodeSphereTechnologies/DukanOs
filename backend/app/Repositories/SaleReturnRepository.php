<?php

namespace App\Repositories;

use App\Models\SaleReturn;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SaleReturnRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return SaleReturn::class;
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?int $invoiceId = null): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)
            ->with(['customer', 'invoice', 'items', 'creator'])
            ->when($invoiceId, fn ($q) => $q->where('invoice_id', $invoiceId))
            ->orderByDesc('return_date')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?SaleReturn
    {
        return $this->tenantQuery($tenantId)
            ->with(['customer', 'invoice', 'items', 'creator'])
            ->find($id);
    }
}
