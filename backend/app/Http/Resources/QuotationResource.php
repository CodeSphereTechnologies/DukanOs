<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuotationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quotation_number' => $this->quotation_number,
            'quotation_date' => $this->quotation_date?->toDateString(),
            'valid_until' => $this->valid_until?->toDateString(),
            'subtotal' => (float) $this->subtotal,
            'discount_type' => $this->discount_type,
            'discount_value' => (float) $this->discount_value,
            'discount_amount' => (float) $this->discount_amount,
            'total' => (float) $this->total,
            'status' => $this->status,
            'notes' => $this->notes,
            'customer' => $this->whenLoaded('customer', fn () => new CustomerResource($this->customer)),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($i) => [
                'id' => $i->id,
                'product_id' => $i->product_id,
                'name' => $i->name,
                'sku' => $i->sku,
                'quantity' => (float) $i->quantity,
                'unit' => $i->unit,
                'unit_price' => (float) $i->unit_price,
                'discount_amount' => (float) $i->discount_amount,
                'line_total' => (float) $i->line_total,
            ])),
            'invoice_id' => $this->whenLoaded('invoice', fn () => $this->invoice?->id),
            'created_by' => $this->whenLoaded('creator', fn () => $this->creator?->name),
        ];
    }
}
