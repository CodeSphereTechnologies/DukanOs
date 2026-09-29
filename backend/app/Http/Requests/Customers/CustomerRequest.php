<?php

namespace App\Http\Requests\Customers;

use App\Enums\ActiveStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class CustomerRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'opening_balance' => ['nullable', 'numeric', 'min:0'],
            // Only meaningful on update: the outstanding balance to leave the
            // ledger at. Recorded as a correcting entry, not an overwrite.
            'current_balance' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', Rule::enum(ActiveStatus::class)],
        ];
    }
}
