<?php

namespace App\Http\Requests\Payroll;

use App\Enums\PaymentMethod;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class SalaryMarkPaidRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'paid_at' => ['nullable', 'date'],
        ];
    }
}
