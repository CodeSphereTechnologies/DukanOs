<?php

namespace App\Services;

use App\Enums\SalaryStatus;
use App\Models\DailyTransaction;
use App\Models\Employee;
use App\Models\LedgerCategory;
use App\Models\SalaryRecord;
use App\Models\User;
use App\Repositories\EmployeeRepository;
use App\Repositories\SalaryRecordRepository;
use App\Services\Concerns\PostsAccounting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PayrollService
{
    use PostsAccounting;

    public function __construct(
        private readonly EmployeeRepository $employees,
        private readonly SalaryRecordRepository $salaries,
    ) {}

    public function createEmployee(User $user, array $data): Employee
    {
        $employee = $this->employees->create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $data['user_id'] ?? null,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'designation' => $data['designation'],
            'salary' => (float) $data['salary'],
            'joining_date' => Carbon::parse($data['joining_date'])->toDateString(),
            'address' => $data['address'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::log($user, 'created', 'employees', 'employee', $employee->id, null, $employee->only(['name', 'designation']));

        return $employee;
    }

    public function updateEmployee(User $user, Employee $employee, array $data): Employee
    {
        $old = $employee->only(['name', 'designation', 'salary']);

        $employee->update([
            'user_id' => $data['user_id'] ?? $employee->user_id,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? $employee->phone,
            'email' => $data['email'] ?? $employee->email,
            'designation' => $data['designation'],
            'salary' => (float) $data['salary'],
            'joining_date' => isset($data['joining_date']) ? Carbon::parse($data['joining_date'])->toDateString() : $employee->joining_date,
            'address' => $data['address'] ?? $employee->address,
            'status' => $data['status'] ?? $employee->status,
        ]);

        AuditService::log($user, 'updated', 'employees', 'employee', $employee->id, $old, $employee->only(['name', 'designation', 'salary']));

        return $employee;
    }

    public function deleteEmployee(User $user, Employee $employee): void
    {
        AuditService::log($user, 'deleted', 'employees', 'employee', $employee->id, $employee->only(['name', 'designation']), null);
        $this->employees->delete($employee);
    }

    /**
     * Generate a salary record for a period.
     */
    public function generateSalary(User $user, array $data): SalaryRecord
    {
        $tenantId = $user->tenant_id;
        $employee = $this->employees->findForTenant($tenantId, $data['employee_id']);

        if (! $employee) {
            throw ValidationException::withMessages(['employee_id' => ['The employee was not found.']]);
        }

        $period = $data['period'];
        if ($this->salaries->findForEmployeeAndPeriod($tenantId, $employee->id, $period)) {
            throw ValidationException::withMessages(['period' => ['A salary record already exists for this period.']]);
        }

        $base = (float) $employee->salary;
        $bonus = (float) ($data['bonus'] ?? 0);
        $deductions = (float) ($data['deductions'] ?? 0);
        $net = $this->money($base + $bonus - $deductions);

        return $this->salaries->create([
            'tenant_id' => $tenantId,
            'employee_id' => $employee->id,
            'period' => $period,
            'base_salary' => $base,
            'bonus' => $bonus,
            'deductions' => $deductions,
            'net_salary' => $net,
            'status' => SalaryStatus::Pending->value,
            'notes' => $data['notes'] ?? null,
            'created_by' => $user->id,
        ]);
    }

    /**
     * Mark a salary record as paid and post the expense.
     */
    public function markPaid(User $user, SalaryRecord $salary, array $data): SalaryRecord
    {
        $tenantId = $user->tenant_id;

        return DB::transaction(function () use ($tenantId, $user, $salary, $data) {
            if ($salary->status === SalaryStatus::Paid->value) {
                throw ValidationException::withMessages(['salary' => ['This salary has already been paid.']]);
            }

            $paidAt = isset($data['paid_at']) ? Carbon::parse($data['paid_at']) : now();
            $method = $data['payment_method'] ?? 'bank_transfer';

            $salary->update([
                'status' => SalaryStatus::Paid->value,
                'paid_at' => $paidAt,
                'payment_method' => $method,
            ]);

            $category = LedgerCategory::query()
                ->where('tenant_id', $tenantId)
                ->where('type', 'expense')
                ->where('name', 'Salaries')
                ->first();

            if ($category) {
                DailyTransaction::create([
                    'tenant_id' => $tenantId,
                    'category_id' => $category->id,
                    'type' => 'expense',
                    'amount' => (float) $salary->net_salary,
                    'transaction_date' => $paidAt->toDateString(),
                    'description' => 'Salary of '.$salary->employee->name.' for '.$salary->period,
                    'reference_type' => SalaryRecord::class,
                    'reference_id' => $salary->id,
                    'created_by' => $user->id,
                ]);
            }

            AuditService::log($user, 'updated', 'payroll', 'salary_record', $salary->id, null, ['status' => SalaryStatus::Paid->value]);

            return $salary->fresh(['employee']);
        });
    }
}
