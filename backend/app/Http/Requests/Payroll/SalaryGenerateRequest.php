<?php

namespace App\Http\Requests\Payroll;

use App\Http\Requests\ApiRequest;

class SalaryGenerateRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer'],
            'period' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'bonus' => ['nullable', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
