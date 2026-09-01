<?php

namespace App\Services;

use App\Enums\QuotationStatus;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\User;
use App\Repositories\QuotationRepository;
use App\Services\Concerns\PostsAccounting;
use App\Support\Pricing;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuotationService
{
    use PostsAccounting;

    public function __construct(
        private readonly QuotationRepository $quotations,
        private readonly InvoiceService $invoices,
        private readonly NumberGenerator $numbers,
    ) {}

    /**
     * Create a non-financial quotation with line items.
     */
    public function create(User $user, array $data): Quotation
    {
        $tenantId = $user->tenant_id;

        return DB::transaction(function () use ($tenantId, $user, $data) {
            $date = Carbon::parse($data['quotation_date'] ?? now()->toDateString());

            $quotation = Quotation::create([
                'tenant_id' => $tenantId,
                'customer_id' => $data['customer_id'] ?? null,
                'quotation_number' => $this->numbers->next(Quotation::class, $tenantId, 'quotation_number', 'QUO'),
                'quotation_date' => $date->toDateString(),
                'valid_until' => isset($data['valid_until']) ? Carbon::parse($data['valid_until'])->toDateString() : null,
                'status' => $data['status'] ?? QuotationStatus::Draft->value,
                'notes' => $data['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            $subtotal = 0.0;
            foreach ($data['items'] as $index => $input) {
                $product = Product::query()->find($input['product_id'] ?? 0);

                if (! $product || $product->tenant_id !== $tenantId) {
                    throw ValidationException::withMessages(["items.{$index}.product_id" => ['The product was not found.']]);
                }

                $quantity = (float) $input['quantity'];
                $unitPrice = isset($input['unit_price']) ? (float) $input['unit_price'] : (float) $product->selling_price;
                $discountType = $input['discount_type'] ?? null;
                $discountValue = (float) ($input['discount_value'] ?? 0);
                $gross = $this->money($unitPrice * $quantity);
                $discountAmount = Pricing::discountAmount($discountType, $discountValue, $gross);
                $lineTotal = $this->money($gross - $discountAmount);

                QuotationItem::create([
                    'tenant_id' => $tenantId,
                    'quotation_id' => $quotation->id,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $quantity,
                    'unit' => $product->unit,
                    'unit_price' => $this->money($unitPrice),
                    'discount_type' => $discountType,
                    'discount_value' => $this->money($discountValue),
                    'discount_amount' => $discountAmount,
                    'line_total' => $lineTotal,
                ]);

                $subtotal = $this->money($subtotal + $lineTotal);
            }

            $discountAmount = Pricing::discountAmount(
                $data['discount_type'] ?? null,
                (float) ($data['discount_value'] ?? 0),
                $subtotal,
            );

            $quotation->update([
                'subtotal' => $subtotal,
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $this->money((float) ($data['discount_value'] ?? 0)),
                'discount_amount' => $discountAmount,
                'total' => $this->money($subtotal - $discountAmount),
            ]);

            return $this->quotations->findForTenant($tenantId, $quotation->id);
        });
    }

    /**
     * Update a quotation's status.
     */
    public function updateStatus(User $user, Quotation $quotation, string $status): Quotation
    {
        if ($quotation->status === QuotationStatus::Converted->value) {
            throw ValidationException::withMessages(['status' => ['A converted quotation cannot change status.']]);
        }

        $quotation->update(['status' => $status]);

        return $quotation;
    }

    /**
     * Convert a quotation into a financial invoice.
     */
    public function convert(User $user, Quotation $quotation, array $payment = []): Invoice
    {
        if ($quotation->status === QuotationStatus::Converted->value) {
            throw ValidationException::withMessages(['quotation' => ['The quotation is already converted.']]);
        }

        $items = $quotation->items->map(fn ($item) => [
            'product_id' => $item->product_id,
            'quantity' => (float) $item->quantity,
            'unit_price' => (float) $item->unit_price,
            'discount_type' => $item->discount_type,
            'discount_value' => (float) $item->discount_value,
        ])->all();

        $invoice = $this->invoices->create($user, [
            'customer_id' => $quotation->customer_id,
            'quotation_id' => $quotation->id,
            'invoice_date' => now()->toDateString(),
            'discount_type' => $quotation->discount_type,
            'discount_value' => (float) $quotation->discount_value,
            'items' => $items,
            'notes' => $quotation->notes,
            ...$payment,
        ]);

        $quotation->update(['status' => QuotationStatus::Converted->value]);

        return $invoice;
    }
}
