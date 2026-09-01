<?php

namespace App\Http\Requests\Sales;

use App\Enums\QuotationStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class QuotationStatusRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(QuotationStatus::class)],
        ];
    }
}
