<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalaryRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'period' => $this->period,
            'base_salary' => (float) $this->base_salary,
            'bonus' => (float) $this->bonus,
            'deductions' => (float) $this->deductions,
            'net_salary' => (float) $this->net_salary,
            'status' => $this->status,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,
            'employee' => $this->whenLoaded('employee', fn () => new EmployeeResource($this->employee)),
        ];
    }
}
