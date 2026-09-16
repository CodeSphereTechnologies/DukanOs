<?php

namespace App\Repositories;

use App\Models\Product;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return Product::class;
    }

    public function paginateForTenant(
        int $tenantId,
        int $perPage = 25,
        ?string $search = null,
        ?int $categoryId = null,
        ?int $brandId = null,
        ?string $status = null,
    ): LengthAwarePaginator {
        return $this->tenantQuery($tenantId)
            ->with(['category', 'brand', 'inventory', 'specificationValues.specification', 'specificationValues.specificationValue'])
            ->when($search, function ($q) use ($search) {
                $needle = '%'.mb_strtolower($search).'%';
                $q->where(function ($sub) use ($needle) {
                    $sub->whereRaw('LOWER(name) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(sku) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(barcode) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(model_number) LIKE ?', [$needle]);
                });
            })
            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))
            ->when($brandId, fn ($q) => $q->where('brand_id', $brandId))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest('created_at')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?Product
    {
        return $this->tenantQuery($tenantId)
            ->with(['category', 'brand', 'inventory', 'specificationValues.specification', 'specificationValues.specificationValue'])
            ->find($id);
    }

    public function findByBarcode(int $tenantId, string $barcode): ?Product
    {
        return $this->tenantQuery($tenantId)->where('barcode', $barcode)->first();
    }

    public function existsForTenant(int $tenantId, string $sku, ?int $exceptId = null): bool
    {
        return $this->tenantQuery($tenantId)
            ->where('sku', $sku)
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }

    public function existsByBarcode(int $tenantId, string $barcode, ?int $exceptId = null): bool
    {
        return $this->tenantQuery($tenantId)
            ->where('barcode', $barcode)
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }
}
