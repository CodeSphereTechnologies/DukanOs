<?php

namespace Tests\Feature\Api;

use App\Models\CustomerLedger;
use App\Models\Inventory;
use App\Models\Invoice;
use App\Models\Quotation;

class SalesApiTest extends ApiTestCase
{
    public function test_create_invoice_with_full_payment_deducts_stock_and_posts_ledger(): void
    {
        $response = $this->withToken($this->token($this->cashier))->postJson('/api/v1/invoices', [
            'customer_id' => $this->customer->id,
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => 2],
                ['product_id' => $this->productB->id, 'quantity' => 1],
            ],
            'amount_paid' => 8600,
            'payment_method' => 'cash',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.total', 8600)
            ->assertJsonPath('data.amount_paid', 8600)
            ->assertJsonPath('data.balance_due', 0)
            ->assertJsonPath('data.payment_status', 'paid');

        $this->assertEquals(98.0, (float) Inventory::where('product_id', $this->productA->id)->value('quantity'));
        $this->assertEquals(19.0, (float) Inventory::where('product_id', $this->productB->id)->value('quantity'));

        $this->assertDatabaseHas('payments', ['invoice_id' => $response->json('data.id'), 'amount' => 8600]);

        $this->assertEquals(0.0, (float) CustomerLedger::where('customer_id', $this->customer->id)->sum('debit') - (float) CustomerLedger::where('customer_id', $this->customer->id)->sum('credit'));
    }

    public function test_create_invoice_with_partial_payment(): void
    {
        $response = $this->withToken($this->token($this->cashier))->postJson('/api/v1/invoices', [
            'customer_id' => $this->customer->id,
            'items' => [['product_id' => $this->productB->id, 'quantity' => 1]],
            'amount_paid' => 3000,
            'payment_method' => 'card',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.total', 8000)
            ->assertJsonPath('data.amount_paid', 3000)
            ->assertJsonPath('data.balance_due', 5000)
            ->assertJsonPath('data.payment_status', 'partial');
    }

    public function test_create_invoice_on_ledger_with_no_payment(): void
    {
        $response = $this->withToken($this->token($this->cashier))->postJson('/api/v1/invoices', [
            'customer_id' => $this->customer->id,
            'items' => [['product_id' => $this->productA->id, 'quantity' => 3]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.total', 900)
            ->assertJsonPath('data.amount_paid', 0)
            ->assertJsonPath('data.balance_due', 900)
            ->assertJsonPath('data.payment_status', 'ledger');
    }

    public function test_invoice_creation_fails_on_insufficient_stock(): void
    {
        $this->withToken($this->token($this->cashier))->postJson('/api/v1/invoices', [
            'items' => [['product_id' => $this->productA->id, 'quantity' => 500]],
        ])->assertUnprocessable();
    }

    public function test_record_payment_updates_invoice_balance(): void
    {
        $invoice = $this->createLedgerInvoice();

        $response = $this->withToken($this->token($this->accountant))->postJson('/api/v1/payments', [
            'invoice_id' => $invoice->id,
            'amount' => 400,
            'method' => 'bank_transfer',
        ]);

        $response->assertCreated()->assertJsonPath('data.amount', 400);

        $this->assertEquals(400.0, (float) Invoice::find($invoice->id)->amount_paid);
        $this->assertEquals(500.0, (float) Invoice::find($invoice->id)->balance_due);
        $this->assertEquals('partial', Invoice::find($invoice->id)->payment_status);
    }

    public function test_create_return_restores_stock_and_updates_ledger(): void
    {
        $invoice = $this->createLedgerInvoice();

        $invoiceItemId = $invoice->items()->first()->id;

        $response = $this->withToken($this->token($this->manager))->postJson('/api/v1/returns', [
            'invoice_id' => $invoice->id,
            'refund_type' => 'ledger',
            'items' => [
                ['invoice_item_id' => $invoiceItemId, 'quantity' => 1],
            ],
        ]);

        $response->assertCreated()->assertJsonPath('data.total_amount', 300);

        // Stock restored from 97 back to 98.
        $this->assertEquals(98.0, (float) Inventory::where('product_id', $this->productA->id)->value('quantity'));

        $this->assertDatabaseHas('returns', ['invoice_id' => $invoice->id]);
    }

    public function test_create_and_convert_quotation(): void
    {
        $quote = $this->withToken($this->token($this->manager))->postJson('/api/v1/quotations', [
            'customer_id' => $this->customer->id,
            'items' => [['product_id' => $this->productB->id, 'quantity' => 2]],
        ]);

        $quote->assertCreated()->assertJsonPath('data.total', 16000);

        $quotationId = $quote->json('data.id');

        $convert = $this->withToken($this->token($this->manager))->postJson("/api/v1/quotations/{$quotationId}/convert", [
            'amount_paid' => 16000,
            'payment_method' => 'cash',
        ]);

        $convert->assertCreated()
            ->assertJsonPath('data.total', 16000)
            ->assertJsonPath('data.payment_status', 'paid');

        $this->assertEquals('converted', Quotation::find($quotationId)->status);
    }

    public function test_void_invoice_restores_stock(): void
    {
        $invoice = $this->createLedgerInvoice();

        $this->withToken($this->token($this->manager))->postJson("/api/v1/invoices/{$invoice->id}/void")
            ->assertOk()
            ->assertJsonPath('data.status', 'voided');

        $this->assertEquals(100.0, (float) Inventory::where('product_id', $this->productA->id)->value('quantity'));
    }

    private function createLedgerInvoice(): Invoice
    {
        $response = $this->withToken($this->token($this->cashier))->postJson('/api/v1/invoices', [
            'customer_id' => $this->customer->id,
            'items' => [['product_id' => $this->productA->id, 'quantity' => 3]],
        ]);

        $response->assertCreated();

        return Invoice::find($response->json('data.id'));
    }
}
