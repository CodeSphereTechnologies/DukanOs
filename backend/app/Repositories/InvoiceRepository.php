<?php

namespace App\Repositories;

use App\Models\Invoice;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InvoiceRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return Invoice::class;
    }

    public function paginateForTenant(
        int $tenantId,
        int $perPage = 25,
        ?string $search = null,
        ?int $customerId = null,
        ?string $paymentStatus = null,
        ?string $from = null,
        ?string $to = null,
    ): LengthAwarePaginator {
        return $this->tenantQuery($tenantId)
            ->with(['customer', 'items', 'payments', 'creator'])
            ->when($search, fn ($q) => $q->where('invoice_number', 'like', "%{$search}%"))
            ->when($customerId, fn ($q) => $q->where('customer_id', $customerId))
            ->when($paymentStatus, fn ($q) => $q->where('payment_status', $paymentStatus))
            ->when($from, fn ($q) => $q->whereDate('invoice_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('invoice_date', '<=', $to))
            ->orderByDesc('invoice_date')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?Invoice
    {
        return $this->tenantQuery($tenantId)
            ->with(['customer', 'items', 'payments', 'returns', 'creator', 'quotation'])
            ->find($id);
    }
}
