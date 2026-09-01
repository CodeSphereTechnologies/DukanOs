<?php

namespace App\Http\Requests\Admin;

use App\Enums\ActiveStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'password' => ['nullable', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['nullable', Rule::in(['owner', 'manager', 'cashier', 'accountant'])],
            'status' => ['required', Rule::enum(ActiveStatus::class)],
        ];
    }
}
