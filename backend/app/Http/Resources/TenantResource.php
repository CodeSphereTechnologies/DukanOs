<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'logo' => $this->logo,
            'currency' => $this->currency,
            'timezone' => $this->timezone,
            'status' => $this->status,
            'settings' => $this->settings,
            'users_count' => $this->whenCounted('users'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
