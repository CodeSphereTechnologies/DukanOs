<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'designation' => $this->designation,
            'salary' => (float) $this->salary,
            'joining_date' => $this->joining_date?->toDateString(),
            'address' => $this->address,
            'status' => $this->status,
            'user_id' => $this->user_id,
        ];
    }
}
