<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'quantity' => (float) $this->quantity,
            'min_quantity_threshold' => (float) $this->min_quantity_threshold,
            'is_low_stock' => (float) $this->quantity <= (float) $this->min_quantity_threshold,
            'product' => $this->whenLoaded('product', fn () => new ProductResource($this->product)),
        ];
    }
}
