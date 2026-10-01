<?php

namespace App\Services;

use App\Enums\ReturnStatus;
use App\Models\DailyTransaction;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\LedgerCategory;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\User;
use App\Repositories\InvoiceRepository;
use App\Repositories\SaleReturnRepository;
use App\Services\Concerns\PostsAccounting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleReturnService
{
    use PostsAccounting;

    public function __construct(
        private readonly InvoiceRepository $invoices,
        private readonly SaleReturnRepository $returns,
        private readonly NumberGenerator $numbers,
    ) {}

    public function create(User $user, array $data): SaleReturn
    {
        $tenantId = $user->tenant_id;

        return DB::transaction(function () use ($tenantId, $user, $data) {
            $invoice = $this->invoices->findForTenant($tenantId, $data['invoice_id']);

            if (! $invoice) {
                throw ValidationException::withMessages(['invoice_id' => ['The invoice was not found.']]);
            }

            $date = Carbon::parse($data['return_date'] ?? now()->toDateString());
            $resolved = $this->resolveItems($invoice, $data['items']);
            $refundType = $data['refund_type'] ?? 'credit';

            $total = 0.0;
            foreach ($resolved as $item) {
                $total = $this->money($total + $item['amount']);
            }

            $saleReturn = SaleReturn::create([
                'tenant_id' => $tenantId,
                'invoice_id' => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'return_number' => $this->numbers->next(SaleReturn::class, $tenantId, 'return_number', 'RET'),
                'return_date' => $date->toDateString(),
                'reason' => $data['reason'] ?? null,
                'refund_type' => $refundType,
                'total_amount' => $total,
                'status' => ReturnStatus::Completed->value,
                'notes' => $data['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            foreach ($resolved as $item) {
                SaleReturnItem::create([
                    'tenant_id' => $tenantId,
                    'return_id' => $saleReturn->id,
                    'invoice_item_id' => $item['invoice_item']->id,
                    'product_id' => $item['invoice_item']->product_id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $this->money($item['unit_price']),
                    'amount' => $item['amount'],
                    'reason' => $item['reason'],
                ]);

                if ($item['invoice_item']->product_id) {
                    $this->adjustStock(
                        $tenantId,
                        $item['invoice_item']->product_id,
                        $item['quantity'],
                        $user->id,
                        SaleReturn::class,
                        $saleReturn->id,
                        'Restored on return '.$saleReturn->return_number,
                    );
                }
            }

            if ($invoice->customer_id) {
                // 1. Credit the customer ledger for the returned goods (we owe them)
                $this->postCustomerLedger(
                    $tenantId,
                    $invoice->customer_id,
                    'return',
                    0.0,
                    $total,
                    $date,
                    $user->id,
                    SaleReturn::class,
                    $saleReturn->id,
                    'Goods Returned '.$saleReturn->return_number,
                );

                // 2. If paid out instantly via cash or bank, debit the ledger to net it to zero!
                if (in_array($refundType, ['cash', 'bank_transfer'])) {
                    $this->postCustomerLedger(
                        $tenantId,
                        $invoice->customer_id,
                        'payment', // A payout/refund payment
                        $total,
                        0.0,
                        $date,
                        $user->id,
                        SaleReturn::class,
                        $saleReturn->id,
                        ucfirst(str_replace('_', ' ', $refundType)).' Refund for '.$saleReturn->return_number,
                    );
                }
            }

            if (in_array($refundType, ['cash', 'bank_transfer'])) {
                $this->postCashRefund($tenantId, $total, $date, $user->id, $saleReturn, $refundType);
            }

            return $this->returns->findForTenant($tenantId, $saleReturn->id);
        });
    }

    private function resolveItems(Invoice $invoice, array $items): array
    {
        if (empty($items)) {
            throw ValidationException::withMessages(['items' => ['At least one return item is required.']]);
        }

        $resolved = [];
        foreach ($items as $index => $input) {
            $invoiceItem = InvoiceItem::query()
                ->where('invoice_id', $invoice->id)
                ->find($input['invoice_item_id'] ?? 0);

            if (! $invoiceItem) {
                throw ValidationException::withMessages(["items.{$index}.invoice_item_id" => ['The line item does not belong to this invoice.']]);
            }

            $quantity = (float) $input['quantity'];
            $alreadyReturned = (float) SaleReturnItem::query()
                ->where('invoice_item_id', $invoiceItem->id)
                ->sum('quantity');

            $available = (float) $invoiceItem->quantity - $alreadyReturned;

            if ($quantity > $available) {
                throw ValidationException::withMessages([
                    "items.{$index}.quantity" => ["Cannot return more than the available quantity ({$available})."],
                ]);
            }

            $resolved[] = [
                'invoice_item' => $invoiceItem,
                'quantity' => $quantity,
                'unit_price' => (float) $invoiceItem->unit_price,
                'amount' => $this->money((float) $invoiceItem->unit_price * $quantity),
                'reason' => $input['reason'] ?? null,
            ];
        }

        return $resolved;
    }

    private function postCashRefund(int $tenantId, float $amount, Carbon $date, ?int $userId, SaleReturn $saleReturn, string $refundType): void
    {
        $categoryName = $refundType === 'bank_transfer' ? 'Bank Refunds' : 'Cash Refunds';
        
        $category = LedgerCategory::query()
            ->where('tenant_id', $tenantId)
            ->where('type', 'expense')
            ->where('name', $categoryName)
            ->first();

        if (! $category) {
            $category = LedgerCategory::create([
                'tenant_id' => $tenantId,
                'type' => 'expense',
                'name' => $categoryName,
                'is_system' => false,
                'status' => 'active',
            ]);
        }

        DailyTransaction::create([
            'tenant_id' => $tenantId,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => $this->money($amount),
            'transaction_date' => $date->toDateString(),
            'description' => $categoryName.' on return '.$saleReturn->return_number,
            'reference_type' => SaleReturn::class,
            'reference_id' => $saleReturn->id,
            'created_by' => $userId,
        ]);
    }
}
