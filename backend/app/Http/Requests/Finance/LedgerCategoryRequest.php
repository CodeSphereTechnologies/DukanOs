<?php

namespace App\Http\Requests\Finance;

use App\Enums\ActiveStatus;
use App\Enums\LedgerType;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class LedgerCategoryRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(LedgerType::class)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::enum(ActiveStatus::class)],
        ];
    }
}
