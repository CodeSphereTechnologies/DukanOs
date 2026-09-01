<?php

namespace App\Http\Requests\Admin;

use App\Enums\TenantStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class TenantRequest extends ApiRequest
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
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'currency' => ['nullable', 'string', 'max:3'],
            'timezone' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::enum(TenantStatus::class)],
            'settings' => ['nullable', 'array'],
        ];
    }
}
