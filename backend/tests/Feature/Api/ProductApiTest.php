<?php

namespace Tests\Feature\Api;

use App\Models\Inventory;

class ProductApiTest extends ApiTestCase
{
    public function test_list_products(): void
    {
        $this->withToken($this->token($this->cashier))->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonCount(2, 'data.data')
            ->assertJsonPath('data.data.0.name', 'Ceiling Fan 56"');
    }

    public function test_search_products(): void
    {
        $this->withToken($this->token($this->cashier))->getJson('/api/v1/products?search=bulb')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.sku', 'LED-12W');
    }

    public function test_lookup_product_by_barcode(): void
    {
        $this->withToken($this->token($this->cashier))->getJson('/api/v1/products/barcode?barcode=8960000000001')
            ->assertOk()
            ->assertJsonPath('data.sku', 'LED-12W');
    }

    public function test_owner_can_create_product(): void
    {
        $response = $this->withToken($this->token($this->owner))->postJson('/api/v1/products', [
            'name' => 'Electric Kettle',
            'sku' => 'KTL-1.8',
            'barcode' => '8960000000003',
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'selling_price' => 2500,
            'purchase_cost' => 1500,
            'status' => 'active',
            'opening_quantity' => 10,
            'min_quantity_threshold' => 2,
        ]);

        $response->assertCreated()->assertJsonPath('data.sku', 'KTL-1.8');

        $this->assertDatabaseHas('inventory', ['product_id' => $response->json('data.id'), 'quantity' => 10]);
    }

    public function test_cashier_cannot_create_product(): void
    {
        $this->withToken($this->token($this->cashier))->postJson('/api/v1/products', [
            'name' => 'Kettle',
            'sku' => 'KTL-2',
            'selling_price' => 100,
            'status' => 'active',
        ])->assertForbidden();
    }

    public function test_update_product(): void
    {
        $this->withToken($this->token($this->owner))->putJson("/api/v1/products/{$this->productA->id}", [
            'name' => 'LED Bulb 12W (Updated)',
            'sku' => 'LED-12W',
            'selling_price' => 320,
            'status' => 'active',
        ])->assertOk()->assertJsonPath('data.selling_price', 320);
    }

    public function test_duplicate_sku_is_rejected(): void
    {
        $this->withToken($this->token($this->owner))->postJson('/api/v1/products', [
            'name' => 'Another Bulb',
            'sku' => 'LED-12W',
            'selling_price' => 100,
            'status' => 'active',
        ])->assertUnprocessable();
    }

    public function test_inventory_adjustment(): void
    {
        $this->withToken($this->token($this->owner))->postJson("/api/v1/inventory/{$this->productA->id}/adjust", [
            'delta' => 25,
            'note' => 'Stock take',
        ])->assertOk();

        $this->assertEquals(125.0, (float) Inventory::where('product_id', $this->productA->id)->value('quantity'));
    }
}
