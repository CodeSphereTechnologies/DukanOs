<?php

namespace App\Http\Requests\Admin;

use App\Enums\TenantStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class TenantStatusRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(TenantStatus::class)],
        ];
    }
}
