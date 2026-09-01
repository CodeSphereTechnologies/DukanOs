<?php

namespace App\Http\Requests\Sales;

use App\Enums\RefundType;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class SaleReturnRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_id' => ['required', 'integer', Rule::exists('invoices', 'id')->where('tenant_id', $this->tenantId())],
            'return_date' => ['nullable', 'date'],
            'reason' => ['nullable', 'string'],
            'refund_type' => ['required', Rule::enum(RefundType::class)],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.invoice_item_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
