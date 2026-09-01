<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerLedger;
use App\Models\DailyTransaction;
use App\Models\Inventory;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Support\Carbon;

class ReportService
{
    /**
     * Dashboard overview metrics for a tenant.
     */
    public function dashboard(int $tenantId): array
    {
        $today = Carbon::today();

        return [
            'total_sales' => $this->money((float) Invoice::where('tenant_id', $tenantId)->where('status', 'issued')->sum('total')),
            'total_invoices' => Invoice::where('tenant_id', $tenantId)->where('status', 'issued')->count(),
            'outstanding' => $this->money((float) Invoice::where('tenant_id', $tenantId)->where('status', 'issued')->sum('balance_due')),
            'today_sales' => $this->money((float) Invoice::where('tenant_id', $tenantId)->where('status', 'issued')->whereDate('invoice_date', $today)->sum('total')),
            'today_invoices' => Invoice::where('tenant_id', $tenantId)->where('status', 'issued')->whereDate('invoice_date', $today)->count(),
            'total_customers' => Customer::where('tenant_id', $tenantId)->count(),
            'total_products' => Product::where('tenant_id', $tenantId)->count(),
            'low_stock_count' => Inventory::where('tenant_id', $tenantId)->whereColumn('quantity', '<=', 'min_quantity_threshold')->count(),
            'month_income' => $this->money((float) DailyTransaction::where('tenant_id', $tenantId)->where('type', 'income')->whereMonth('transaction_date', now()->month)->sum('amount')),
            'month_expense' => $this->money((float) DailyTransaction::where('tenant_id', $tenantId)->where('type', 'expense')->whereMonth('transaction_date', now()->month)->sum('amount')),
        ];
    }

    /**
     * Sales totals with optional daily/monthly breakdown.
     */
    public function sales(int $tenantId, ?string $from = null, ?string $to = null, string $groupBy = 'daily'): array
    {
        $query = Invoice::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'issued')
            ->when($from, fn ($q) => $q->whereDate('invoice_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('invoice_date', '<=', $to));

        $totals = (clone $query)
            ->selectRaw('COUNT(*) as invoices, COALESCE(SUM(total),0) as sales, COALESCE(SUM(balance_due),0) as outstanding')
            ->first();

        $series = (clone $query)
            ->get(['invoice_date', 'total'])
            ->groupBy(fn ($i) => $groupBy === 'monthly'
                ? $i->invoice_date->format('Y-m')
                : $i->invoice_date->format('Y-m-d'))
            ->map(fn ($group, $period) => [
                'period' => $period,
                'invoices' => $group->count(),
                'sales' => $this->money($group->sum(fn ($i) => (float) $i->total)),
            ])
            ->sortKeys()
            ->values();

        return [
            'summary' => [
                'invoices' => (int) $totals->invoices,
                'sales' => $this->money((float) $totals->sales),
                'outstanding' => $this->money((float) $totals->outstanding),
            ],
            'series' => $series,
        ];
    }

    /**
     * Financial summary: income, expenses, payments, outstanding balances.
     */
    public function financial(int $tenantId, ?string $from = null, ?string $to = null): array
    {
        $income = DailyTransaction::where('tenant_id', $tenantId)->where('type', 'income')
            ->when($from, fn ($q) => $q->whereDate('transaction_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('transaction_date', '<=', $to))
            ->sum('amount');

        $expense = DailyTransaction::where('tenant_id', $tenantId)->where('type', 'expense')
            ->when($from, fn ($q) => $q->whereDate('transaction_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('transaction_date', '<=', $to))
            ->sum('amount');

        $payments = Payment::where('tenant_id', $tenantId)
            ->when($from, fn ($q) => $q->whereDate('payment_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('payment_date', '<=', $to))
            ->sum('amount');

        $outstanding = Invoice::where('tenant_id', $tenantId)->where('status', 'issued')->sum('balance_due');

        return [
            'income' => $this->money((float) $income),
            'expense' => $this->money((float) $expense),
            'net' => $this->money((float) $income - (float) $expense),
            'payments' => $this->money((float) $payments),
            'outstanding' => $this->money((float) $outstanding),
        ];
    }

    /**
     * Outstanding customer balances.
     */
    public function customerBalances(int $tenantId): array
    {
        return CustomerLedger::query()
            ->where('customer_ledgers.tenant_id', $tenantId)
            ->join('customers', 'customers.id', '=', 'customer_ledgers.customer_id')
            ->selectRaw('customers.id, customers.name, customers.phone, SUM(debit - credit) as balance')
            ->groupBy('customers.id', 'customers.name', 'customers.phone')
            ->havingRaw('SUM(debit - credit) <> 0')
            ->orderByDesc('balance')
            ->get()
            ->map(fn ($r) => [
                'customer_id' => $r->id,
                'name' => $r->name,
                'phone' => $r->phone,
                'balance' => $this->money((float) $r->balance),
            ])
            ->values()
            ->all();
    }

    /**
     * Inventory summary: totals + low-stock products.
     */
    public function inventory(int $tenantId): array
    {
        $lowStock = Inventory::query()
            ->where('tenant_id', $tenantId)
            ->whereColumn('quantity', '<=', 'min_quantity_threshold')
            ->with('product:id,name,sku,barcode')
            ->orderBy('quantity')
            ->get()
            ->map(fn ($i) => [
                'product_id' => $i->product_id,
                'name' => $i->product->name ?? null,
                'sku' => $i->product->sku ?? null,
                'quantity' => (float) $i->quantity,
                'threshold' => (float) $i->min_quantity_threshold,
            ]);

        return [
            'total_products' => Product::where('tenant_id', $tenantId)->count(),
            'total_stock_units' => $this->money((float) Inventory::where('tenant_id', $tenantId)->sum('quantity')),
            'low_stock_count' => $lowStock->count(),
            'low_stock' => $lowStock,
        ];
    }

    private function money(float $value): float
    {
        return round($value, 2);
    }
}
