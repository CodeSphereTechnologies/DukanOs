<?php

namespace App\Http\Requests\Sales;

use App\Enums\PaymentMethod;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class PaymentRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_id' => ['nullable', 'integer', Rule::exists('invoices', 'id')->where('tenant_id', $this->tenantId())],
            'customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $this->tenantId())],
            'amount' => ['required', 'numeric', 'gt:0'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'payment_date' => ['nullable', 'date'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
