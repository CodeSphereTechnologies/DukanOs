<?php

namespace App\Repositories;

use App\Models\AuditLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AuditLogRepository extends BaseRepository
{
    protected function modelClass(): string
    {
        return AuditLog::class;
    }

    public function paginate(?int $tenantId = null, int $perPage = 25, ?string $module = null, ?string $action = null): LengthAwarePaginator
    {
        return $this->query()
            ->with('user')
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->when($module, fn ($q) => $q->where('module', $module))
            ->when($action, fn ($q) => $q->where('action', $action))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }
}
