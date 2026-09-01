<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SpecificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'data_type' => $this->data_type,
            'unit' => $this->unit,
            'is_required' => (bool) $this->is_required,
            'is_filterable' => (bool) $this->is_filterable,
            'sort_order' => (int) $this->sort_order,
            'status' => $this->status,
            'values' => $this->whenLoaded('values', fn () => $this->values->map(fn ($v) => [
                'id' => $v->id,
                'value' => $v->value,
                'sort_order' => (int) $v->sort_order,
            ])),
        ];
    }
}
