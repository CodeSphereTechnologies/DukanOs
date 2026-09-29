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

            // Owner credentials. All-or-nothing: a store with no owner account
            // cannot be logged into, so a partial pair is rejected up front
            // rather than leaving an unusable store behind.
            'owner_name' => ['nullable', 'required_with:owner_email', 'string', 'max:255'],
            'owner_email' => [
                'nullable',
                'required_with:owner_name',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'owner_password' => ['nullable', 'required_with:owner_email', 'string', 'min:8', 'confirmed'],
        ];
    }
}
