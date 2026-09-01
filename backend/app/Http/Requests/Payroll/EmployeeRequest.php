<?php

namespace App\Http\Requests\Payroll;

use App\Enums\ActiveStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class EmployeeRequest extends ApiRequest
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
            'designation' => ['required', 'string', 'max:100'],
            'salary' => ['required', 'numeric', 'min:0'],
            'joining_date' => ['required', 'date'],
            'address' => ['nullable', 'string'],
            'status' => ['required', Rule::enum(ActiveStatus::class)],
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('tenant_id', $this->tenantId())],
        ];
    }
}
