<?php

namespace App\Http\Requests\Sales;

use App\Enums\DiscountType;
use App\Enums\QuotationStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class QuotationRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $this->tenantId())],
            'quotation_date' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date'],
            'status' => ['nullable', Rule::enum(QuotationStatus::class)],
            'notes' => ['nullable', 'string'],
            'discount_type' => ['nullable', Rule::enum(DiscountType::class)],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount_type' => ['nullable', Rule::enum(DiscountType::class)],
            'items.*.discount_value' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
