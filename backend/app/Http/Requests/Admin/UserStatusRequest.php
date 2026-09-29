<?php

namespace App\Http\Requests\Admin;

use App\Enums\ActiveStatus;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class UserStatusRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ActiveStatus::class)],
        ];
    }
}
