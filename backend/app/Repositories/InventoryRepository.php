<?php

namespace App\Repositories;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InventoryRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return Inventory::class;
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?string $search = null, bool $lowStockOnly = false): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)
            ->with(['product' => fn ($q) => $q->with('category', 'brand')])
            ->whereHas('product', function ($q) use ($search) {
                $q->when($search, function ($sub) use ($search) {
                    $needle = '%'.mb_strtolower($search).'%';
                    $sub->whereRaw('LOWER(name) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(sku) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(barcode) LIKE ?', [$needle]);
                });
            })
            ->when($lowStockOnly, fn ($q) => $q->whereColumn('quantity', '<=', 'min_quantity_threshold'))
            ->orderBy('quantity')
            ->paginate($perPage);
    }

    public function findForProduct(int $tenantId, int $productId): ?Inventory
    {
        return $this->tenantQuery($tenantId)->where('product_id', $productId)->first();
    }

    public function transactionPaginate(int $tenantId, int $productId, int $perPage = 25): LengthAwarePaginator
    {
        return InventoryTransaction::query()
            ->where('tenant_id', $tenantId)
            ->where('product_id', $productId)
            ->with('creator')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }
}
