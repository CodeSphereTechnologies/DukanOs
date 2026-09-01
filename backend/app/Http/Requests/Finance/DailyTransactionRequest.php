<?php

namespace App\Http\Requests\Finance;

use App\Enums\LedgerType;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class DailyTransactionRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('ledger_categories', 'id')->where('tenant_id', $this->tenantId()),
            ],
            'type' => ['required_without:category_id', Rule::enum(LedgerType::class)],
            'amount' => ['required', 'numeric', 'gt:0'],
            'transaction_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
