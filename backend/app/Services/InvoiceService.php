<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\User;
use App\Repositories\InvoiceRepository;
use App\Repositories\ProductRepository;
use App\Services\Concerns\PostsAccounting;
use App\Support\Pricing;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    use PostsAccounting;

    public function __construct(
        private readonly InvoiceRepository $invoices,
        private readonly ProductRepository $products,
        private readonly PaymentService $payments,
        private readonly NumberGenerator $numbers,
    ) {}

    /**
     * Create an invoice, deduct stock and (optionally) record the initial payment.
     */
    public function create(User $user, array $data): Invoice
    {
        $tenantId = $user->tenant_id;

        return DB::transaction(function () use ($tenantId, $user, $data) {
            $date = Carbon::parse($data['invoice_date'] ?? now()->toDateString());

            $items = $this->resolveItems($tenantId, $data['items']);

            $subtotal = 0.0;
            foreach ($items as $item) {
                $subtotal = $this->money($subtotal + $item['line_total']);
            }

            $discountAmount = Pricing::discountAmount(
                $data['discount_type'] ?? null,
                (float) ($data['discount_value'] ?? 0),
                $subtotal,
            );

            $total = $this->money($subtotal - $discountAmount);
            $amountPaid = $this->money(min((float) ($data['amount_paid'] ?? 0), $total));

            $invoice = Invoice::create([
                'tenant_id' => $tenantId,
                'customer_id' => $data['customer_id'] ?? null,
                'quotation_id' => $data['quotation_id'] ?? null,
                'invoice_number' => $this->numbers->next(Invoice::class, $tenantId, 'invoice_number', 'INV'),
                'invoice_date' => $date->toDateString(),
                'due_date' => isset($data['due_date']) ? Carbon::parse($data['due_date'])->toDateString() : null,
                'subtotal' => $subtotal,
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $this->money((float) ($data['discount_value'] ?? 0)),
                'discount_amount' => $discountAmount,
                'tax_amount' => 0,
                'total' => $total,
                'amount_paid' => 0,
                'balance_due' => $total,
                'payment_status' => PaymentStatus::Ledger->value,
                'status' => InvoiceStatus::Issued->value,
                'notes' => $data['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            foreach ($items as $item) {
                InvoiceItem::create([
                    'tenant_id' => $tenantId,
                    'invoice_id' => $invoice->id,
                    'product_id' => $item['product']->id,
                    'name' => $item['product']->name,
                    'sku' => $item['product']->sku,
                    'barcode' => $item['product']->barcode,
                    'quantity' => $item['quantity'],
                    'unit' => $item['product']->unit,
                    'unit_price' => $this->money($item['unit_price']),
                    'discount_type' => $item['discount_type'],
                    'discount_value' => $this->money($item['discount_value']),
                    'discount_amount' => $item['discount_amount'],
                    'line_total' => $item['line_total'],
                    'cost_price' => (float) $item['product']->purchase_cost,
                ]);

                $this->adjustStock(
                    $tenantId,
                    $item['product']->id,
                    -$item['quantity'],
                    $user->id,
                    Invoice::class,
                    $invoice->id,
                    'Sold on '.$invoice->invoice_number,
                );
            }

            if ($invoice->customer_id) {
                $this->postCustomerLedger(
                    $tenantId,
                    $invoice->customer_id,
                    'invoice',
                    $total,
                    0.0,
                    $date,
                    $user->id,
                    Invoice::class,
                    $invoice->id,
                    'Invoice '.$invoice->invoice_number,
                );
            }

            if ($amountPaid > 0) {
                $this->payments->createPayment(
                    $tenantId,
                    $invoice,
                    $invoice->customer_id,
                    $amountPaid,
                    $data['payment_method'] ?? 'cash',
                    $date,
                    $user->id,
                    $data['payment_reference'] ?? null,
                );
            }

            return $this->invoices->findForTenant($tenantId, $invoice->id);
        });
    }

    /**
     * Void an invoice, restoring stock for its items.
     */
    public function void(User $user, Invoice $invoice): Invoice
    {
        return DB::transaction(function () use ($user, $invoice) {
            if ($invoice->status === InvoiceStatus::Voided->value) {
                throw ValidationException::withMessages(['invoice' => ['The invoice is already voided.']]);
            }

            foreach ($invoice->items as $item) {
                if ($item->product_id) {
                    $this->adjustStock(
                        $user->tenant_id,
                        $item->product_id,
                        (float) $item->quantity,
                        $user->id,
                        Invoice::class,
                        $invoice->id,
                        'Restored on void of '.$invoice->invoice_number,
                    );
                }
            }

            $invoice->update([
                'status' => InvoiceStatus::Voided->value,
                'voided_at' => now(),
                'voided_by' => $user->id,
            ]);

            return $invoice->fresh(['customer', 'items', 'payments']);
        });
    }

    /**
     * Resolve and validate invoice line items.
     *
     * @return array<int, array<string, mixed>>
     */
    private function resolveItems(int $tenantId, array $items): array
    {
        if (empty($items)) {
            throw ValidationException::withMessages(['items' => ['At least one line item is required.']]);
        }

        $resolved = [];
        foreach ($items as $index => $input) {
            $product = Product::query()->find($input['product_id'] ?? 0);

            if (! $product || $product->tenant_id !== $tenantId) {
                throw ValidationException::withMessages(["items.{$index}.product_id" => ['The product was not found.']]);
            }

            if ($product->status !== 'active') {
                throw ValidationException::withMessages(["items.{$index}.product_id" => ['The product is not available for sale.']]);
            }

            $quantity = (float) $input['quantity'];

            $stock = $product->inventory ? (float) $product->inventory->quantity : 0.0;
            if ($stock < $quantity) {
                throw ValidationException::withMessages([
                    "items.{$index}.quantity" => ["Insufficient stock for {$product->name}. Available: {$stock}"],
                ]);
            }

            $unitPrice = isset($input['unit_price']) ? (float) $input['unit_price'] : (float) $product->selling_price;
            $discountType = $input['discount_type'] ?? null;
            $discountValue = (float) ($input['discount_value'] ?? 0);
            $gross = $this->money($unitPrice * $quantity);
            $discountAmount = Pricing::discountAmount($discountType, $discountValue, $gross);
            $lineTotal = $this->money($gross - $discountAmount);

            $resolved[] = [
                'product' => $product,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'discount_type' => $discountType,
                'discount_value' => $discountValue,
                'discount_amount' => $discountAmount,
                'line_total' => $lineTotal,
            ];
        }

        return $resolved;
    }
}
