<?php

namespace App\Repositories\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Adds tenant-scoped query helpers to a repository.
 */
trait ScopesByTenant
{
    protected function tenantQuery(int $tenantId): Builder
    {
        return $this->query()->where('tenant_id', $tenantId);
    }

    public function findForTenant(int $tenantId, int $id): ?Model
    {
        return $this->tenantQuery($tenantId)->find($id);
    }

    public function deleteForTenant(int $tenantId, int $id): bool
    {
        return (bool) $this->tenantQuery($tenantId)->whereKey($id)->delete();
    }
}
