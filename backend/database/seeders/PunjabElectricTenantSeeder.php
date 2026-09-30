<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PunjabElectricTenantSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::firstOrCreate(['slug' => 'punjab-electric-store'], [
            'name' => 'Punjab Electric Store',
            'phone' => '+92 300 1234567',
            'email' => 'info@punjabelectric.pk',
            'address' => 'Shop #12, Phase 1, Main Boulevard, Lahore',
            'currency' => 'PKR',
        ]);

        $password = Hash::make('PunjabElectric@774');

        $roles = Role::whereIn('slug', ['owner', 'manager', 'cashier', 'accountant'])->get()->keyBy('slug');

        User::firstOrCreate(['email' => 'owner@punjabelectric.pk'], [
            'tenant_id' => $tenant->id,
            'name' => 'Admin Owner',
            'password' => $password,
            'role_id' => $roles['owner']->id,
            'status' => 'active',
        ]);

        User::firstOrCreate(['email' => 'manager@punjabelectric.pk'], [
            'tenant_id' => $tenant->id,
            'name' => 'Manager Person',
            'password' => $password,
            'role_id' => $roles['manager']->id,
            'status' => 'active',
        ]);

        User::firstOrCreate(['email' => 'cashier@punjabelectric.pk'], [
            'tenant_id' => $tenant->id,
            'name' => 'Cashier Person',
            'password' => $password,
            'role_id' => $roles['cashier']->id,
            'status' => 'active',
        ]);

        User::firstOrCreate(['email' => 'accountant@punjabelectric.pk'], [
            'tenant_id' => $tenant->id,
            'name' => 'Accountant Person',
            'password' => $password,
            'role_id' => $roles['accountant']->id,
            'status' => 'active',
        ]);
    }
}
