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
}
