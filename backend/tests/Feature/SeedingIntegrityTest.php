<?php

namespace Tests\Feature;

use App\Models\CustomerLedger;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PunjabElectricStoreSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeedingIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PunjabElectricStoreSeeder::class);
    }

    public function test_it_seeds_a_single_connected_tenant(): void
    {
        $this->assertSame(1, Tenant::count());
        $this->assertSame(5, Role::count());
        $this->assertSame(5, User::count());

        $tenant = Tenant::where('slug', 'punjab-electric-store')->firstOrFail();
        $this->assertSame('Punjab Electric Store', $tenant->name);
        $this->assertSame('PKR', $tenant->currency);
    }

    public function test_invoice_financial_math_is_consistent(): void
    {
        $invoices = Invoice::with('items')->get();
        $this->assertGreaterThan(0, $invoices->count());

        foreach ($invoices as $invoice) {
            $subtotal = round($invoice->items->sum(fn ($i) => (float) $i->line_total), 2);
            $this->assertEqualsWithDelta($subtotal, (float) $invoice->subtotal, 0.01);
            $this->assertEqualsWithDelta(
                (float) $invoice->subtotal - (float) $invoice->discount_amount,
                (float) $invoice->total,
                0.01,
            );
            $this->assertEqualsWithDelta(
                (float) $invoice->total - (float) $invoice->amount_paid,
                (float) $invoice->balance_due,
                0.01,
            );
        }
    }

    public function test_invoice_payments_reconcile(): void
    {
        foreach (Invoice::all() as $invoice) {
            $paid = Payment::where('invoice_id', $invoice->id)->sum('amount');
            $this->assertEqualsWithDelta((float) $invoice->amount_paid, (float) $paid, 0.01);
        }
    }

    public function test_inventory_matches_stock_movements(): void
    {
        foreach (Inventory::all() as $stock) {
            $net = InventoryTransaction::where('product_id', $stock->product_id)
                ->get()
                ->sum(fn ($tx) => $tx->type === 'in' ? (float) $tx->quantity : -(float) $tx->quantity);

            $this->assertEqualsWithDelta((float) $stock->quantity, (float) $net, 0.01);
        }
    }

    public function test_customer_ledger_has_correct_running_balance(): void
    {
        $balances = [];

        $entries = CustomerLedger::orderBy('entry_date')->orderBy('id')->get();
        $this->assertGreaterThan(0, $entries->count());

        foreach ($entries as $entry) {
            $balances[$entry->customer_id] = round(
                ($balances[$entry->customer_id] ?? 0) + (float) $entry->debit - (float) $entry->credit,
                2,
            );

            $this->assertEqualsWithDelta($balances[$entry->customer_id], (float) $entry->balance, 0.01);
        }
    }

    public function test_tenant_data_is_isolated_by_tenant_id(): void
    {
        $tenantId = Tenant::firstOrFail()->id;

        foreach ([Invoice::class, CustomerLedger::class, Inventory::class] as $model) {
            $this->assertSame(
                0,
                $model::where('tenant_id', '!=', $tenantId)->count(),
                $model.' contains rows outside the tenant scope',
            );
        }
    }
}
