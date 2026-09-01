<?php

namespace App\Repositories;

use App\Models\SalaryRecord;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SalaryRecordRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return SalaryRecord::class;
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?int $employeeId = null, ?string $status = null): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)
            ->with(['employee', 'creator'])
            ->when($employeeId, fn ($q) => $q->where('employee_id', $employeeId))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderByDesc('period')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?SalaryRecord
    {
        return $this->tenantQuery($tenantId)->with(['employee', 'creator'])->find($id);
    }

    public function findForEmployeeAndPeriod(int $tenantId, int $employeeId, string $period): ?SalaryRecord
    {
        return $this->tenantQuery($tenantId)
            ->where('employee_id', $employeeId)
            ->where('period', $period)
            ->first();
    }
}
