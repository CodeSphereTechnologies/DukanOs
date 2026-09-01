<?php

namespace App\Http\Controllers\Api\V1\Payroll;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Payroll\EmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Repositories\EmployeeRepository;
use App\Services\PayrollService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(
        private readonly EmployeeRepository $employees,
        private readonly PayrollService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $employees = $this->employees->paginateForTenant($this->tenantId(), $request->integer('per_page', 25), $request->query('search'));

        return $this->success(EmployeeResource::collection($employees)->response()->getData(true), 'Employees retrieved.');
    }

    public function store(EmployeeRequest $request): JsonResponse
    {
        $employee = $this->service->createEmployee($request->user(), $request->validated());

        return $this->created(new EmployeeResource($employee), 'Employee created.');
    }

    public function show($employee): JsonResponse
    {
        $model = $this->findOrFail($this->employees->findForTenant($this->tenantId(), $employee));

        return $this->success(new EmployeeResource($model), 'Employee retrieved.');
    }

    public function update(EmployeeRequest $request, $employee): JsonResponse
    {
        $model = $this->findOrFail($this->employees->findForTenant($this->tenantId(), $employee));

        return $this->success(new EmployeeResource($this->service->updateEmployee($request->user(), $model, $request->validated())), 'Employee updated.');
    }

    public function destroy($employee): JsonResponse
    {
        $model = $this->findOrFail($this->employees->findForTenant($this->tenantId(), $employee));

        $this->service->deleteEmployee(request()->user(), $model);

        return $this->deleted('Employee deleted.');
    }
}
