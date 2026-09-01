<?php

namespace App\Services;

use App\Models\DailyTransaction;
use App\Models\LedgerCategory;
use App\Models\User;
use App\Repositories\DailyTransactionRepository;
use App\Repositories\LedgerCategoryRepository;
use App\Services\Concerns\PostsAccounting;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class LedgerService
{
    use PostsAccounting;

    public function __construct(
        private readonly LedgerCategoryRepository $categories,
        private readonly DailyTransactionRepository $transactions,
    ) {}

    public function createCategory(User $user, array $data): LedgerCategory
    {
        $exists = LedgerCategory::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('type', $data['type'])
            ->where('name', $data['name'])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages(['name' => ['A category with this name already exists for this type.']]);
        }

        $category = $this->categories->create([
            'tenant_id' => $user->tenant_id,
            'type' => $data['type'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::log($user, 'created', 'ledger_categories', 'ledger_category', $category->id, null, $category->only(['type', 'name']));

        return $category;
    }

    public function updateCategory(User $user, LedgerCategory $category, array $data): LedgerCategory
    {
        $exists = LedgerCategory::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('type', $category->type)
            ->where('name', $data['name'])
            ->whereKeyNot($category->id)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages(['name' => ['A category with this name already exists for this type.']]);
        }

        $old = $category->only(['type', 'name', 'status']);

        $category->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? $category->description,
            'status' => $data['status'] ?? $category->status,
        ]);

        AuditService::log($user, 'updated', 'ledger_categories', 'ledger_category', $category->id, $old, $category->only(['type', 'name', 'status']));

        return $category;
    }

    public function deleteCategory(User $user, LedgerCategory $category): void
    {
        if ($category->is_system) {
            throw ValidationException::withMessages(['category' => ['System categories cannot be deleted.']]);
        }

        AuditService::log($user, 'deleted', 'ledger_categories', 'ledger_category', $category->id, $category->only(['type', 'name']), null);
        $this->categories->delete($category);
    }

    /**
     * Record a manual income or expense transaction.
     */
    public function recordTransaction(User $user, array $data): DailyTransaction
    {
        $tenantId = $user->tenant_id;

        if (isset($data['category_id'])) {
            $category = $this->categories->findForTenant($tenantId, $data['category_id']);

            if (! $category) {
                throw ValidationException::withMessages(['category_id' => ['The category was not found.']]);
            }

            $type = $category->type;
        } else {
            $type = $data['type'];
            $category = null;
        }

        $transaction = $this->transactions->create([
            'tenant_id' => $tenantId,
            'category_id' => $category?->id,
            'type' => $type,
            'amount' => $this->money((float) $data['amount']),
            'transaction_date' => Carbon::parse($data['transaction_date'] ?? now()->toDateString())->toDateString(),
            'description' => $data['description'] ?? null,
            'created_by' => $user->id,
        ]);

        AuditService::log($user, 'created', 'daily_transactions', 'daily_transaction', $transaction->id, null, [
            'type' => $transaction->type,
            'amount' => (float) $transaction->amount,
        ]);

        return $transaction;
    }
}
