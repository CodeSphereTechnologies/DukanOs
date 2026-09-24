<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'return_number' => $this->return_number,
            'return_date' => $this->return_date?->toDateString(),
            'reason' => $this->reason,
            'refund_type' => $this->refund_type,
            'total_amount' => (float) $this->total_amount,
            'status' => $this->status,
            'notes' => $this->notes,
            'customer' => $this->whenLoaded('customer', fn () => new CustomerResource($this->customer)),
            'invoice' => $this->whenLoaded('invoice', fn () => new InvoiceResource($this->invoice)),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($i) => [
                'id' => $i->id,
                'product_id' => $i->product_id, 'product_name' => $i->product?->name, 'invoice_item_id' => $i->invoice_item_id,
                'quantity' => (float) $i->quantity,
                'unit_price' => (float) $i->unit_price,
                'amount' => (float) $i->amount,
                'reason' => $i->reason,
            ])),
            'created_by' => $this->whenLoaded('creator', fn () => $this->creator?->name),
        ];
    }
}
