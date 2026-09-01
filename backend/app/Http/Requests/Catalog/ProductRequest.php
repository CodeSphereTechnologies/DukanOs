<?php

namespace App\Http\Requests\Catalog;

use App\Enums\ProductStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100'],
            'barcode' => ['nullable', 'string', 'max:100'],
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('tenant_id', $this->tenantId()),
            ],
            'brand_id' => [
                'nullable',
                'integer',
                Rule::exists('brands', 'id')->where('tenant_id', $this->tenantId()),
            ],
            'model_number' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'unit' => ['nullable', 'string', 'max:20'],
            'purchase_cost' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'min_selling_price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', Rule::enum(ProductStatus::class)],
            'opening_quantity' => ['nullable', 'numeric', 'min:0'],
            'min_quantity_threshold' => ['nullable', 'numeric', 'min:0'],
            'specifications' => ['sometimes', 'array'],
            'specifications.*.specification_id' => ['required', 'integer', Rule::exists('specifications', 'id')],
            'specifications.*.specification_value_id' => ['nullable', 'integer', Rule::exists('specification_values', 'id')],
            'specifications.*.value' => ['nullable', 'string', 'max:255'],
        ];
    }
}
