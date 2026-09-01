<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Http\Controllers\Api\V1\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reports) {}

    public function dashboard(): JsonResponse
    {
        return $this->success($this->reports->dashboard($this->tenantId()), 'Dashboard metrics retrieved.');
    }

    public function sales(Request $request): JsonResponse
    {
        return $this->success(
            $this->reports->sales($this->tenantId(), $request->query('from'), $request->query('to'), $request->query('group_by', 'daily')),
            'Sales report retrieved.',
        );
    }

    public function financial(Request $request): JsonResponse
    {
        return $this->success(
            $this->reports->financial($this->tenantId(), $request->query('from'), $request->query('to')),
            'Financial report retrieved.',
        );
    }

    public function inventory(): JsonResponse
    {
        return $this->success($this->reports->inventory($this->tenantId()), 'Inventory report retrieved.');
    }

    public function customerBalances(): JsonResponse
    {
        return $this->success($this->reports->customerBalances($this->tenantId()), 'Outstanding customer balances retrieved.');
    }
}
