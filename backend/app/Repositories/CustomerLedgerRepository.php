<?php

namespace App\Repositories;

use App\Models\CustomerLedger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomerLedgerRepository extends BaseRepository
{
    protected function modelClass(): string
    {
        return CustomerLedger::class;
    }

    public function paginateForCustomer(int $tenantId, int $customerId, int $perPage = 25): LengthAwarePaginator
    {
        return CustomerLedger::query()
            ->where('tenant_id', $tenantId)
            ->where('customer_id', $customerId)
            ->with('creator')
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function balanceForCustomer(int $tenantId, int $customerId): float
    {
        return (float) CustomerLedger::query()
            ->where('tenant_id', $tenantId)
            ->where('customer_id', $customerId)
            ->sum('debit')
            - (float) CustomerLedger::query()
                ->where('tenant_id', $tenantId)
                ->where('customer_id', $customerId)
                ->sum('credit');
    }
}
