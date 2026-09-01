<?php

namespace Tests\Feature\Auth;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $owner;

    protected User $manager;

    protected User $cashier;

    protected User $accountant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndUsers();
        $this->registerTestRoutes();
    }

    private function seedRolesAndUsers(): void
    {
        $superAdminRole = Role::create(['name' => 'Super Admin', 'slug' => Role::SUPER_ADMIN]);
        $ownerRole = Role::create(['name' => 'Owner', 'slug' => Role::OWNER]);
        $managerRole = Role::create(['name' => 'Manager', 'slug' => Role::MANAGER]);
        $cashierRole = Role::create(['name' => 'Cashier', 'slug' => Role::CASHIER]);
        $accountantRole = Role::create(['name' => 'Accountant', 'slug' => Role::ACCOUNTANT]);

        $viewProducts = Permission::create(['name' => 'View products', 'slug' => 'products.view', 'module' => 'products']);
        $createProducts = Permission::create(['name' => 'Create products', 'slug' => 'products.create', 'module' => 'products']);
        $deleteProducts = Permission::create(['name' => 'Delete products', 'slug' => 'products.delete', 'module' => 'products']);
        $financialReports = Permission::create(['name' => 'View financial reports', 'slug' => 'reports.financial', 'module' => 'reports']);

        $ownerRole->permissions()->attach([$viewProducts->id, $createProducts->id, $deleteProducts->id, $financialReports->id]);
        $managerRole->permissions()->attach([$viewProducts->id, $createProducts->id]);
        $cashierRole->permissions()->attach([$viewProducts->id]);
        $accountantRole->permissions()->attach([$financialReports->id]);

        $tenant = Tenant::create([
            'name' => 'Test Store',
            'slug' => 'test-store',
            'currency' => 'PKR',
            'timezone' => 'Asia/Karachi',
        ]);

        $this->superAdmin = User::create([
            'tenant_id' => null,
            'role_id' => $superAdminRole->id,
            'name' => 'Platform Admin',
            'email' => 'admin@dukanos.test',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);

        $this->owner = User::create([
            'tenant_id' => $tenant->id,
            'role_id' => $ownerRole->id,
            'name' => 'Store Owner',
            'email' => 'owner@test.store',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);

        $this->manager = User::create([
            'tenant_id' => $tenant->id,
            'role_id' => $managerRole->id,
            'name' => 'Store Manager',
            'email' => 'manager@test.store',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);

        $this->cashier = User::create([
            'tenant_id' => $tenant->id,
            'role_id' => $cashierRole->id,
            'name' => 'Store Cashier',
            'email' => 'cashier@test.store',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);

        $this->accountant = User::create([
            'tenant_id' => $tenant->id,
            'role_id' => $accountantRole->id,
            'name' => 'Store Accountant',
            'email' => 'accountant@test.store',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);
    }

    private function registerTestRoutes(): void
    {
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/test/owner-or-manager', fn () => response()->json(['ok' => true]))
                ->middleware('role:owner,manager');

            Route::get('/test/create-products', fn () => response()->json(['ok' => true]))
                ->middleware('permission:products.create');
        });
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'manager@test.store',
            'password' => 'password',
            'device_name' => 'test-client',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.email', 'manager@test.store')
            ->assertJsonPath('data.user.role.slug', 'manager');

        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'manager@test.store',
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors('email');
    }

    public function test_inactive_user_cannot_login(): void
    {
        $this->cashier->update(['status' => 'inactive']);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'cashier@test.store',
            'password' => 'password',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_me_returns_authenticated_user_with_permissions(): void
    {
        $token = $this->manager->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/v1/auth/me');

        $response->assertOk()
            ->assertJsonPath('data.email', 'manager@test.store')
            ->assertJsonPath('data.role.slug', 'manager')
            ->assertJsonPath('data.tenant.slug', 'test-store');

        $permissions = $response->json('data.permissions');
        $this->assertContains('products.create', $permissions);
        $this->assertNotContains('reports.financial', $permissions);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_logout_revokes_current_token(): void
    {
        $token = $this->manager->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_logout_all_revokes_every_token(): void
    {
        $first = $this->manager->createToken('first')->plainTextToken;
        $second = $this->manager->createToken('second')->plainTextToken;

        $this->withToken($first)->postJson('/api/v1/auth/logout-all')->assertOk();

        $this->withToken($first)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->withToken($second)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_user_can_update_their_profile(): void
    {
        $token = $this->cashier->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->putJson('/api/v1/auth/profile', [
            'name' => 'Usman Ali Updated',
            'email' => 'cashier@test.store',
            'phone' => '+92 300 1234567',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Usman Ali Updated')
            ->assertJsonPath('data.phone', '+92 300 1234567');

        $this->assertDatabaseHas('users', ['id' => $this->cashier->id, 'name' => 'Usman Ali Updated']);
    }

    public function test_user_cannot_use_an_email_owned_by_another_user(): void
    {
        $token = $this->cashier->createToken('test')->plainTextToken;

        $this->withToken($token)->putJson('/api/v1/auth/profile', [
            'name' => 'Cashier',
            'email' => 'manager@test.store',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_user_can_change_password_and_login_again(): void
    {
        $token = $this->cashier->createToken('test')->plainTextToken;

        $this->withToken($token)->putJson('/api/v1/auth/password', [
            'current_password' => 'password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertOk();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'cashier@test.store',
            'password' => 'new-password-123',
        ])->assertOk();
    }

    public function test_user_cannot_change_password_with_wrong_current_password(): void
    {
        $token = $this->cashier->createToken('test')->plainTextToken;

        $this->withToken($token)->putJson('/api/v1/auth/password', [
            'current_password' => 'incorrect',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
    }

    public function test_role_middleware_allows_manager_and_rejects_cashier(): void
    {
        $managerToken = $this->manager->createToken('test')->plainTextToken;
        $cashierToken = $this->cashier->createToken('test')->plainTextToken;

        $this->withToken($managerToken)->getJson('/test/owner-or-manager')->assertOk();
        $this->withToken($cashierToken)->getJson('/test/owner-or-manager')->assertForbidden();
    }

    public function test_permission_middleware_enforces_granular_permissions(): void
    {
        $managerToken = $this->manager->createToken('test')->plainTextToken;
        $cashierToken = $this->cashier->createToken('test')->plainTextToken;

        $this->withToken($managerToken)->getJson('/test/create-products')->assertOk();
        $this->withToken($cashierToken)->getJson('/test/create-products')->assertForbidden();
    }

    public function test_super_admin_has_every_permission(): void
    {
        $this->assertTrue($this->superAdmin->isSuperAdmin());
        $this->assertTrue($this->superAdmin->hasPermission('anything.at.all'));

        $token = $this->superAdmin->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.tenant', null)
            ->assertJsonPath('data.role.slug', 'super_admin');
    }

    public function test_login_is_audited(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'manager@test.store',
            'password' => 'password',
        ])->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'login',
            'module' => 'auth',
            'user_id' => $this->manager->id,
        ]);
    }
}
