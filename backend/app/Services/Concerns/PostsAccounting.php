<?php

namespace App\Services\Concerns;

use App\Enums\InventoryTransactionType;
use App\Models\CustomerLedger;
use App\Models\DailyTransaction;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\LedgerCategory;
use Illuminate\Support\Carbon;

/**
 * Shared accounting side-effects used by the sales/finance services.
 */
trait PostsAccounting
{
    protected function money(float $value): float
    {
        return round($value, 2);
    }

    /**
     * Append an entry to a customer's running ledger.
     */
    protected function postCustomerLedger(
        int $tenantId,
        int $customerId,
        string $entryType,
        float $debit,
        float $credit,
        Carbon $date,
        ?int $userId,
        string $refType,
        int $refId,
        string $note,
    ): void {
        $lastBalance = (float) CustomerLedger::query()
            ->where('tenant_id', $tenantId)
            ->where('customer_id', $customerId)
            ->orderByDesc('id')
            ->value('balance') ?? 0.0;

        $balance = $this->money($lastBalance + $debit - $credit);

        CustomerLedger::create([
            'tenant_id' => $tenantId,
            'customer_id' => $customerId,
            'entry_type' => $entryType,
            'reference_type' => $refType,
            'reference_id' => $refId,
            'debit' => $this->money($debit),
            'credit' => $this->money($credit),
            'balance' => $balance,
            'entry_date' => $date->toDateString(),
            'notes' => $note,
            'created_by' => $userId,
        ]);
    }

    /**
     * Adjust product stock and record a movement.
     */
    protected function adjustStock(
        int $tenantId,
        int $productId,
        float $delta,
        ?int $userId,
        string $refType,
        int $refId,
        string $note,
    ): void {
        $inventory = Inventory::query()
            ->where('tenant_id', $tenantId)
            ->where('product_id', $productId)
            ->lockForUpdate()
            ->first();

        $before = $inventory ? (float) $inventory->quantity : 0.0;
        $after = $this->money($before + $delta);

        if ($inventory) {
            $inventory->update(['quantity' => $after]);
        } else {
            Inventory::create([
                'tenant_id' => $tenantId,
                'product_id' => $productId,
                'quantity' => $after,
                'min_quantity_threshold' => 0,
            ]);
        }

        InventoryTransaction::create([
            'tenant_id' => $tenantId,
            'product_id' => $productId,
            'type' => $delta < 0 ? InventoryTransactionType::Out->value : InventoryTransactionType::In->value,
            'quantity' => abs($this->money($delta)),
            'reference_type' => $refType,
            'reference_id' => $refId,
            'before_quantity' => $before,
            'after_quantity' => $after,
            'notes' => $note,
            'created_by' => $userId,
        ]);
    }

    /**
     * Record an income entry for a received payment under the system
     * "Customer Payments" category.
     */
    protected function postIncomeForPayment(
        int $tenantId,
        float $amount,
        Carbon $date,
        ?int $userId,
        string $refType,
        int $refId,
        string $description,
    ): void {
        $category = LedgerCategory::query()
            ->where('tenant_id', $tenantId)
            ->where('type', 'income')
            ->where('name', 'Customer Payments')
            ->first();

        if (! $category) {
            return;
        }

        DailyTransaction::create([
            'tenant_id' => $tenantId,
            'category_id' => $category->id,
            'type' => 'income',
            'amount' => $this->money($amount),
            'transaction_date' => $date->toDateString(),
            'description' => $description,
            'reference_type' => $refType,
            'reference_id' => $refId,
            'created_by' => $userId,
        ]);
    }
}
