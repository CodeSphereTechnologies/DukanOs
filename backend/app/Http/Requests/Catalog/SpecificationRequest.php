<?php

namespace App\Http\Requests\Catalog;

use App\Enums\ActiveStatus;
use App\Enums\SpecificationDataType;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class SpecificationRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash'],
            'data_type' => ['required', Rule::enum(SpecificationDataType::class)],
            'unit' => ['nullable', 'string', 'max:20'],
            'is_required' => ['sometimes', 'boolean'],
            'is_filterable' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'status' => ['required', Rule::enum(ActiveStatus::class)],
            'values' => ['sometimes', 'array'],
            'values.*' => ['required', 'string', 'max:255'],
        ];
    }
}
