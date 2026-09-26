<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerLedger;
use App\Models\DailyTransaction;
use App\Models\Employee;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\LedgerCategory;
use App\Models\Payment;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductSpecificationValue;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Role;
use App\Models\SalaryRecord;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\Specification;
use App\Models\SpecificationValue;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PunjabElectricStoreSeeder extends Seeder
{
    private const PASSWORD = 'password';

    /**
     * Run the database seeds.
     *
     * Seeds a single tenant (Punjab Electric Store) with a fully connected,
     * realistic set of master data and transactional history.
     */
    public function run(): void
    {
        Model::unguard();

        DB::transaction(function () {
            $roles = $this->seedRolesAndPermissions();
            $this->seedSuperAdmin($roles['super_admin']);

            $tenant = $this->seedTenant();
            $users = $this->seedTenantUsers($tenant, $roles);

            $specs = $this->seedSpecifications();
            $this->seedLedgerCategories($tenant);

            if (Product::where('tenant_id', $tenant->id)->exists()) {
                $this->command?->warn('Punjab Electric Store business data already seeded. Skipping product/customer/sales fixtures.');

                return;
            }

            $categories = $this->seedCategories($tenant);
            $brands = $this->seedBrands($tenant);
            $products = $this->seedProducts($tenant, $categories, $brands, $specs);
            $customers = $this->seedCustomers($tenant);

            $this->seedQuotationsAndSales($tenant, $users, $customers, $products);
            $this->seedDailyTransactions($tenant, $users);
            $this->seedEmployeesAndSalaries($tenant, $users);
            $this->seedAuditLogs($tenant, $users, $products);
        });

        Model::reguard();
    }

    /* ------------------------------------------------------------------ */
    /*  Roles & Permissions */
    /* ------------------------------------------------------------------ */

    private function seedRolesAndPermissions(): array
    {
        $permissionDefs = [
            ['name' => 'View products', 'slug' => 'products.view', 'module' => 'products'],
            ['name' => 'Create products', 'slug' => 'products.create', 'module' => 'products'],
            ['name' => 'Update products', 'slug' => 'products.update', 'module' => 'products'],
            ['name' => 'Delete products', 'slug' => 'products.delete', 'module' => 'products'],
            ['name' => 'View customers', 'slug' => 'customers.view', 'module' => 'customers'],
            ['name' => 'Manage customers', 'slug' => 'customers.manage', 'module' => 'customers'],
            ['name' => 'Create invoices', 'slug' => 'invoices.create', 'module' => 'invoices'],
            ['name' => 'View invoices', 'slug' => 'invoices.view', 'module' => 'invoices'],
            ['name' => 'Manage quotations', 'slug' => 'quotations.manage', 'module' => 'quotations'],
            ['name' => 'Record payments', 'slug' => 'payments.manage', 'module' => 'payments'],
            ['name' => 'Manage returns', 'slug' => 'returns.manage', 'module' => 'returns'],
            ['name' => 'View ledger', 'slug' => 'ledger.view', 'module' => 'ledger'],
            ['name' => 'Manage expenses', 'slug' => 'expenses.manage', 'module' => 'expenses'],
            ['name' => 'Manage payroll', 'slug' => 'payroll.manage', 'module' => 'payroll'],
            ['name' => 'View reports', 'slug' => 'reports.view', 'module' => 'reports'],
            ['name' => 'View financial reports', 'slug' => 'reports.financial', 'module' => 'reports'],
            ['name' => 'Manage users', 'slug' => 'users.manage', 'module' => 'users'],
            ['name' => 'Manage settings', 'slug' => 'settings.manage', 'module' => 'settings'],
            ['name' => 'Manage tenants', 'slug' => 'tenants.manage', 'module' => 'tenants'],
            ['name' => 'Manage specifications', 'slug' => 'specifications.manage', 'module' => 'specifications'],
            ['name' => 'View audit logs', 'slug' => 'audit.view', 'module' => 'audit'],
        ];

        $permissions = [];
        foreach ($permissionDefs as $def) {
            $permissions[$def['slug']] = Permission::firstOrCreate(['slug' => $def['slug']], $def);
        }

        $roleDefs = [
            'super_admin' => ['name' => 'Super Admin', 'description' => 'Platform owner with full access'],
            'owner' => ['name' => 'Owner', 'description' => 'Store owner with full store control'],
            'manager' => ['name' => 'Manager', 'description' => 'Operational management access'],
            'cashier' => ['name' => 'Cashier', 'description' => 'Sales focused role'],
            'accountant' => ['name' => 'Accountant', 'description' => 'Financial role'],
        ];

        $roles = [];
        foreach ($roleDefs as $key => $def) {
            $roles[$key] = Role::firstOrCreate(['slug' => $key], $def);
        }

        // Super-admin-only permissions are excluded from store roles.
        $storePermissions = array_values(array_diff(array_keys($permissions), [
            'tenants.manage',
            'specifications.manage',
        ]));

        $rolePermissions = [
            'owner' => $storePermissions,
            'manager' => ['products.view', 'products.create', 'products.update', 'customers.view', 'customers.manage', 'invoices.create', 'invoices.view', 'quotations.manage', 'payments.manage', 'returns.manage', 'reports.view'],
            'cashier' => ['products.view', 'customers.view', 'customers.manage', 'invoices.create', 'invoices.view', 'payments.manage'],
            'accountant' => ['products.view', 'customers.view', 'customers.manage', 'invoices.view', 'invoices.create', 'payments.manage', 'ledger.view', 'expenses.manage', 'payroll.manage', 'reports.view', 'reports.financial'],
        ];

        foreach ($rolePermissions as $roleKey => $perms) {
            $roles[$roleKey]->permissions()->syncWithoutDetaching(
                collect($perms)->map(fn ($slug) => $permissions[$slug]->id)
            );
        }

        $roles['super_admin']->permissions()->syncWithoutDetaching($permissions);

        return $roles;
    }

    private function seedSuperAdmin(Role $role): void
    {
        User::firstOrCreate(
            ['email' => 'admin@dukanos.com'],
            [
                'tenant_id' => null,
                'role_id' => $role->id,
                'name' => 'DukanOS Super Admin',
                'password' => Hash::make(self::PASSWORD),
                'status' => 'active',
                'email_verified_at' => now(),
            ],
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Tenant & Users */
    /* ------------------------------------------------------------------ */

    private function seedTenant(): Tenant
    {
        return Tenant::firstOrCreate(['slug' => 'punjab-electric-store'], [
            'name' => 'Punjab Electric Store',
            'email' => 'info@punjabelectric.pk',
            'phone' => '+92 300 4125678',
            'address' => 'Shop No. 14, Main Bazaar, Circular Road',
            'city' => 'Faisalabad',
            'state' => 'Punjab',
            'postal_code' => '38000',
            'currency' => 'PKR',
            'timezone' => 'Asia/Karachi',
            'status' => 'active',
            'settings' => [
                'receipt_footer' => 'Thank you for shopping with Punjab Electric Store.',
                'low_stock_alert' => true,
                'tax_enabled' => false,
                'invoice_prefix' => 'INV',
                'quotation_prefix' => 'QUO',
                'payment_prefix' => 'PAY',
                'return_prefix' => 'RET',
            ],
        ]);
    }

    private function seedTenantUsers(Tenant $tenant, array $roles): array
    {
        $defs = [
            ['key' => 'owner', 'name' => 'Muhammad Akram Ch.', 'email' => '(owner@punjabelectric.pk)', 'role' => 'owner', 'phone' => '+92 300 4125678'],
            ['key' => 'manager', 'name' => 'Ahmed Raza', 'email' => 'manager@punjabelectric.pk', 'role' => 'manager', 'phone' => '+92 321 7788990'],
            ['key' => 'cashier', 'name' => 'Usman Ali', 'email' => 'cashier@punjabelectric.pk', 'role' => 'cashier', 'phone' => '+92 333 4561234'],
            ['key' => 'accountant', 'name' => 'Sana Javed', 'email' => 'accountant@punjabelectric.pk', 'role' => 'accountant', 'phone' => '+92 345 1122334'],
        ];

        $users = [];
        foreach ($defs as $def) {
            $users[$def['key']] = User::firstOrCreate(
                ['email' => $def['email']],
                [
                    'tenant_id' => $tenant->id,
                    'role_id' => $roles[$def['role']]->id,
                    'name' => $def['name'],
                    'password' => Hash::make(self::PASSWORD),
                    'phone' => $def['phone'],
                    'status' => 'active',
                    'email_verified_at' => now(),
                ],
            );
        }

        return $users;
    }

    /* ------------------------------------------------------------------ */
    /*  Catalog: Specifications, Categories, Brands, Products */
    /* ------------------------------------------------------------------ */

    private function seedSpecifications(): array
    {
        $defs = [
            ['slug' => 'wattage', 'name' => 'Wattage', 'data_type' => 'text', 'unit' => 'W', 'is_filterable' => true],
            ['slug' => 'voltage', 'name' => 'Voltage', 'data_type' => 'text', 'unit' => 'V', 'is_filterable' => true],
            ['slug' => 'capacity', 'name' => 'Capacity', 'data_type' => 'text', 'unit' => 'L', 'is_filterable' => true],
            ['slug' => 'color', 'name' => 'Color', 'data_type' => 'select', 'unit' => null, 'is_filterable' => true],
            ['slug' => 'warranty', 'name' => 'Warranty', 'data_type' => 'select', 'unit' => null, 'is_filterable' => true],
            ['slug' => 'current', 'name' => 'Current Rating', 'data_type' => 'text', 'unit' => 'A', 'is_filterable' => true],
            ['slug' => 'power', 'name' => 'Power Rating', 'data_type' => 'text', 'unit' => 'kVA', 'is_filterable' => true],
            ['slug' => 'blade_size', 'name' => 'Blade Size', 'data_type' => 'text', 'unit' => 'inch', 'is_filterable' => false],
            ['slug' => 'speed', 'name' => 'Speed', 'data_type' => 'text', 'unit' => 'RPM', 'is_filterable' => false],
            ['slug' => 'material', 'name' => 'Material', 'data_type' => 'select', 'unit' => null, 'is_filterable' => false],
        ];

        $specs = [];
        foreach ($defs as $i => $def) {
            $specs[$def['slug']] = Specification::firstOrCreate(
                ['slug' => $def['slug']],
                [
                    'name' => $def['name'],
                    'data_type' => $def['data_type'],
                    'unit' => $def['unit'],
                    'is_filterable' => $def['is_filterable'],
                    'sort_order' => $i,
                    'status' => 'active',
                ],
            );
        }

        $values = [
            'color' => ['Cool White', 'Warm White', 'Daylight', 'White', 'Black', 'Silver', 'Grey', 'Ivory', 'Blue'],
            'warranty' => ['1 Year', '2 Years', '5 Years', '10 Years'],
            'material' => ['Copper', 'Aluminum', 'Plastic', 'Glass', 'Ceramic', 'Steel'],
        ];

        $valueMap = [];
        foreach ($values as $slug => $list) {
            foreach ($list as $i => $value) {
                $sv = SpecificationValue::firstOrCreate(
                    ['specification_id' => $specs[$slug]->id, 'value' => $value],
                    ['sort_order' => $i],
                );
                $valueMap[$slug][$value] = $sv->id;
            }
        }

        $specs['__values'] = $valueMap;

        return $specs;
    }

    private function seedCategories(Tenant $tenant): array
    {
        $defs = [
            ['slug' => 'lighting', 'name' => 'Lighting', 'parent' => null],
            ['slug' => 'led_bulbs', 'name' => 'LED Bulbs', 'parent' => 'lighting'],
            ['slug' => 'tube_lights', 'name' => 'Tube Lights', 'parent' => 'lighting'],
            ['slug' => 'fans', 'name' => 'Fans & Cooling', 'parent' => null],
            ['slug' => 'ceiling_fans', 'name' => 'Ceiling Fans', 'parent' => 'fans'],
            ['slug' => 'pedestal_fans', 'name' => 'Pedestal Fans', 'parent' => 'fans'],
            ['slug' => 'exhaust_fans', 'name' => 'Exhaust Fans', 'parent' => 'fans'],
            ['slug' => 'kitchen', 'name' => 'Kitchen Appliances', 'parent' => null],
            ['slug' => 'home', 'name' => 'Home Appliances', 'parent' => null],
            ['slug' => 'wiring', 'name' => 'Wires & Cables', 'parent' => null],
            ['slug' => 'switches', 'name' => 'Switches & Sockets', 'parent' => null],
            ['slug' => 'power', 'name' => 'Power Solutions', 'parent' => null],
            ['slug' => 'batteries', 'name' => 'Batteries', 'parent' => null],
        ];

        $categories = [];
        $byParent = [];
        foreach ($defs as $i => $def) {
            $categories[$def['slug']] = Category::firstOrCreate(
                ['tenant_id' => $tenant->id, 'slug' => $def['slug']],
                [
                    'parent_id' => null,
                    'name' => $def['name'],
                    'status' => 'active',
                    'sort_order' => $i,
                ],
            );
            if ($def['parent'] !== null) {
                $byParent[$def['slug']] = $def['parent'];
            }
        }

        foreach ($byParent as $slug => $parentSlug) {
            $categories[$slug]->update(['parent_id' => $categories[$parentSlug]->id]);
        }

        return $categories;
    }

    private function seedBrands(Tenant $tenant): array
    {
        $defs = [
            ['slug' => 'pel', 'name' => 'PEL (Pak Elektron)'],
            ['slug' => 'dawlance', 'name' => 'Dawlance'],
            ['slug' => 'orient', 'name' => 'Orient'],
            ['slug' => 'haier', 'name' => 'Haier'],
            ['slug' => 'national', 'name' => 'National'],
            ['slug' => 'philips', 'name' => 'Philips'],
            ['slug' => 'osram', 'name' => 'Osram'],
            ['slug' => 'clipsal', 'name' => 'Clipsal'],
            ['slug' => 'master', 'name' => 'Master Cables'],
            ['slug' => 'osaka', 'name' => 'Osaka Batteries'],
        ];

        $brands = [];
        foreach ($defs as $def) {
            $brands[$def['slug']] = Brand::firstOrCreate(
                ['tenant_id' => $tenant->id, 'slug' => $def['slug']],
                [
                    'name' => $def['name'],
                    'status' => 'active',
                ],
            );
        }

        return $brands;
    }

    private function seedProducts(Tenant $tenant, array $categories, array $brands, array $specs): array
    {
        $catalog = [
            ['key' => 'led_bulb_9w', 'name' => 'LED Bulb 9W', 'category' => 'led_bulbs', 'brand' => 'philips', 'sku' => 'PHL-LED-9W', 'barcode' => '8961000000101', 'model' => 'PH-9W-CW', 'cost' => 140, 'price' => 240, 'min' => 210, 'opening' => 500, 'threshold' => 60, 'specs' => ['wattage' => '9W', 'voltage' => '220V', 'color' => 'Cool White', 'warranty' => '2 Years']],
            ['key' => 'led_bulb_12w', 'name' => 'LED Bulb 12W', 'category' => 'led_bulbs', 'brand' => 'philips', 'sku' => 'PHL-LED-12W', 'barcode' => '8961000000102', 'model' => 'PH-12W-CW', 'cost' => 165, 'price' => 290, 'min' => 250, 'opening' => 450, 'threshold' => 50, 'specs' => ['wattage' => '12W', 'voltage' => '220V', 'color' => 'Cool White', 'warranty' => '2 Years']],
            ['key' => 'led_bulb_18w', 'name' => 'LED Bulb 18W', 'category' => 'led_bulbs', 'brand' => 'philips', 'sku' => 'PHL-LED-18W', 'barcode' => '8961000000103', 'model' => 'PH-18W-CW', 'cost' => 230, 'price' => 420, 'min' => 370, 'opening' => 300, 'threshold' => 40, 'specs' => ['wattage' => '18W', 'voltage' => '220V', 'color' => 'Cool White', 'warranty' => '2 Years']],
            ['key' => 'led_bulb_24w', 'name' => 'LED Bulb 24W', 'category' => 'led_bulbs', 'brand' => 'osram', 'sku' => 'OSR-LED-24W', 'barcode' => '8961000000104', 'model' => 'OS-24W-DL', 'cost' => 320, 'price' => 560, 'min' => 500, 'opening' => 200, 'threshold' => 30, 'specs' => ['wattage' => '24W', 'voltage' => '220V', 'color' => 'Daylight', 'warranty' => '2 Years']],
            ['key' => 'tube_20w', 'name' => 'LED Tube Light 20W (4ft)', 'category' => 'tube_lights', 'brand' => 'philips', 'sku' => 'PHL-TUB-20W', 'barcode' => '8961000000201', 'model' => 'PH-20W-T8', 'cost' => 380, 'price' => 650, 'min' => 580, 'opening' => 220, 'threshold' => 25, 'specs' => ['wattage' => '20W', 'voltage' => '220V', 'color' => 'Daylight', 'warranty' => '2 Years']],
            ['key' => 'tube_10w', 'name' => 'LED Tube Light 10W (2ft)', 'category' => 'tube_lights', 'brand' => 'osram', 'sku' => 'OSR-TUB-10W', 'barcode' => '8961000000202', 'model' => 'OS-10W-T8', 'cost' => 260, 'price' => 450, 'min' => 400, 'opening' => 180, 'threshold' => 25, 'specs' => ['wattage' => '10W', 'voltage' => '220V', 'color' => 'Cool White', 'warranty' => '2 Years']],
            ['key' => 'panel_12w', 'name' => 'LED Panel Light 12W', 'category' => 'led_bulbs', 'brand' => 'osram', 'sku' => 'OSR-PNL-12W', 'barcode' => '8961000000105', 'model' => 'OS-12W-PNL', 'cost' => 520, 'price' => 890, 'min' => 800, 'opening' => 90, 'threshold' => 15, 'specs' => ['wattage' => '12W', 'voltage' => '220V', 'color' => 'White', 'warranty' => '2 Years']],
            ['key' => 'ceiling_fan_56', 'name' => 'Ceiling Fan 56" Metallic', 'category' => 'ceiling_fans', 'brand' => 'pel', 'sku' => 'PEL-FAN-56M', 'barcode' => '8961000000301', 'model' => 'PEL-56-MET', 'cost' => 5200, 'price' => 7900, 'min' => 7200, 'opening' => 35, 'threshold' => 5, 'specs' => ['blade_size' => '56 inch', 'speed' => '320 RPM', 'color' => 'Silver', 'warranty' => '5 Years']],
            ['key' => 'ceiling_fan_48', 'name' => 'Ceiling Fan 48"', 'category' => 'ceiling_fans', 'brand' => 'dawlance', 'sku' => 'DWL-FAN-48', 'barcode' => '8961000000302', 'model' => 'DWL-48', 'cost' => 4300, 'price' => 6500, 'min' => 5900, 'opening' => 28, 'threshold' => 5, 'specs' => ['blade_size' => '48 inch', 'speed' => '340 RPM', 'color' => 'White', 'warranty' => '5 Years']],
            ['key' => 'pedestal_fan', 'name' => 'Pedestal Fan 26"', 'category' => 'pedestal_fans', 'brand' => 'orient', 'sku' => 'ORT-PED-26', 'barcode' => '8961000000303', 'model' => 'ORT-26-PD', 'cost' => 3400, 'price' => 5200, 'min' => 4700, 'opening' => 25, 'threshold' => 4, 'specs' => ['blade_size' => '26 inch', 'speed' => '1300 RPM', 'color' => 'Black', 'warranty' => '2 Years']],
            ['key' => 'exhaust_fan_12', 'name' => 'Exhaust Fan 12"', 'category' => 'exhaust_fans', 'brand' => 'pel', 'sku' => 'PEL-EXF-12', 'barcode' => '8961000000304', 'model' => 'PEL-12-EX', 'cost' => 1800, 'price' => 2800, 'min' => 2500, 'opening' => 40, 'threshold' => 6, 'specs' => ['blade_size' => '12 inch', 'color' => 'White', 'warranty' => '2 Years']],
            ['key' => 'table_fan', 'name' => 'Table Fan 12"', 'category' => 'pedestal_fans', 'brand' => 'national', 'sku' => 'NAT-TBF-12', 'barcode' => '8961000000305', 'model' => 'NAT-12-TF', 'cost' => 2200, 'price' => 3400, 'min' => 3100, 'opening' => 20, 'threshold' => 4, 'specs' => ['blade_size' => '12 inch', 'color' => 'Ivory', 'warranty' => '2 Years']],
            ['key' => 'kettle_1_8l', 'name' => 'Electric Kettle 1.8L', 'category' => 'kitchen', 'brand' => 'haier', 'sku' => 'HAR-KTL-1.8', 'barcode' => '8961000000401', 'model' => 'HR-1.8K', 'cost' => 1400, 'price' => 2300, 'min' => 2100, 'opening' => 30, 'threshold' => 5, 'specs' => ['capacity' => '1.8L', 'wattage' => '1500W', 'voltage' => '220V', 'warranty' => '1 Year']],
            ['key' => 'kettle_2_5l', 'name' => 'Electric Kettle 2.5L', 'category' => 'kitchen', 'brand' => 'orient', 'sku' => 'ORT-KTL-2.5', 'barcode' => '8961000000402', 'model' => 'ORT-2.5K', 'cost' => 1900, 'price' => 3100, 'min' => 2850, 'opening' => 22, 'threshold' => 4, 'specs' => ['capacity' => '2.5L', 'wattage' => '1800W', 'voltage' => '220V', 'warranty' => '1 Year']],
            ['key' => 'toaster_2s', 'name' => 'Toaster 2 Slice', 'category' => 'kitchen', 'brand' => 'haier', 'sku' => 'HAR-TST-2S', 'barcode' => '8961000000403', 'model' => 'HR-2S-T', 'cost' => 1700, 'price' => 2800, 'min' => 2550, 'opening' => 18, 'threshold' => 4, 'specs' => ['wattage' => '800W', 'voltage' => '220V', 'color' => 'White', 'warranty' => '1 Year']],
            ['key' => 'microwave_20l', 'name' => 'Microwave Oven 20L', 'category' => 'kitchen', 'brand' => 'dawlance', 'sku' => 'DWL-MW-20', 'barcode' => '8961000000404', 'model' => 'DWL-20-MW', 'cost' => 16500, 'price' => 23500, 'min' => 22000, 'opening' => 8, 'threshold' => 2, 'specs' => ['capacity' => '20L', 'wattage' => '900W', 'voltage' => '220V', 'warranty' => '1 Year']],
            ['key' => 'microwave_23l', 'name' => 'Microwave Oven 23L', 'category' => 'kitchen', 'brand' => 'haier', 'sku' => 'HAR-MW-23', 'barcode' => '8961000000405', 'model' => 'HR-23-MW', 'cost' => 19500, 'price' => 27000, 'min' => 25500, 'opening' => 6, 'threshold' => 2, 'specs' => ['capacity' => '23L', 'wattage' => '1000W', 'voltage' => '220V', 'warranty' => '1 Year']],
            ['key' => 'dry_iron', 'name' => 'Dry Iron', 'category' => 'home', 'brand' => 'national', 'sku' => 'NAT-IRN-DR', 'barcode' => '8961000000501', 'model' => 'NAT-DI', 'cost' => 950, 'price' => 1600, 'min' => 1450, 'opening' => 30, 'threshold' => 5, 'specs' => ['wattage' => '1000W', 'voltage' => '220V', 'warranty' => '1 Year']],
            ['key' => 'steam_iron', 'name' => 'Steam Iron', 'category' => 'home', 'brand' => 'philips', 'sku' => 'PHL-IRN-ST', 'barcode' => '8961000000502', 'model' => 'PH-SI', 'cost' => 3200, 'price' => 4900, 'min' => 4500, 'opening' => 18, 'threshold' => 3, 'specs' => ['wattage' => '1800W', 'voltage' => '220V', 'color' => 'Blue', 'warranty' => '2 Years']],
            ['key' => 'geyser_8l', 'name' => 'Instant Geyser 8L', 'category' => 'home', 'brand' => 'pel', 'sku' => 'PEL-GSR-8L', 'barcode' => '8961000000503', 'model' => 'PEL-8-IG', 'cost' => 9000, 'price' => 13500, 'min' => 12500, 'opening' => 12, 'threshold' => 3, 'specs' => ['capacity' => '8L', 'wattage' => '3000W', 'voltage' => '220V', 'warranty' => '2 Years']],
            ['key' => 'geyser_25l', 'name' => 'Storage Geyser 25L', 'category' => 'home', 'brand' => 'orient', 'sku' => 'ORT-GSR-25', 'barcode' => '8961000000504', 'model' => 'ORT-25-SG', 'cost' => 14500, 'price' => 21000, 'min' => 19500, 'opening' => 8, 'threshold' => 2, 'specs' => ['capacity' => '25L', 'wattage' => '2000W', 'voltage' => '220V', 'warranty' => '5 Years']],
            ['key' => 'room_heater', 'name' => 'Room Heater (Fan)', 'category' => 'home', 'brand' => 'orient', 'sku' => 'ORT-HTR-FN', 'barcode' => '8961000000505', 'model' => 'ORT-FH', 'cost' => 2600, 'price' => 4200, 'min' => 3850, 'opening' => 15, 'threshold' => 3, 'specs' => ['wattage' => '2000W', 'voltage' => '220V', 'color' => 'Black', 'warranty' => '1 Year']],
            ['key' => 'wire_1_5mm', 'name' => 'PVC Wire 1.5mm (90m Coil)', 'category' => 'wiring', 'brand' => 'master', 'sku' => 'MST-WIR-1.5', 'barcode' => '8961000000601', 'model' => 'MC-1.5', 'unit' => 'coil', 'cost' => 3200, 'price' => 4700, 'min' => 4400, 'opening' => 25, 'threshold' => 4, 'specs' => ['material' => 'Copper', 'current' => '16A', 'voltage' => '600V']],
            ['key' => 'wire_2_5mm', 'name' => 'PVC Wire 2.5mm (90m Coil)', 'category' => 'wiring', 'brand' => 'master', 'sku' => 'MST-WIR-2.5', 'barcode' => '8961000000602', 'model' => 'MC-2.5', 'unit' => 'coil', 'cost' => 4800, 'price' => 6900, 'min' => 6500, 'opening' => 20, 'threshold' => 4, 'specs' => ['material' => 'Copper', 'current' => '22A', 'voltage' => '600V']],
            ['key' => 'cable_3core', 'name' => '3-Core Flex Cable (50m)', 'category' => 'wiring', 'brand' => 'master', 'sku' => 'MST-CBL-3C', 'barcode' => '8961000000603', 'model' => 'MC-3C', 'unit' => 'roll', 'cost' => 4100, 'price' => 5900, 'min' => 5500, 'opening' => 16, 'threshold' => 3, 'specs' => ['material' => 'Copper', 'current' => '20A', 'voltage' => '600V']],
            ['key' => 'ext_board_4', 'name' => 'Extension Board 4-Way', 'category' => 'switches', 'brand' => 'clipsal', 'sku' => 'CLP-EXT-4', 'barcode' => '8961000000701', 'model' => 'CL-4X', 'cost' => 380, 'price' => 650, 'min' => 580, 'opening' => 60, 'threshold' => 10, 'specs' => ['current' => '10A', 'material' => 'Plastic', 'warranty' => '1 Year']],
            ['key' => 'ext_board_6', 'name' => 'Extension Board 6-Way', 'category' => 'switches', 'brand' => 'clipsal', 'sku' => 'CLP-EXT-6', 'barcode' => '8961000000702', 'model' => 'CL-6X', 'cost' => 520, 'price' => 900, 'min' => 820, 'opening' => 45, 'threshold' => 8, 'specs' => ['current' => '10A', 'material' => 'Plastic', 'warranty' => '1 Year']],
            ['key' => 'switch_1g', 'name' => 'Switch 1-Gang', 'category' => 'switches', 'brand' => 'clipsal', 'sku' => 'CLP-SW-1G', 'barcode' => '8961000000703', 'model' => 'CL-1G', 'cost' => 140, 'price' => 280, 'min' => 240, 'opening' => 300, 'threshold' => 50, 'specs' => ['current' => '10A', 'material' => 'Plastic']],
            ['key' => 'switch_2g', 'name' => 'Switch 2-Gang', 'category' => 'switches', 'brand' => 'clipsal', 'sku' => 'CLP-SW-2G', 'barcode' => '8961000000704', 'model' => 'CL-2G', 'cost' => 220, 'price' => 420, 'min' => 370, 'opening' => 220, 'threshold' => 40, 'specs' => ['current' => '10A', 'material' => 'Plastic']],
            ['key' => 'socket_5a', 'name' => 'Socket 5A (3-Pin)', 'category' => 'switches', 'brand' => 'clipsal', 'sku' => 'CLP-SKT-5A', 'barcode' => '8961000000705', 'model' => 'CL-5A', 'cost' => 180, 'price' => 350, 'min' => 310, 'opening' => 200, 'threshold' => 40, 'specs' => ['current' => '5A', 'material' => 'Plastic']],
            ['key' => 'socket_13a', 'name' => 'Socket 13A (Universal)', 'category' => 'switches', 'brand' => 'clipsal', 'sku' => 'CLP-SKT-13A', 'barcode' => '8961000000706', 'model' => 'CL-13A', 'cost' => 260, 'price' => 480, 'min' => 430, 'opening' => 150, 'threshold' => 30, 'specs' => ['current' => '13A', 'material' => 'Plastic']],
            ['key' => 'mcb_16a', 'name' => 'MCB 16A', 'category' => 'switches', 'brand' => 'clipsal', 'sku' => 'CLP-MCB-16', 'barcode' => '8961000000707', 'model' => 'CL-16A', 'cost' => 280, 'price' => 520, 'min' => 470, 'opening' => 120, 'threshold' => 25, 'specs' => ['current' => '16A', 'material' => 'Ceramic']],
            ['key' => 'mcb_32a', 'name' => 'MCB 32A', 'category' => 'switches', 'brand' => 'clipsal', 'sku' => 'CLP-MCB-32', 'barcode' => '8961000000708', 'model' => 'CL-32A', 'cost' => 340, 'price' => 620, 'min' => 560, 'opening' => 90, 'threshold' => 20, 'specs' => ['current' => '32A', 'material' => 'Ceramic']],
            ['key' => 'inverter_1kva', 'name' => 'Solar Inverter 1kVA', 'category' => 'power', 'brand' => 'pel', 'sku' => 'PEL-INV-1K', 'barcode' => '8961000000801', 'model' => 'PEL-1KVA', 'cost' => 42000, 'price' => 56000, 'min' => 53000, 'opening' => 6, 'threshold' => 2, 'specs' => ['power' => '1kVA', 'voltage' => '12V DC', 'warranty' => '5 Years']],
            ['key' => 'inverter_3kva', 'name' => 'Solar Inverter 3kVA', 'category' => 'power', 'brand' => 'pel', 'sku' => 'PEL-INV-3K', 'barcode' => '8961000000802', 'model' => 'PEL-3KVA', 'cost' => 78000, 'price' => 98000, 'min' => 94000, 'opening' => 4, 'threshold' => 1, 'specs' => ['power' => '3kVA', 'voltage' => '24V DC', 'warranty' => '5 Years']],
            ['key' => 'ups_650va', 'name' => 'UPS 650VA', 'category' => 'power', 'brand' => 'pel', 'sku' => 'PEL-UPS-650', 'barcode' => '8961000000803', 'model' => 'PEL-650VA', 'cost' => 8500, 'price' => 12500, 'min' => 11500, 'opening' => 10, 'threshold' => 3, 'specs' => ['power' => '650VA', 'voltage' => '12V DC', 'warranty' => '2 Years']],
            ['key' => 'stabilizer_5kva', 'name' => 'Voltage Stabilizer 5kVA', 'category' => 'power', 'brand' => 'orient', 'sku' => 'ORT-STB-5', 'barcode' => '8961000000804', 'model' => 'ORT-5KVA', 'cost' => 4600, 'price' => 7200, 'min' => 6600, 'opening' => 8, 'threshold' => 2, 'specs' => ['power' => '5kVA', 'voltage' => '220V', 'warranty' => '2 Years']],
            ['key' => 'battery_150ah', 'name' => 'UPS Battery 12V 150Ah', 'category' => 'batteries', 'brand' => 'osaka', 'sku' => 'OSK-BAT-150', 'barcode' => '8961000000901', 'model' => 'OS-150AH', 'cost' => 27000, 'price' => 35000, 'min' => 33000, 'opening' => 7, 'threshold' => 2, 'specs' => ['capacity' => '150Ah', 'voltage' => '12V', 'warranty' => '2 Years']],
            ['key' => 'battery_175ah', 'name' => 'UPS Battery 12V 175Ah', 'category' => 'batteries', 'brand' => 'osaka', 'sku' => 'OSK-BAT-175', 'barcode' => '8961000000902', 'model' => 'OS-175AH', 'cost' => 32000, 'price' => 41000, 'min' => 39000, 'opening' => 5, 'threshold' => 2, 'specs' => ['capacity' => '175Ah', 'voltage' => '12V', 'warranty' => '2 Years']],
            ['key' => 'torch', 'name' => 'Rechargeable Torch', 'category' => 'home', 'brand' => 'national', 'sku' => 'NAT-TRC', 'barcode' => '8961000000506', 'model' => 'NAT-RT', 'cost' => 550, 'price' => 950, 'min' => 850, 'opening' => 40, 'threshold' => 8, 'specs' => ['wattage' => '5W', 'warranty' => '1 Year']],
        ];

        $products = [];
        $valueMap = $specs['__values'];

        foreach ($catalog as $row) {
            $product = Product::create([
                'tenant_id' => $tenant->id,
                'category_id' => $categories[$row['category']]->id,
                'brand_id' => $brands[$row['brand']]->id,
                'name' => $row['name'],
                'sku' => $row['sku'],
                'barcode' => $row['barcode'],
                'model_number' => $row['model'],
                'description' => $row['name'].' — available at Punjab Electric Store.',
                'unit' => $row['unit'] ?? 'pc',
                'purchase_cost' => $row['cost'],
                'selling_price' => $row['price'],
                'min_selling_price' => $row['min'],
                'status' => 'active',
            ]);

            foreach ($row['specs'] as $slug => $value) {
                $specValueId = $valueMap[$slug][$value] ?? null;
                ProductSpecificationValue::create([
                    'product_id' => $product->id,
                    'specification_id' => $specs[$slug]->id,
                    'specification_value_id' => $specValueId,
                    'value' => $specValueId ? null : $value,
                ]);
            }

            $inventory = Inventory::create([
                'tenant_id' => $tenant->id,
                'product_id' => $product->id,
                'quantity' => $row['opening'],
                'min_quantity_threshold' => $row['threshold'],
            ]);

            InventoryTransaction::create([
                'tenant_id' => $tenant->id,
                'product_id' => $product->id,
                'type' => 'in',
                'quantity' => $row['opening'],
                'before_quantity' => 0,
                'after_quantity' => $row['opening'],
                'notes' => 'Opening stock',
            ]);

            $products[$row['key']] = [
                'product' => $product,
                'inventory' => $inventory,
                'cost' => $row['cost'],
            ];
        }

        return $products;
    }

    /* ------------------------------------------------------------------ */
    /*  Customers */
    /* ------------------------------------------------------------------ */

    private function seedCustomers(Tenant $tenant): array
    {
        $defs = [
            ['key' => 'aslam', 'name' => 'Muhammad Aslam', 'phone' => '+92 300 5123456', 'address' => 'House 22, Gulberg Colony, Faisalabad', 'notes' => 'Regular wholesale customer'],
            ['key' => 'bilal', 'name' => 'Bilal Ahmed', 'phone' => '+92 321 8877665', 'address' => 'St. 5, People Colony, Faisalabad'],
            ['key' => 'rashid', 'name' => 'Rashid Mahmood', 'phone' => '+92 333 4455667', 'address' => 'Electrician, Madina Town', 'notes' => 'Buys wiring in bulk'],
            ['key' => 'razzaq', 'name' => 'Abdul Razzaq', 'phone' => '+92 345 9988776', 'address' => 'Shop 9, D Ground, Faisalabad'],
            ['key' => 'farhat', 'name' => 'Farhat Naz', 'phone' => '+92 301 2233445', 'address' => 'House 4, Model Town, Faisalabad'],
            ['key' => 'haji', 'name' => 'Haji Saeed Khan', 'phone' => '+92 300 6677889', 'address' => 'Jhang Road, Faisalabad'],
            ['key' => 'imtiaz', 'name' => 'Imtiaz Hussain', 'phone' => '+92 322 5544332', 'address' => 'Railway Road, Faisalabad'],
            ['key' => 'nadeem', 'name' => 'Nadeem Akhtar', 'phone' => '+92 346 1122334', 'address' => 'Susan Road, Faisalabad'],
            ['key' => 'zafar', 'name' => 'Zafar Iqbal', 'phone' => '+92 331 7788996', 'address' => 'Peoples Colony, Faisalabad'],
            ['key' => 'tariq', 'name' => 'Tariq Javed', 'phone' => '+92 300 9998877', 'address' => 'Satiana Road, Faisalabad'],
        ];

        $customers = [];
        foreach ($defs as $def) {
            $customers[$def['key']] = Customer::create([
                'tenant_id' => $tenant->id,
                'name' => $def['name'],
                'phone' => $def['phone'],
                'address' => $def['address'],
                'notes' => $def['notes'] ?? null,
                'status' => 'active',
            ]);
        }

        return $customers;
    }

    /* ------------------------------------------------------------------ */
    /*  Quotations & Sales */
    /* ------------------------------------------------------------------ */

    private function seedQuotationsAndSales(Tenant $tenant, array $users, array $customers, array $products): void
    {
        $specs = [];
        $this->seedQuotations($tenant, $users, $customers, $products, $specs);
        $this->seedSales($tenant, $users, $customers, $products, $specs);
    }

    private function seedQuotations(Tenant $tenant, array $users, array $customers, array $products, array &$specs): void
    {
        $defs = [
        ];

        foreach ($defs as $def) {
            $quotation = Quotation::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customers[$def['customer']]->id,
                'quotation_number' => $def['number'],
                'quotation_date' => $def['date'],
                'valid_until' => Carbon::parse($def['date'])->addDays(14)->toDateString(),
                'status' => $def['status'],
                'created_by' => $users['manager']->id,
            ]);

            $subtotal = 0.0;
            foreach ($def['items'] as [$key, $qty]) {
                $p = $products[$key];
                $unitPrice = (float) $p['product']->selling_price;
                $lineTotal = $this->m($unitPrice * $qty);
                QuotationItem::create([
                    'tenant_id' => $tenant->id,
                    'quotation_id' => $quotation->id,
                    'product_id' => $p['product']->id,
                    'name' => $p['product']->name,
                    'sku' => $p['product']->sku,
                    'quantity' => $qty,
                    'unit' => $p['product']->unit,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ]);
                $subtotal += $lineTotal;
            }

            $quotation->update([
                'subtotal' => $this->m($subtotal),
                'total' => $this->m($subtotal),
            ]);

            if ($def['status'] === 'converted') {
                $specs[$def['number']] = $quotation;
            }
        }
    }

    private function seedSales(Tenant $tenant, array $users, array $customers, array $products, array $quotes): void
    {
        // [date, customer-key | null (walk-in), items[[key, qty]], discount(null|['pct'=>x]|['fixed'=>x]), method, mode(paid|partial|ledger), paid-amount-or-null]
        $sales = [
            ['2026-06-02', 'rashid', [['wire_2_5mm', 4], ['switch_1g', 10], ['socket_13a', 6], ['mcb_16a', 4]], null, 'bank_transfer', 'paid', null, 'QUO-0001'],
            ['2026-06-03', null, [['led_bulb_12w', 3], ['switch_1g', 2]], null, 'cash', 'paid', null, null],
            ['2026-06-05', 'aslam', [['wire_1_5mm', 8], ['cable_3core', 4]], ['pct' => 5], 'ledger', 'ledger', null, null],
            ['2026-06-07', null, [['kettle_1_8l', 1], ['toaster_2s', 1]], null, 'cash', 'paid', null, null],
            ['2026-06-10', 'haji', [['ceiling_fan_56', 6], ['led_bulb_12w', 12]], ['fixed' => 1000], 'cash', 'partial', 35000, 'QUO-0002'],
            ['2026-06-12', null, [['dry_iron', 2], ['torch', 1]], null, 'cash', 'paid', null, null],
            ['2026-06-15', 'bilal', [['steam_iron', 1], ['socket_5a', 4], ['switch_2g', 3]], null, 'card', 'paid', null, null],
            ['2026-06-18', null, [['tube_20w', 5], ['tube_10w', 3]], null, 'cash', 'paid', null, null],
            ['2026-06-20', 'rashid', [['ext_board_4', 5], ['ext_board_6', 3], ['mcb_32a', 4]], null, 'bank_transfer', 'ledger', null, null],
            ['2026-06-22', null, [['ceiling_fan_48', 1], ['led_bulb_18w', 4]], null, 'cash', 'paid', null, null],
            ['2026-06-25', 'farhat', [['microwave_23l', 1]], ['fixed' => 500], 'card', 'paid', null, null],
            ['2026-06-28', null, [['pedestal_fan', 1], ['table_fan', 1]], null, 'cash', 'paid', null, null],
            ['2026-07-01', 'imtiaz', [['geyser_8l', 1], ['socket_13a', 3]], null, 'cash', 'paid', null, null],
            ['2026-07-03', null, [['led_bulb_9w', 6], ['led_bulb_12w', 6]], null, 'cash', 'paid', null, null],
            ['2026-07-06', 'zafar', [['ceiling_fan_56', 2], ['exhaust_fan_12', 1]], null, 'bank_transfer', 'paid', null, null],
            ['2026-07-09', null, [['kettle_2_5l', 1], ['dry_iron', 1]], null, 'cash', 'paid', null, null],
            ['2026-07-12', 'nadeem', [['room_heater', 2], ['torch', 2]], null, 'cash', 'paid', null, null],
            ['2026-07-15', 'aslam', [['wire_2_5mm', 10], ['mcb_16a', 8], ['mcb_32a', 6]], ['pct' => 8], 'ledger', 'ledger', null, null],
            ['2026-07-18', null, [['steam_iron', 1]], null, 'cash', 'paid', null, null],
            ['2026-07-20', 'tariq', [['ups_650va', 1], ['battery_150ah', 1]], ['fixed' => 1500], 'bank_transfer', 'partial', 35000, null],
            ['2026-07-23', null, [['tube_20w', 8], ['panel_12w', 4]], null, 'cash', 'paid', null, null],
            ['2026-07-26', 'bilal', [['geyser_25l', 1], ['room_heater', 1]], null, 'card', 'paid', null, null],
            ['2026-07-29', null, [['switch_1g', 20], ['socket_5a', 15], ['socket_13a', 10]], null, 'cash', 'paid', null, null],
            ['2026-08-01', 'haji', [['led_bulb_24w', 20], ['tube_20w', 10]], ['pct' => 10], 'cash', 'paid', null, null],
            ['2026-08-03', 'imtiaz', [['inverter_1kva', 1], ['battery_150ah', 2], ['ups_650va', 1]], ['fixed' => 5000], 'bank_transfer', 'partial', 70000, null],
            ['2026-08-05', null, [['ceiling_fan_56', 1]], null, 'cash', 'paid', null, null],
            ['2026-08-08', 'rashid', [['cable_3core', 6], ['switch_2g', 10]], null, 'cash', 'paid', null, null],
            ['2026-08-10', null, [['kettle_1_8l', 2], ['toaster_2s', 1], ['microwave_20l', 1]], null, 'card', 'paid', null, null],
            ['2026-08-12', 'farhat', [['steam_iron', 1], ['dry_iron', 2]], null, 'cash', 'paid', null, null],
            ['2026-08-15', 'nadeem', [['pedestal_fan', 2], ['exhaust_fan_12', 2]], null, 'cash', 'paid', null, null],
            ['2026-08-18', null, [['led_bulb_12w', 10], ['led_bulb_18w', 6], ['led_bulb_9w', 8]], null, 'cash', 'paid', null, null],
            ['2026-08-20', 'zafar', [['stabilizer_5kva', 1], ['ups_650va', 1]], null, 'bank_transfer', 'paid', null, null],
            ['2026-08-22', 'aslam', [['wire_1_5mm', 6], ['wire_2_5mm', 6], ['cable_3core', 4]], ['pct' => 6], 'ledger', 'ledger', null, null],
            ['2026-08-25', null, [['geyser_8l', 1], ['socket_13a', 4]], null, 'cash', 'paid', null, null],
            ['2026-08-28', 'tariq', [['battery_175ah', 2], ['inverter_3kva', 1]], ['fixed' => 8000], 'bank_transfer', 'partial', 120000, null],
            ['2026-08-30', null, [['ceiling_fan_48', 1], ['led_bulb_12w', 3]], null, 'cash', 'paid', null, null],
            ['2026-09-01', 'imtiaz', [['led_bulb_12w', 6], ['led_bulb_18w', 6]], null, 'cash', 'paid', null, null],
            ['2026-09-02', null, [['ceiling_fan_56', 1], ['tube_20w', 2]], null, 'cash', 'paid', null, null],
            ['2026-09-03', 'rashid', [['wire_2_5mm', 6], ['cable_3core', 3], ['mcb_16a', 6]], ['pct' => 5], 'bank_transfer', 'ledger', null, null],
            ['2026-09-05', null, [['microwave_20l', 1], ['kettle_1_8l', 1]], null, 'card', 'paid', null, null],
            ['2026-09-06', 'bilal', [['steam_iron', 1], ['socket_13a', 4]], null, 'cash', 'paid', null, null],
            ['2026-09-08', 'nadeem', [['inverter_1kva', 1], ['battery_150ah', 1]], ['fixed' => 3000], 'bank_transfer', 'partial', 70000, null],
            ['2026-09-10', null, [['led_bulb_9w', 10], ['led_bulb_24w', 8]], null, 'cash', 'paid', null, null],
            ['2026-09-11', 'zafar', [['ups_650va', 1], ['stabilizer_5kva', 1]], null, 'bank_transfer', 'paid', null, null],
            ['2026-09-13', null, [['pedestal_fan', 2], ['table_fan', 1]], null, 'cash', 'paid', null, null],
            ['2026-09-15', 'farhat', [['geyser_8l', 1], ['toaster_2s', 2]], null, 'cash', 'paid', null, null],
            ['2026-09-16', 'haji', [['ceiling_fan_48', 2], ['exhaust_fan_12', 2]], null, 'cash', 'partial', 10000, null],
            ['2026-09-17', null, [['dry_iron', 2], ['torch', 3]], null, 'cash', 'paid', null, null],
        ];

        $invoiceNumber = 1;
        $paymentNumber = 1;
        $returnNumber = 1;
        $balances = [];
        $stock = $this->currentStockMap($products);

        foreach ($sales as $i => $sale) {
            [$date, $customerKey, $items, $discount, $method, $mode, $paidAmount, $quoteNumber] = $sale;
            $customer = $customerKey ? $customers[$customerKey] : null;
            $createdAt = Carbon::parse($date)->setTime(11, $i % 30, 0);

            $subtotal = 0.0;
            $itemRows = [];
            foreach ($items as [$key, $qty]) {
                $p = $products[$key];
                $unitPrice = (float) $p['product']->selling_price;
                $lineTotal = $this->m($unitPrice * $qty);
                $itemRows[] = ['key' => $key, 'qty' => $qty, 'unitPrice' => $unitPrice, 'lineTotal' => $lineTotal];
                $subtotal += $lineTotal;
            }

            [$discountType, $discountValue, $discountAmount] = $this->resolveDiscount($discount, $subtotal);
            $total = $this->m($subtotal - $discountAmount);

            $amountPaid = match ($mode) {
                'paid' => $total,
                'partial' => $this->m(min((float) $paidAmount, $total)),
                'ledger' => 0.0,
            };
            $balanceDue = $this->m($total - $amountPaid);
            $paymentStatus = match ($mode) {
                'paid' => 'paid',
                'partial' => 'partial',
                'ledger' => 'ledger',
            };

            $quoteId = $quoteNumber ? ($quotes[$quoteNumber]->id ?? null) : null;

            $invoice = Invoice::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer?->id,
                'quotation_id' => $quoteId,
                'invoice_number' => 'INV-'.str_pad((string) $invoiceNumber, 4, '0', STR_PAD_LEFT),
                'invoice_date' => $date,
                'due_date' => $mode === 'ledger' ? Carbon::parse($date)->addDays(30)->toDateString() : null,
                'subtotal' => $this->m($subtotal),
                'discount_type' => $discountType,
                'discount_value' => $discountValue,
                'discount_amount' => $discountAmount,
                'tax_amount' => 0,
                'total' => $total,
                'amount_paid' => $amountPaid,
                'balance_due' => $balanceDue,
                'payment_status' => $paymentStatus,
                'status' => 'issued',
                'created_by' => $users['cashier']->id,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            $invoiceNumber++;

            foreach ($itemRows as $row) {
                $p = $products[$row['key']];
                InvoiceItem::create([
                    'tenant_id' => $tenant->id,
                    'invoice_id' => $invoice->id,
                    'product_id' => $p['product']->id,
                    'name' => $p['product']->name,
                    'sku' => $p['product']->sku,
                    'barcode' => $p['product']->barcode,
                    'quantity' => $row['qty'],
                    'unit' => $p['product']->unit,
                    'unit_price' => $row['unitPrice'],
                    'line_total' => $row['lineTotal'],
                    'cost_price' => $p['cost'],
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                $this->adjustStock($tenant, $products, $stock, $row['key'], -$row['qty'], $createdAt, $users['cashier']->id, 'invoice', Invoice::class, $invoice->id);
            }

            if ($customer) {
                $this->postLedger($tenant, $customer->id, 'invoice', 'debit', $total, $date, $createdAt, $users['cashier']->id, $balances, Invoice::class, $invoice->id, 'Invoice '.$invoice->invoice_number);
            }

            if ($amountPaid > 0) {
                $payment = Payment::create([
                    'tenant_id' => $tenant->id,
                    'customer_id' => $customer?->id,
                    'invoice_id' => $invoice->id,
                    'payment_number' => 'PAY-'.str_pad((string) $paymentNumber, 4, '0', STR_PAD_LEFT),
                    'amount' => $amountPaid,
                    'method' => $method,
                    'reference' => in_array($method, ['bank_transfer', 'card', 'online']) ? 'TXN-'.strtoupper(substr(md5((string) $paymentNumber), 0, 8)) : null,
                    'payment_date' => $date,
                    'status' => 'completed',
                    'created_by' => $users['cashier']->id,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
                $paymentNumber++;

                if ($customer) {
                    $this->postLedger($tenant, $customer->id, 'payment', 'credit', $amountPaid, $date, $createdAt, $users['cashier']->id, $balances, Payment::class, $payment->id, 'Payment received on '.$invoice->invoice_number);
                }
            }
        }

        // Settlement payments for older credit invoices
        $this->seedSettlements($tenant, $users, $customers, $products, $balances);

        // Returns
        $this->seedReturns($tenant, $users, $customers, $products, $stock, $returnNumber, $balances);

        // Recompute running ledger balances in true chronological order.
        $this->recomputeLedgerBalances($tenant);

        // Persist final stock levels back onto the inventory records.
        foreach ($stock as $key => $qty) {
            Inventory::where('tenant_id', $tenant->id)
                ->where('product_id', $products[$key]['product']->id)
                ->update(['quantity' => $qty]);
        }
    }

    private function resolveDiscount(?array $discount, float $subtotal): array
    {
        if ($discount === null) {
            return [null, 0, 0.0];
        }
        if (isset($discount['pct'])) {
            $value = $discount['pct'];

            return ['percentage', $value, $this->m($subtotal * $value / 100)];
        }

        $value = $discount['fixed'];

        return ['fixed', $value, $this->m((float) $value)];
    }

    private function currentStockMap(array $products): array
    {
        $stock = [];
        foreach ($products as $key => $p) {
            $stock[$key] = (float) $p['inventory']->quantity;
        }

        return $stock;
    }

    private function adjustStock(Tenant $tenant, array $products, array &$stock, string $key, float $delta, Carbon $createdAt, int $userId, string $type, string $refType, int $refId): void
    {
        $before = $stock[$key];
        $after = $this->m($before + $delta);
        InventoryTransaction::create([
            'tenant_id' => $tenant->id,
            'product_id' => $products[$key]['product']->id,
            'type' => $delta < 0 ? 'out' : 'in',
            'quantity' => abs($delta),
            'reference_type' => $refType,
            'reference_id' => $refId,
            'before_quantity' => $before,
            'after_quantity' => $after,
            'created_by' => $userId,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
        $stock[$key] = $after;
    }

    private function postLedger(Tenant $tenant, int $customerId, string $entryType, string $side, float $amount, string $date, Carbon $createdAt, int $userId, array &$balances, string $refType, int $refId, string $note): void
    {
        $balances[$customerId] ??= 0.0;
        $debit = $side === 'debit' ? $amount : 0.0;
        $credit = $side === 'credit' ? $amount : 0.0;
        $balances[$customerId] = $this->m($balances[$customerId] + $debit - $credit);

        CustomerLedger::create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customerId,
            'entry_type' => $entryType,
            'reference_type' => $refType,
            'reference_id' => $refId,
            'debit' => $debit,
            'credit' => $credit,
            'balance' => $balances[$customerId],
            'entry_date' => $date,
            'notes' => $note,
            'created_by' => $userId,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    private function seedSettlements(Tenant $tenant, array $users, array $customers, array $products, array &$balances): void
    {
        $settlements = [
            ['2026-06-25', 'aslam', 'bank_transfer', 28000],
            ['2026-07-05', 'rashid', 'cash', 15000],
            ['2026-08-02', 'aslam', 'bank_transfer', 40000],
            ['2026-08-20', 'tariq', 'bank_transfer', 12000],
        ];

        $paymentNumber = 100;
        foreach ($settlements as [$date, $customerKey, $method, $amount]) {
            $customer = $customers[$customerKey];
            $createdAt = Carbon::parse($date)->setTime(12, 0, 0);
            $payment = Payment::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'invoice_id' => null,
                'payment_number' => 'PAY-'.str_pad((string) $paymentNumber, 4, '0', STR_PAD_LEFT),
                'amount' => $amount,
                'method' => $method,
                'reference' => 'TXN-'.strtoupper(substr(md5((string) $paymentNumber), 0, 8)),
                'payment_date' => $date,
                'status' => 'completed',
                'created_by' => $users['accountant']->id,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            $paymentNumber++;

            $this->postLedger($tenant, $customer->id, 'payment', 'credit', (float) $amount, $date, $createdAt, $users['accountant']->id, $balances, Payment::class, $payment->id, 'On-account payment');
        }
    }

    private function seedReturns(Tenant $tenant, array $users, array $customers, array $products, array &$stock, int $returnNumber, array &$balances): void
    {
        $returns = [
            ['2026-06-14', 'haji', 'ceiling_fan_56', 1, 'Noise in motor', 'ledger'],
            ['2026-07-22', null, 'kettle_2_5l', 1, 'Defective switch', 'cash'],
            ['2026-08-26', null, 'led_bulb_18w', 2, 'Flickering', 'cash'],
        ];

        foreach ($returns as [$date, $customerKey, $productKey, $qty, $reason, $refundType]) {
            $customer = $customerKey ? $customers[$customerKey] : null;
            $createdAt = Carbon::parse($date)->setTime(16, 30, 0);
            $p = $products[$productKey];
            $unitPrice = (float) $p['product']->selling_price;
            $amount = $this->m($unitPrice * $qty);

            $invoiceQuery = Invoice::where('tenant_id', $tenant->id)
                ->whereHas('items', fn ($q) => $q->where('product_id', $p['product']->id));

            if ($customer) {
                $invoiceQuery->where('customer_id', $customer->id);
            }

            $invoice = $invoiceQuery->orderByDesc('invoice_date')->first();

            $saleReturn = SaleReturn::create([
                'tenant_id' => $tenant->id,
                'invoice_id' => $invoice?->id,
                'customer_id' => $customer?->id,
                'return_number' => 'RET-'.str_pad((string) $returnNumber, 4, '0', STR_PAD_LEFT),
                'return_date' => $date,
                'reason' => $reason,
                'refund_type' => $refundType,
                'total_amount' => $amount,
                'status' => 'completed',
                'created_by' => $users['manager']->id,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            $returnNumber++;

            SaleReturnItem::create([
                'tenant_id' => $tenant->id,
                'return_id' => $saleReturn->id,
                'product_id' => $p['product']->id,
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'amount' => $amount,
                'reason' => $reason,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $this->adjustStock($tenant, $products, $stock, $productKey, $qty, $createdAt, $users['manager']->id, 'return', SaleReturn::class, $saleReturn->id);

            if ($customer) {
                $this->postLedger($tenant, $customer->id, 'return', 'credit', $amount, $date, $createdAt, $users['manager']->id, $balances, SaleReturn::class, $saleReturn->id, 'Return '.$saleReturn->return_number);
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Daily Ledger (Income / Expense) */
    /* ------------------------------------------------------------------ */

    private function seedLedgerCategories(Tenant $tenant): array
    {
        $income = [
            ['name' => 'Customer Payments', 'description' => 'Payments received against invoices', 'is_system' => true],
            ['name' => 'Other Income', 'description' => 'Miscellaneous income', 'is_system' => false],
        ];
        $expense = [
            ['name' => 'Shop Rent', 'description' => 'Monthly shop rent', 'is_system' => true],
            ['name' => 'Electricity Bill', 'description' => 'Monthly electricity bill', 'is_system' => true],
            ['name' => 'Salaries', 'description' => 'Employee salaries', 'is_system' => true],
            ['name' => 'Maintenance', 'description' => 'Repairs and maintenance', 'is_system' => false],
            ['name' => 'Transport', 'description' => 'Delivery and transport costs', 'is_system' => false],
            ['name' => 'Miscellaneous', 'description' => 'Other expenses', 'is_system' => false],
        ];

        $categories = [];
        foreach ($income as $def) {
            $categories['income'][$def['name']] = LedgerCategory::firstOrCreate(
                ['tenant_id' => $tenant->id, 'type' => 'income', 'name' => $def['name']],
                ['description' => $def['description'], 'is_system' => $def['is_system'], 'status' => 'active'],
            );
        }
        foreach ($expense as $def) {
            $categories['expense'][$def['name']] = LedgerCategory::firstOrCreate(
                ['tenant_id' => $tenant->id, 'type' => 'expense', 'name' => $def['name']],
                ['description' => $def['description'], 'is_system' => $def['is_system'], 'status' => 'active'],
            );
        }

        return $categories;
    }

    private function seedDailyTransactions(Tenant $tenant, array $users): void
    {
        $this->seedDailyTransactionsFromPayments($tenant, $users);
        $this->seedDailyExpenses($tenant, $users);
    }

    private function seedDailyTransactionsFromPayments(Tenant $tenant, array $users): void
    {
        $customerPaymentsCategory = LedgerCategory::where('tenant_id', $tenant->id)->where('type', 'income')->where('name', 'Customer Payments')->first();
        $otherIncome = LedgerCategory::where('tenant_id', $tenant->id)->where('type', 'income')->where('name', 'Other Income')->first();

        foreach (Payment::where('tenant_id', $tenant->id)->orderBy('payment_date')->get() as $payment) {
            DailyTransaction::create([
                'tenant_id' => $tenant->id,
                'category_id' => $customerPaymentsCategory->id,
                'type' => 'income',
                'amount' => (float) $payment->amount,
                'transaction_date' => $payment->payment_date->toDateString(),
                'description' => 'Payment '.$payment->payment_number,
                'reference_type' => Payment::class,
                'reference_id' => $payment->id,
                'created_by' => $payment->created_by,
                'created_at' => $payment->created_at,
                'updated_at' => $payment->created_at,
            ]);
        }

        DailyTransaction::create([
            'tenant_id' => $tenant->id,
            'category_id' => $otherIncome->id,
            'type' => 'income',
            'amount' => 3500,
            'transaction_date' => '2026-07-16',
            'description' => 'Sale of scrap copper wire',
            'created_by' => $users['owner']->id,
        ]);
    }

    private function seedDailyExpenses(Tenant $tenant, array $users): void
    {
        $cats = [];
        foreach (LedgerCategory::where('tenant_id', $tenant->id)->where('type', 'expense')->get() as $c) {
            $cats[$c->name] = $c;
        }

        $expenses = [
            ['2026-06-01', 'Shop Rent', 45000, 'Shop rent for June'],
            ['2026-06-04', 'Electricity Bill', 14200, 'Electricity bill for May'],
            ['2026-06-08', 'Transport', 2200, 'Delivery of fans to customer'],
            ['2026-06-17', 'Maintenance', 1800, 'Repair of shop AC'],
            ['2026-07-01', 'Shop Rent', 45000, 'Shop rent for July'],
            ['2026-07-05', 'Electricity Bill', 16800, 'Electricity bill for June'],
            ['2026-07-14', 'Miscellaneous', 1200, 'Stationery and cleaning'],
            ['2026-07-24', 'Transport', 1500, 'Local delivery'],
            ['2026-08-01', 'Shop Rent', 45000, 'Shop rent for August'],
            ['2026-08-04', 'Electricity Bill', 18300, 'Electricity bill for July'],
            ['2026-08-09', 'Maintenance', 2500, 'Replacement of shop sign light'],
            ['2026-08-19', 'Transport', 3200, 'Delivery of inverter to Imtiaz'],
            ['2026-09-01', 'Shop Rent', 45000, 'Shop rent for September'],
            ['2026-09-03', 'Electricity Bill', 17900, 'Electricity bill for August'],
            ['2026-09-08', 'Transport', 2800, 'Delivery of inverter to Nadeem'],
            ['2026-09-14', 'Maintenance', 1300, 'Replacement of sign board tube light'],
        ];

        foreach ($expenses as [$date, $categoryName, $amount, $desc]) {
            DailyTransaction::create([
                'tenant_id' => $tenant->id,
                'category_id' => $cats[$categoryName]->id,
                'type' => 'expense',
                'amount' => (float) $amount,
                'transaction_date' => $date,
                'description' => $desc,
                'created_by' => $users['accountant']->id,
                'created_at' => Carbon::parse($date)->setTime(10, 0, 0),
                'updated_at' => Carbon::parse($date)->setTime(10, 0, 0),
            ]);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Employees & Payroll */
    /* ------------------------------------------------------------------ */

    private function seedEmployeesAndSalaries(Tenant $tenant, array $users): void
    {
        $defs = [
            ['key' => 'manager', 'user' => 'manager', 'name' => 'Ahmed Raza', 'phone' => '+92 321 7788990', 'email' => 'manager@punjabelectric.pk', 'designation' => 'Store Manager', 'salary' => 45000, 'joining' => '2023-03-15'],
            ['key' => 'cashier', 'user' => 'cashier', 'name' => 'Usman Ali', 'phone' => '+92 333 4561234', 'email' => 'cashier@punjabelectric.pk', 'designation' => 'Cashier', 'salary' => 28000, 'joining' => '2024-01-10'],
            ['key' => 'accountant', 'user' => 'accountant', 'name' => 'Sana Javed', 'phone' => '+92 345 1122334', 'email' => 'accountant@punjabelectric.pk', 'designation' => 'Accountant', 'salary' => 40000, 'joining' => '2023-08-01'],
            ['key' => 'salesman', 'user' => null, 'name' => 'Kamran Khan', 'phone' => '+92 302 9988776', 'email' => null, 'designation' => 'Salesman', 'salary' => 24000, 'joining' => '2024-06-20'],
            ['key' => 'electrician', 'user' => null, 'name' => 'Naveed Akhtar', 'phone' => '+92 344 5566778', 'email' => null, 'designation' => 'Electrician', 'salary' => 32000, 'joining' => '2023-11-05'],
            ['key' => 'helper', 'user' => null, 'name' => 'Shahid Mehmood', 'phone' => '+92 305 3344556', 'email' => null, 'designation' => 'Helper', 'salary' => 18000, 'joining' => '2025-02-01'],
        ];

        $employees = [];
        foreach ($defs as $def) {
            $employees[$def['key']] = Employee::create([
                'tenant_id' => $tenant->id,
                'user_id' => $def['user'] ? $users[$def['user']]->id : null,
                'name' => $def['name'],
                'phone' => $def['phone'],
                'email' => $def['email'],
                'designation' => $def['designation'],
                'salary' => $def['salary'],
                'joining_date' => $def['joining'],
                'status' => 'active',
            ]);
        }

        $salariesCategory = LedgerCategory::where('tenant_id', $tenant->id)->where('type', 'expense')->where('name', 'Salaries')->first();

        foreach ($employees as $key => $employee) {
            $this->seedSalaryForPeriods($tenant, $employee, $users, $salariesCategory, $key);
        }
    }

    private function seedSalaryForPeriods(Tenant $tenant, Employee $employee, array $users, ?LedgerCategory $salariesCategory, string $key): void
    {
        $periods = [
            ['period' => '2026-06', 'bonus' => $key === 'salesman' ? 3000 : 0, 'deductions' => 0, 'status' => 'paid', 'paid_at' => '2026-07-01 12:00:00'],
            ['period' => '2026-07', 'bonus' => $key === 'electrician' ? 2000 : 0, 'deductions' => $key === 'cashier' ? 500 : 0, 'status' => 'paid', 'paid_at' => '2026-08-01 12:00:00'],
            ['period' => '2026-08', 'bonus' => 0, 'deductions' => 0, 'status' => 'pending', 'paid_at' => null],
            ['period' => '2026-09', 'bonus' => 0, 'deductions' => 0, 'status' => 'paid', 'paid_at' => '2026-09-01 12:00:00'],
        ];

        foreach ($periods as $p) {
            $net = $this->m((float) $employee->salary + $p['bonus'] - $p['deductions']);
            $record = SalaryRecord::create([
                'tenant_id' => $tenant->id,
                'employee_id' => $employee->id,
                'period' => $p['period'],
                'base_salary' => (float) $employee->salary,
                'bonus' => $p['bonus'],
                'deductions' => $p['deductions'],
                'net_salary' => $net,
                'status' => $p['status'],
                'paid_at' => $p['paid_at'],
                'payment_method' => $p['status'] === 'paid' ? 'bank_transfer' : null,
                'created_by' => $users['owner']->id,
            ]);

            if ($p['status'] === 'paid' && $salariesCategory) {
                DailyTransaction::create([
                    'tenant_id' => $tenant->id,
                    'category_id' => $salariesCategory->id,
                    'type' => 'expense',
                    'amount' => $net,
                    'transaction_date' => $p['paid_at'] ? Carbon::parse($p['paid_at'])->toDateString() : now()->toDateString(),
                    'description' => 'Salary of '.$employee->name.' for '.$p['period'],
                    'reference_type' => SalaryRecord::class,
                    'reference_id' => $record->id,
                    'created_by' => $users['owner']->id,
                    'created_at' => Carbon::parse($p['paid_at'])->setTime(12, 0, 0),
                    'updated_at' => Carbon::parse($p['paid_at'])->setTime(12, 0, 0),
                ]);
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Audit Logs */
    /* ------------------------------------------------------------------ */

    private function seedAuditLogs(Tenant $tenant, array $users, array $products): void
    {
        $sampleProduct = $products['ceiling_fan_56']['product'];

        $entries = [
            ['user' => 'owner', 'action' => 'login', 'module' => 'auth', 'entity_type' => null, 'entity_id' => null, 'old' => null, 'new' => null, 'at' => '2026-06-01 09:02:00'],
            ['user' => 'owner', 'action' => 'created', 'module' => 'products', 'entity_type' => 'product', 'entity_id' => $sampleProduct->id, 'old' => null, 'new' => ['name' => $sampleProduct->name, 'sku' => $sampleProduct->sku], 'at' => '2026-06-01 09:20:00'],
            ['user' => 'cashier', 'action' => 'login', 'module' => 'auth', 'entity_type' => null, 'entity_id' => null, 'old' => null, 'new' => null, 'at' => '2026-06-03 09:45:00'],
            ['user' => 'cashier', 'action' => 'created', 'module' => 'invoices', 'entity_type' => 'invoice', 'entity_id' => 2, 'old' => null, 'new' => ['invoice_number' => 'INV-0002'], 'at' => '2026-06-03 10:15:00'],
            ['user' => 'owner', 'action' => 'price_change', 'module' => 'products', 'entity_type' => 'product', 'entity_id' => $sampleProduct->id, 'old' => ['selling_price' => 7600], 'new' => ['selling_price' => 7900], 'at' => '2026-06-05 14:30:00'],
            ['user' => 'manager', 'action' => 'created', 'module' => 'quotations', 'entity_type' => 'quotation', 'entity_id' => 2, 'old' => null, 'new' => ['quotation_number' => 'QUO-0002'], 'at' => '2026-06-10 11:00:00'],
            ['user' => 'manager', 'action' => 'created', 'module' => 'returns', 'entity_type' => 'return', 'entity_id' => 1, 'old' => null, 'new' => ['return_number' => 'RET-0001'], 'at' => '2026-06-14 16:35:00'],
            ['user' => 'accountant', 'action' => 'created', 'module' => 'payments', 'entity_type' => 'payment', 'entity_id' => 1, 'old' => null, 'new' => ['payment_number' => 'PAY-0001'], 'at' => '2026-06-20 12:10:00'],
            ['user' => 'owner', 'action' => 'created', 'module' => 'users', 'entity_type' => 'user', 'entity_id' => $users['cashier']->id, 'old' => null, 'new' => ['email' => 'cashier@punjabelectric.pk'], 'at' => '2026-07-01 09:00:00'],
            ['user' => 'owner', 'action' => 'permission_change', 'module' => 'users', 'entity_type' => 'user', 'entity_id' => $users['cashier']->id, 'old' => ['role' => 'manager'], 'new' => ['role' => 'cashier'], 'at' => '2026-07-01 09:05:00'],
            ['user' => 'accountant', 'action' => 'created', 'module' => 'expenses', 'entity_type' => 'daily_transaction', 'entity_id' => 5, 'old' => null, 'new' => ['description' => 'Shop rent for July'], 'at' => '2026-07-01 10:00:00'],
            ['user' => 'owner', 'action' => 'payroll_paid', 'module' => 'payroll', 'entity_type' => 'salary_record', 'entity_id' => 1, 'old' => null, 'new' => ['period' => '2026-06'], 'at' => '2026-07-01 12:05:00'],
            ['user' => 'cashier', 'action' => 'logout', 'module' => 'auth', 'entity_type' => null, 'entity_id' => null, 'old' => null, 'new' => null, 'at' => '2026-07-31 21:00:00'],
            ['user' => 'manager', 'action' => 'updated', 'module' => 'products', 'entity_type' => 'product', 'entity_id' => $sampleProduct->id, 'old' => ['purchase_cost' => 5000], 'new' => ['purchase_cost' => 5200], 'at' => '2026-08-10 15:45:00'],
            ['user' => 'accountant', 'action' => 'created', 'module' => 'payments', 'entity_type' => 'payment', 'entity_id' => 20, 'old' => null, 'new' => ['payment_number' => 'PAY-0020'], 'at' => '2026-08-20 12:30:00'],
            ['user' => 'owner', 'action' => 'login', 'module' => 'auth', 'entity_type' => null, 'entity_id' => null, 'old' => null, 'new' => null, 'at' => '2026-08-31 09:10:00'],
        ];

        foreach ($entries as $e) {
            AuditLog::create([
                'tenant_id' => $tenant->id,
                'user_id' => $users[$e['user']]->id,
                'action' => $e['action'],
                'module' => $e['module'],
                'entity_type' => $e['entity_type'],
                'entity_id' => $e['entity_id'],
                'old_values' => $e['old'],
                'new_values' => $e['new'],
                'ip_address' => '192.168.1.101',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'device' => 'Desktop',
                'created_at' => Carbon::parse($e['at']),
            ]);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers */
    /* ------------------------------------------------------------------ */

    private function m(float $value): float
    {
        return round($value, 2);
    }

    private function recomputeLedgerBalances(Tenant $tenant): void
    {
        $entries = CustomerLedger::where('tenant_id', $tenant->id)
            ->orderBy('entry_date')
            ->orderBy('id')
            ->get();

        $balances = [];
        foreach ($entries as $entry) {
            $balances[$entry->customer_id] = $this->m(
                ($balances[$entry->customer_id] ?? 0.0) + (float) $entry->debit - (float) $entry->credit
            );
            $entry->update(['balance' => $balances[$entry->customer_id]]);
        }
    }
}
