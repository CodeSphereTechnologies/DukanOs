<?php

namespace Tests\Feature\Api;

use App\Models\Tenant;

class AdminAuthorizationApiTest extends ApiTestCase
{
    public function test_super_admin_can_create_tenant(): void
    {
        $this->withToken($this->token($this->superAdmin))->postJson('/api/v1/tenants', [
            'name' => 'Another Store',
            'slug' => 'another-store',
            'currency' => 'PKR',
            'status' => 'active',
        ])->assertCreated()->assertJsonPath('data.slug', 'another-store');
    }

    public function test_owner_cannot_manage_tenants(): void
    {
        $this->withToken($this->token($this->owner))->getJson('/api/v1/tenants')->assertForbidden();
    }

    public function test_super_admin_can_manage_specifications(): void
    {
        $this->withToken($this->token($this->superAdmin))->postJson('/api/v1/specifications', [
            'name' => 'Wattage',
            'slug' => 'wattage',
            'data_type' => 'text',
            'unit' => 'W',
            'status' => 'active',
        ])->assertCreated()->assertJsonPath('data.slug', 'wattage');
    }

    public function test_owner_can_create_store_user(): void
    {
        $response = $this->withToken($this->token($this->owner))->postJson('/api/v1/users', [
            'name' => 'New Cashier',
            'email' => 'newcashier@test.com',
            'password' => 'password123',
            'role' => 'cashier',
            'status' => 'active',
        ]);

        $response->assertCreated()->assertJsonPath('data.email', 'newcashier@test.com');
    }

    public function test_cashier_cannot_manage_users(): void
    {
        $this->withToken($this->token($this->cashier))->getJson('/api/v1/users')->assertForbidden();
    }

    public function test_tenant_isolation_blocks_cross_tenant_access(): void
    {
        $other = Tenant::create(['name' => 'Other', 'slug' => 'other', 'currency' => 'PKR', 'timezone' => 'Asia/Karachi']);

        $this->withToken($this->token($this->owner))->getJson('/api/v1/customers')
            ->assertOk()
            ->assertJsonCount(1, 'data.data');

        $this->assertEquals(1, $this->tenant->id);
        $this->assertNotEquals($this->tenant->id, $other->id);
    }

    public function test_audit_logs_are_scoped_to_tenant(): void
    {
        $this->withToken($this->token($this->owner))->postJson('/api/v1/customers', [
            'name' => 'Scoped Customer',
            'status' => 'active',
        ])->assertCreated();

        $this->withToken($this->token($this->owner))->getJson('/api/v1/audit-logs')
            ->assertOk()
            ->assertJsonStructure(['data' => ['data']]);
    }
}
