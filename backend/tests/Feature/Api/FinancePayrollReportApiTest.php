<?php

namespace Tests\Feature\Api;

use App\Models\SalaryRecord;

class FinancePayrollReportApiTest extends ApiTestCase
{
    public function test_accountant_can_manage_ledger_categories(): void
    {
        $response = $this->withToken($this->token($this->accountant))->postJson('/api/v1/ledger-categories', [
            'type' => 'expense',
            'name' => 'Internet Bill',
            'status' => 'active',
        ]);

        $response->assertCreated()->assertJsonPath('data.type', 'expense');
    }

    public function test_record_expense_transaction(): void
    {
        $this->withToken($this->token($this->accountant))->postJson('/api/v1/daily-transactions', [
            'type' => 'expense',
            'amount' => 5000,
            'description' => 'Shop rent',
        ])->assertCreated()->assertJsonPath('data.amount', 5000);
    }

    public function test_cashier_cannot_access_financial_reports(): void
    {
        $this->withToken($this->token($this->cashier))->getJson('/api/v1/reports/financial')->assertForbidden();
    }

    public function test_accountant_can_view_financial_reports(): void
    {
        $this->withToken($this->token($this->accountant))->getJson('/api/v1/reports/financial')
            ->assertOk()
            ->assertJsonStructure(['data' => ['income', 'expense', 'net', 'payments', 'outstanding']]);
    }

    public function test_owner_can_manage_employees_and_generate_salary(): void
    {
        $employee = $this->withToken($this->token($this->owner))->postJson('/api/v1/employees', [
            'name' => 'Kamran Khan',
            'designation' => 'Salesman',
            'salary' => 25000,
            'joining_date' => '2025-01-15',
            'status' => 'active',
        ])->assertCreated();

        $employeeId = $employee->json('data.id');

        $salary = $this->withToken($this->token($this->owner))->postJson('/api/v1/salary-records', [
            'employee_id' => $employeeId,
            'period' => '2026-09',
            'bonus' => 1000,
            'deductions' => 500,
        ])->assertCreated()->assertJsonPath('data.net_salary', 25500);

        $recordId = $salary->json('data.id');

        $this->withToken($this->token($this->owner))->patchJson("/api/v1/salary-records/{$recordId}/mark-paid", [
            'payment_method' => 'bank_transfer',
        ])->assertOk()->assertJsonPath('data.status', 'paid');

        $this->assertEquals('paid', SalaryRecord::find($recordId)->status);
    }

    public function test_dashboard_report(): void
    {
        $this->withToken($this->token($this->owner))->getJson('/api/v1/reports/dashboard')
            ->assertOk()
            ->assertJsonStructure(['data' => ['total_sales', 'total_invoices', 'outstanding', 'today_sales']]);
    }
}
