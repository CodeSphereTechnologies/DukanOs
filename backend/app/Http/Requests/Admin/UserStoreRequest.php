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
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in(['owner', 'manager', 'cashier', 'accountant'])],
            'status' => ['required', Rule::enum(ActiveStatus::class)],
        ];
    }
}
