<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\User;
use App\Services\Concerns\PostsAccounting;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    use PostsAccounting;

    /**
     * Record a manual stock adjustment (positive or negative).
     */
    public function adjust(User $user, int $productId, float $delta, ?string $note = null): void
    {
        $tenantId = $user->tenant_id;

        DB::transaction(function () use ($tenantId, $user, $productId, $delta, $note) {
            $this->adjustStock(
                $tenantId,
                $productId,
                $delta,
                $user->id,
                InventoryTransaction::class,
                0,
                $note ?? 'Manual adjustment',
            );
        });

        AuditService::log($user, 'updated', 'inventory', 'product', $productId, null, ['quantity_change' => $delta]);
    }
}
