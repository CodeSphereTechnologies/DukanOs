<?php

namespace App\Http\Requests\Catalog;

use App\Enums\ActiveStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends ApiRequest
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
            'description' => ['nullable', 'string'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('tenant_id', $this->tenantId()),
            ],
            'sort_order' => ['nullable', 'integer'],
            'status' => ['required', Rule::enum(ActiveStatus::class)],
        ];
    }
}
