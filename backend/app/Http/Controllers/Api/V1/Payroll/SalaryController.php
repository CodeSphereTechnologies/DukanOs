<?php

namespace App\Http\Controllers\Api\V1\Payroll;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Payroll\SalaryGenerateRequest;
use App\Http\Requests\Payroll\SalaryMarkPaidRequest;
use App\Http\Resources\SalaryRecordResource;
use App\Repositories\SalaryRecordRepository;
use App\Services\PayrollService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryController extends Controller
{
    public function __construct(
        private readonly SalaryRecordRepository $salaries,
        private readonly PayrollService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $records = $this->salaries->paginateForTenant(
            $this->tenantId(),
            $request->integer('per_page', 25),
            $request->integer('employee_id') ?: null,
            $request->query('status'),
        );

        return $this->success(SalaryRecordResource::collection($records)->response()->getData(true), 'Salary records retrieved.');
    }

    public function generate(SalaryGenerateRequest $request): JsonResponse
    {
        $record = $this->service->generateSalary($request->user(), $request->validated());

        return $this->created(new SalaryRecordResource($record->load('employee')), 'Salary record generated.');
    }

    public function markPaid(SalaryMarkPaidRequest $request, $salary): JsonResponse
    {
        $record = $this->findOrFail($this->salaries->findForTenant($this->tenantId(), $salary));

        $updated = $this->service->markPaid($request->user(), $record, $request->validated());

        return $this->success(new SalaryRecordResource($updated), 'Salary marked as paid.');
    }
}
