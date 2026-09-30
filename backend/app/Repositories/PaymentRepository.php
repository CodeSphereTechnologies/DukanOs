<?php

namespace App\Repositories;

use App\Models\Payment;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PaymentRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return Payment::class;
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?int $customerId = null, ?int $invoiceId = null): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)
            ->with(['customer', 'invoice', 'creator'])
            ->when($customerId, fn ($q) => $q->where('customer_id', $customerId))
            ->when($invoiceId, fn ($q) => $q->where('invoice_id', $invoiceId))
            ->orderByDesc('payment_date')->orderByDesc('id')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?Payment
    {
        return $this->tenantQuery($tenantId)->with(['customer', 'invoice', 'creator'])->find($id);
    }
}
