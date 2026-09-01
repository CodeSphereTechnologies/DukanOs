<?php

namespace Tests\Feature\Api;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Inventory;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected User $superAdmin;

    protected User $owner;

    protected User $manager;

    protected User $cashier;

    protected User $accountant;

    protected Category $category;

    protected Brand $brand;

    protected Product $productA;

    protected Product $productB;

    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedBase();
    }

    protected function token(User $user): string
    {
        return $user->createToken('test')->plainTextToken;
    }

    private function seedBase(): void
    {
        $roleDefs = [
            'super_admin' => 'Super Admin',
            'owner' => 'Owner',
            'manager' => 'Manager',
            'cashier' => 'Cashier',
            'accountant' => 'Accountant',
        ];

        $roles = [];
        foreach ($roleDefs as $slug => $name) {
            $roles[$slug] = Role::create(['name' => $name, 'slug' => $slug]);
        }

        $permissionDefs = [
            ['products.view', 'products'], ['products.create', 'products'], ['products.update', 'products'], ['products.delete', 'products'],
            ['customers.view', 'customers'], ['customers.manage', 'customers'],
            ['invoices.view', 'invoices'], ['invoices.create', 'invoices'],
            ['quotations.manage', 'quotations'], ['payments.manage', 'payments'], ['returns.manage', 'returns'],
            ['ledger.view', 'ledger'], ['expenses.manage', 'expenses'], ['payroll.manage', 'payroll'],
            ['reports.view', 'reports'], ['reports.financial', 'reports'],
            ['users.manage', 'users'], ['audit.view', 'audit'],
            ['tenants.manage', 'tenants'], ['specifications.manage', 'specifications'],
        ];

        $permissions = [];
        foreach ($permissionDefs as [$slug, $module]) {
            $permissions[$slug] = Permission::create(['name' => $slug, 'slug' => $slug, 'module' => $module]);
        }

        $rolePermissions = [
            'owner' => ['products.view', 'products.create', 'products.update', 'products.delete', 'customers.view', 'customers.manage', 'invoices.view', 'invoices.create', 'quotations.manage', 'payments.manage', 'returns.manage', 'ledger.view', 'expenses.manage', 'payroll.manage', 'reports.view', 'reports.financial', 'users.manage', 'audit.view'],
            'manager' => ['products.view', 'products.create', 'products.update', 'customers.view', 'customers.manage', 'invoices.view', 'invoices.create', 'quotations.manage', 'payments.manage', 'returns.manage', 'reports.view'],
            'cashier' => ['products.view', 'customers.view', 'customers.manage', 'invoices.view', 'invoices.create', 'payments.manage'],
            'accountant' => ['invoices.view', 'payments.manage', 'ledger.view', 'expenses.manage', 'payroll.manage', 'reports.view', 'reports.financial'],
        ];

        foreach ($rolePermissions as $role => $perms) {
            $roles[$role]->permissions()->attach(collect($perms)->map(fn ($s) => $permissions[$s]->id));
        }

        $roles['super_admin']->permissions()->attach($permissions);

        $this->tenant = Tenant::create(['name' => 'Test Store', 'slug' => 'test-store', 'currency' => 'PKR', 'timezone' => 'Asia/Karachi']);

        $this->superAdmin = User::create(['tenant_id' => null, 'role_id' => $roles['super_admin']->id, 'name' => 'Admin', 'email' => 'admin@test.com', 'password' => Hash::make('password'), 'status' => 'active']);
        $this->owner = User::create(['tenant_id' => $this->tenant->id, 'role_id' => $roles['owner']->id, 'name' => 'Owner', 'email' => 'owner@test.com', 'password' => Hash::make('password'), 'status' => 'active']);
        $this->manager = User::create(['tenant_id' => $this->tenant->id, 'role_id' => $roles['manager']->id, 'name' => 'Manager', 'email' => 'manager@test.com', 'password' => Hash::make('password'), 'status' => 'active']);
        $this->cashier = User::create(['tenant_id' => $this->tenant->id, 'role_id' => $roles['cashier']->id, 'name' => 'Cashier', 'email' => 'cashier@test.com', 'password' => Hash::make('password'), 'status' => 'active']);
        $this->accountant = User::create(['tenant_id' => $this->tenant->id, 'role_id' => $roles['accountant']->id, 'name' => 'Accountant', 'email' => 'accountant@test.com', 'password' => Hash::make('password'), 'status' => 'active']);

        $this->category = Category::create(['tenant_id' => $this->tenant->id, 'name' => 'Lighting', 'slug' => 'lighting', 'status' => 'active']);
        $this->brand = Brand::create(['tenant_id' => $this->tenant->id, 'name' => 'Philips', 'slug' => 'philips', 'status' => 'active']);

        $this->productA = Product::create(['tenant_id' => $this->tenant->id, 'category_id' => $this->category->id, 'brand_id' => $this->brand->id, 'name' => 'LED Bulb 12W', 'sku' => 'LED-12W', 'barcode' => '8960000000001', 'selling_price' => 300, 'purchase_cost' => 180, 'status' => 'active']);
        $this->productB = Product::create(['tenant_id' => $this->tenant->id, 'category_id' => $this->category->id, 'brand_id' => $this->brand->id, 'name' => 'Ceiling Fan 56"', 'sku' => 'FAN-56', 'barcode' => '8960000000002', 'selling_price' => 8000, 'purchase_cost' => 5500, 'status' => 'active']);

        Inventory::create(['tenant_id' => $this->tenant->id, 'product_id' => $this->productA->id, 'quantity' => 100, 'min_quantity_threshold' => 10]);
        Inventory::create(['tenant_id' => $this->tenant->id, 'product_id' => $this->productB->id, 'quantity' => 20, 'min_quantity_threshold' => 5]);

        $this->customer = Customer::create(['tenant_id' => $this->tenant->id, 'name' => 'Muhammad Aslam', 'phone' => '+92 300 1234567', 'status' => 'active']);
    }
}
