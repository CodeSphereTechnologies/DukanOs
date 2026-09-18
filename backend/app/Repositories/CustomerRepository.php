<?php

namespace App\Repositories;

use App\Models\Customer;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomerRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return Customer::class;
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?string $search = null): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)
            ->when($search, function ($q) use ($search) {
                $needle = '%'.mb_strtolower($search).'%';
                $q->whereRaw('LOWER(name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(phone) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function findByPhone(int $tenantId, string $phone): ?Customer
    {
        return $this->tenantQuery($tenantId)->where('phone', $phone)->first();
    }

    public function findForTenant(int $tenantId, int $id): ?Customer
    {
        return $this->tenantQuery($tenantId)->find($id);
    }
}
