<?php

namespace App\Support\Traits;

trait ResolvesTenant
{
    /**
     * Resolve the tenant id of the authenticated user.
     */
    protected function tenantId(): int
    {
        $tenantId = request()->user()?->tenant_id;

        abort_unless($tenantId, 403, 'A tenant context is required to access this resource.');

        return (int) $tenantId;
    }

    /**
     * Resolve the tenant model of the authenticated user.
     */
    protected function tenant(): \App\Models\Tenant
    {
        $tenant = request()->user()?->tenant;

        abort_if($tenant === null, 403, 'A tenant context is required to access this resource.');

        return $tenant;
    }
}
