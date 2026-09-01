<?php

namespace App\Http\Requests\Sales;

use App\Enums\PaymentMethod;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class QuotationConvertRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'payment_reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}
