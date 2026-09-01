<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'notes' => $this->notes,
            'opening_balance' => (float) $this->opening_balance,
            'status' => $this->status,
            'balance' => $this->when(
                $this->resource->getAttribute('balance') !== null,
                fn () => (float) $this->resource->getAttribute('balance'),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
