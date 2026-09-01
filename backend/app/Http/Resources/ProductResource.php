<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'model_number' => $this->model_number,
            'description' => $this->description,
            'unit' => $this->unit,
            'purchase_cost' => (float) $this->purchase_cost,
            'selling_price' => (float) $this->selling_price,
            'min_selling_price' => $this->min_selling_price !== null ? (float) $this->min_selling_price : null,
            'image' => $this->image,
            'status' => $this->status,
            'category' => $this->whenLoaded('category', fn () => new CategoryResource($this->category)),
            'brand' => $this->whenLoaded('brand', fn () => new BrandResource($this->brand)),
            'inventory' => $this->whenLoaded('inventory', fn () => [
                'quantity' => (float) $this->inventory->quantity,
                'min_quantity_threshold' => (float) $this->inventory->min_quantity_threshold,
            ]),
            'specifications' => $this->whenLoaded('specificationValues', function () {
                return $this->specificationValues->map(fn ($sv) => [
                    'id' => $sv->specification->id,
                    'name' => $sv->specification->name,
                    'slug' => $sv->specification->slug,
                    'unit' => $sv->specification->unit,
                    'value' => $sv->specificationValue?->value ?? $sv->value,
                ]);
            }),
        ];
    }
}
