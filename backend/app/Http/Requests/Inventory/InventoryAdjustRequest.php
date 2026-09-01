<?php

namespace App\Http\Requests\Inventory;

use App\Http\Requests\ApiRequest;

class InventoryAdjustRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'delta' => ['required', 'numeric', 'not_in:0'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
