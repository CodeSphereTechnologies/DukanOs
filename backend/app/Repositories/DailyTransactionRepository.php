<?php

namespace App\Repositories;

use App\Models\DailyTransaction;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DailyTransactionRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return DailyTransaction::class;
    }

    public function paginateForTenant(
        int $tenantId,
        int $perPage = 25,
        ?string $type = null,
        ?int $categoryId = null,
        ?string $from = null,
        ?string $to = null,
    ): LengthAwarePaginator {
        return $this->tenantQuery($tenantId)
            ->with(['category', 'creator'])
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))
            ->when($from, fn ($q) => $q->whereDate('transaction_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('transaction_date', '<=', $to))
            ->orderByDesc('transaction_date')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?DailyTransaction
    {
        return $this->tenantQuery($tenantId)->with(['category', 'creator'])->find($id);
    }
}
