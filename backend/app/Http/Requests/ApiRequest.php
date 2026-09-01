<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class ApiRequest extends FormRequest
{
    /**
     * The tenant id of the authenticated user (null for super admin).
     */
    protected function tenantId(): ?int
    {
        return $this->user()?->tenant_id;
    }
}
