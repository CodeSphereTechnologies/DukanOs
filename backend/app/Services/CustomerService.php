<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\User;
use App\Repositories\CustomerRepository;

class CustomerService
{
    public function __construct(private readonly CustomerRepository $customers) {}

    public function create(User $user, array $data): Customer
    {
        $customer = $this->customers->create([
            'tenant_id' => $user->tenant_id,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'notes' => $data['notes'] ?? null,
            'opening_balance' => (float) ($data['opening_balance'] ?? 0),
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::log($user, 'created', 'customers', 'customer', $customer->id, null, $customer->only(['name', 'phone']));

        return $customer;
    }

    public function update(User $user, Customer $customer, array $data): Customer
    {
        $old = $customer->only(['name', 'phone', 'status']);

        $customer->update([
            'name' => $data['name'],
            'phone' => $data['phone'] ?? $customer->phone,
            'email' => $data['email'] ?? $customer->email,
            'address' => $data['address'] ?? $customer->address,
            'notes' => $data['notes'] ?? $customer->notes,
            'opening_balance' => (float) ($data['opening_balance'] ?? $customer->opening_balance),
            'status' => $data['status'] ?? $customer->status,
        ]);

        AuditService::log($user, 'updated', 'customers', 'customer', $customer->id, $old, $customer->only(['name', 'phone', 'status']));

        return $customer;
    }

    public function delete(User $user, Customer $customer): void
    {
        AuditService::log($user, 'deleted', 'customers', 'customer', $customer->id, $customer->only(['name', 'phone']), null);
        $this->customers->delete($customer);
    }
}
