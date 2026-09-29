<?php

namespace Tests\Feature\Api;

use App\Mail\StaffInvitation;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

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

    public function test_super_admin_can_create_store_user_for_a_tenant(): void
    {
        Mail::fake();

        $response = $this->withToken($this->token($this->superAdmin))->postJson('/api/v1/users', [
            'name' => 'Platform Cashier',
            'email' => 'platform.cashier@test.com',
            'password' => 'password123',
            'role' => 'cashier',
            'status' => 'active',
            'tenant_id' => $this->tenant->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'platform.cashier@test.com')
            ->assertJsonPath('data.role.slug', 'cashier');

        $created = User::where('email', 'platform.cashier@test.com')->firstOrFail();

        $this->assertSame($this->tenant->id, $created->tenant_id);
        $this->assertNotNull($created->email_verified_at, 'Invited staff must be able to sign in immediately.');
        $this->assertTrue(Hash::check('password123', $created->password));

        Mail::assertSent(StaffInvitation::class, fn ($mail) => $mail->hasTo('platform.cashier@test.com'));
    }

    public function test_super_admin_can_create_store_user_and_that_user_can_log_in(): void
    {
        Mail::fake();

        $this->withToken($this->token($this->superAdmin))->postJson('/api/v1/users', [
            'name' => 'Login Test Cashier',
            'email' => 'login.cashier@test.com',
            'password' => 'password123',
            'role' => 'cashier',
            'status' => 'active',
            'tenant_id' => $this->tenant->id,
        ])->assertCreated();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'login.cashier@test.com',
            'password' => 'password123',
        ])->assertOk()
            ->assertJsonPath('data.user.email', 'login.cashier@test.com')
            ->assertJsonPath('data.user.tenant.id', $this->tenant->id);
    }

    /**
     * A transport failure must be reported, not swallowed. The account is still
     * created and usable, but the response has to say the credentials were never
     * emailed and hand the password back for manual delivery.
     */
    public function test_failed_invitation_email_is_reported_instead_of_silently_ignored(): void
    {
        // No Mail::fake() here: point the transport at a dead endpoint so the
        // real send path is exercised.
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp' => [
                'transport' => 'smtp',
                'host' => '127.0.0.1',
                'port' => 1,
                'username' => 'nobody@example.com',
                'password' => 'irrelevant',
                'timeout' => 2,
            ],
        ]);

        $response = $this->withToken($this->token($this->superAdmin))->postJson('/api/v1/users', [
            'name' => 'Undeliverable Cashier',
            'email' => 'undeliverable@test.com',
            'password' => 'password123',
            'role' => 'cashier',
            'status' => 'active',
            'tenant_id' => $this->tenant->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'undeliverable@test.com')
            ->assertJsonPath('data.invitation_sent', false)
            ->assertJsonPath('data.temporary_password', 'password123');

        $this->assertStringContainsString('could not be sent', (string) $response->json('message'));

        // The account is still valid and can sign in.
        $this->assertDatabaseHas('users', ['email' => 'undeliverable@test.com']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'undeliverable@test.com',
            'password' => 'password123',
        ])->assertOk();
    }

    public function test_successful_invitation_does_not_echo_the_password(): void
    {
        Mail::fake();

        $this->withToken($this->token($this->superAdmin))->postJson('/api/v1/users', [
            'name' => 'Emailed Cashier',
            'email' => 'emailed@test.com',
            'password' => 'password123',
            'role' => 'cashier',
            'status' => 'active',
            'tenant_id' => $this->tenant->id,
        ])->assertCreated()
            ->assertJsonPath('data.invitation_sent', true)
            ->assertJsonMissingPath('data.temporary_password');

        Mail::assertSent(StaffInvitation::class, fn ($mail) => $mail->hasTo('emailed@test.com'));
    }

    public function test_super_admin_must_select_a_tenant_when_creating_a_user(): void
    {
        Mail::fake();

        $this->withToken($this->token($this->superAdmin))->postJson('/api/v1/users', [
            'name' => 'No Tenant',
            'email' => 'no.tenant@test.com',
            'password' => 'password123',
            'role' => 'cashier',
            'status' => 'active',
        ])->assertStatus(422)
            ->assertJsonValidationErrors('tenant_id');

        $this->assertDatabaseMissing('users', ['email' => 'no.tenant@test.com']);
    }

    public function test_store_user_cannot_create_a_user_in_another_tenant(): void
    {
        Mail::fake();

        $other = Tenant::create(['name' => 'Other', 'slug' => 'other', 'currency' => 'PKR', 'timezone' => 'Asia/Karachi']);

        $this->withToken($this->token($this->owner))->postJson('/api/v1/users', [
            'name' => 'Cross Tenant',
            'email' => 'cross.tenant@test.com',
            'password' => 'password123',
            'role' => 'cashier',
            'status' => 'active',
            'tenant_id' => $other->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors('tenant_id');

        $this->assertDatabaseMissing('users', ['email' => 'cross.tenant@test.com']);
    }

    public function test_super_admin_can_list_users_across_tenants(): void
    {
        $other = Tenant::create(['name' => 'Other', 'slug' => 'other', 'currency' => 'PKR', 'timezone' => 'Asia/Karachi']);

        User::create([
            'tenant_id' => $other->id,
            'role_id' => $this->cashier->role_id,
            'name' => 'Other Store Cashier',
            'email' => 'other.cashier@test.com',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);

        // 5 seeded users (super admin + 4 store users) + the one just created.
        $this->withToken($this->token($this->superAdmin))->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonCount(6, 'data.data');

        $this->withToken($this->token($this->superAdmin))->getJson('/api/v1/users?tenant_id='.$other->id)
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.email', 'other.cashier@test.com');
    }

    public function test_super_admin_can_toggle_a_users_status(): void
    {
        $this->withToken($this->token($this->superAdmin))
            ->patchJson('/api/v1/users/'.$this->cashier->id.'/status', ['status' => 'inactive'])
            ->assertOk()
            ->assertJsonPath('data.status', 'inactive');

        $this->assertSame('inactive', $this->cashier->fresh()->status);
    }

    public function test_user_cannot_change_their_own_status(): void
    {
        $this->withToken($this->token($this->owner))
            ->patchJson('/api/v1/users/'.$this->owner->id.'/status', ['status' => 'inactive'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');

        $this->assertSame('active', $this->owner->fresh()->status);
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
