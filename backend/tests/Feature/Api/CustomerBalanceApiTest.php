<?php

namespace Tests\Feature\Api;

use App\Models\CustomerLedger;

class CustomerBalanceApiTest extends ApiTestCase
{
    public function test_opening_balance_shows_up_as_the_outstanding_balance(): void
    {
        // Regression: the opening figure was only written to
        // customers.opening_balance, which the balance calculation ignores, so a
        // freshly added customer displayed PKR 0 in the Outstanding Balance column.
        $response = $this->withToken($this->token($this->owner))->postJson('/api/v1/customers', [
            'name' => 'Bilal Traders',
            'phone' => '+92 300 7654321',
            'opening_balance' => 5000,
            'status' => 'active',
        ]);

        $response->assertCreated()->assertJsonPath('data.balance', 5000);

        $id = $response->json('data.id');

        // The list is what the Customers page renders, so it must agree.
        $this->withToken($this->token($this->owner))->getJson('/api/v1/customers?search=Bilal')
            ->assertOk()
            ->assertJsonPath('data.data.0.balance', 5000);

        $this->assertDatabaseHas('customer_ledgers', [
            'customer_id' => $id,
            'entry_type' => 'opening_balance',
            'debit' => 5000,
        ]);
    }

    public function test_editing_the_outstanding_balance_updates_the_ledger(): void
    {
        // Regression: the edit form labelled the field "Outstanding Balance" but
        // the service saved it as opening_balance, leaving the displayed balance
        // untouched.
        $this->withToken($this->token($this->owner))->putJson("/api/v1/customers/{$this->customer->id}", [
            'name' => 'Muhammad Aslam',
            'current_balance' => 25000,
            'status' => 'active',
        ])->assertOk()->assertJsonPath('data.balance', 25000);

        $this->withToken($this->token($this->owner))->getJson('/api/v1/customers?search=Aslam')
            ->assertOk()
            ->assertJsonPath('data.data.0.balance', 25000);
    }

    public function test_lowering_the_outstanding_balance_posts_a_credit(): void
    {
        $this->withToken($this->token($this->owner))->postJson('/api/v1/customers', [
            'name' => 'Rashid Mahmood',
            'opening_balance' => 8000,
            'status' => 'active',
        ])->assertCreated();

        $customer = CustomerLedger::query()->where('entry_type', 'opening_balance')->firstOrFail();

        $this->withToken($this->token($this->owner))->putJson("/api/v1/customers/{$customer->customer_id}", [
            'name' => 'Rashid Mahmood',
            'current_balance' => 3000,
            'status' => 'active',
        ])->assertOk()->assertJsonPath('data.balance', 3000);

        $this->assertDatabaseHas('customer_ledgers', [
            'customer_id' => $customer->customer_id,
            'entry_type' => 'balance_adjustment',
            'debit' => 0,
            'credit' => 5000,
        ]);
    }

    public function test_unchanged_balance_does_not_add_a_ledger_entry(): void
    {
        $create = $this->withToken($this->token($this->owner))->postJson('/api/v1/customers', [
            'name' => 'Farhat Naz',
            'opening_balance' => 4000,
            'status' => 'active',
        ])->assertCreated();

        $id = $create->json('data.id');
        $before = CustomerLedger::query()->where('customer_id', $id)->count();

        $this->withToken($this->token($this->owner))->putJson("/api/v1/customers/{$id}", [
            'name' => 'Farhat Naz (Renamed)',
            'current_balance' => 4000,
            'status' => 'active',
        ])->assertOk()->assertJsonPath('data.name', 'Farhat Naz (Renamed)');

        $this->assertSame($before, CustomerLedger::query()->where('customer_id', $id)->count());
    }

    public function test_opening_balance_is_not_overwritten_by_later_edits(): void
    {
        $create = $this->withToken($this->token($this->owner))->postJson('/api/v1/customers', [
            'name' => 'Abdul Razzaq',
            'opening_balance' => 5000,
            'status' => 'active',
        ])->assertCreated();

        $id = $create->json('data.id');

        $this->withToken($this->token($this->owner))->putJson("/api/v1/customers/{$id}", [
            'name' => 'Abdul Razzaq',
            'current_balance' => 25000,
            'status' => 'active',
        ])->assertOk();

        // The opening figure stays on record; the difference lives on the ledger.
        $this->assertDatabaseHas('customers', ['id' => $id, 'opening_balance' => 5000]);
    }

    public function test_negative_outstanding_balance_is_rejected(): void
    {
        $this->withToken($this->token($this->owner))->putJson("/api/v1/customers/{$this->customer->id}", [
            'name' => 'Muhammad Aslam',
            'current_balance' => -50,
            'status' => 'active',
        ])->assertStatus(422)->assertJsonValidationErrors('current_balance');
    }
}
