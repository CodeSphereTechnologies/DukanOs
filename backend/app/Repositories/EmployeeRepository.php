<?php

namespace App\Repositories;

use App\Models\Employee;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EmployeeRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return Employee::class;
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?string $search = null): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)
            ->when($search, function ($q) use ($search) {
                $needle = '%'.mb_strtolower($search).'%';
                $q->whereRaw('LOWER(name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(designation) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(phone) LIKE ?', [$needle]);
            })
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?Employee
    {
        return $this->tenantQuery($tenantId)->with('user')->find($id);
    }
}
