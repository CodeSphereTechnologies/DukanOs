<?php

namespace App\Http\Requests\Admin;

use App\Enums\ActiveStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class UserStoreRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isSuperAdmin = (bool) $this->user()?->isSuperAdmin();

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['nullable', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in(['owner', 'manager', 'cashier', 'accountant'])],
            'status' => ['required', Rule::enum(ActiveStatus::class)],
            // Super admins have no tenant of their own, so they must pick the
            // store the staff member belongs to. Store users may not send it.
            'tenant_id' => [
                $isSuperAdmin ? 'required' : 'prohibited',
                'integer',
                Rule::exists('tenants', 'id'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'tenant_id.required' => 'Select the store this staff member belongs to.',
            'tenant_id.prohibited' => 'You cannot choose a store; staff are created inside your own store.',
        ];
    }
}
