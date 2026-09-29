<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\User;
use App\Repositories\CustomerLedgerRepository;
use App\Repositories\CustomerRepository;
use App\Services\Concerns\PostsAccounting;

class CustomerService
{
    use PostsAccounting;

    public function __construct(
        private readonly CustomerRepository $customers,
        private readonly CustomerLedgerRepository $ledger,
    ) {}

    public function create(User $user, array $data): Customer
    {
        $customer = $this->customers->create([
            'tenant_id' => $user->tenant_id,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'notes' => $data['notes'] ?? null,
            'opening_balance' => $this->money((float) ($data['opening_balance'] ?? 0)),
            'status' => $data['status'] ?? 'active',
        ]);

        // The ledger is the source of truth for a customer's outstanding
        // balance, so the opening figure has to be posted as its first entry.
        // Storing it on the row alone left the balance reading as 0.
        $opening = (float) $customer->opening_balance;
        if ($opening > 0) {
            $this->postCustomerLedger(
                $user->tenant_id,
                $customer->id,
                'opening_balance',
                $opening,
                0.0,
                now(),
                $user->id,
                note: 'Opening outstanding balance',
            );
        }

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
            'status' => $data['status'] ?? $customer->status,
        ]);

        if (array_key_exists('current_balance', $data) && $data['current_balance'] !== null) {
            $this->setOutstandingBalance($user, $customer, (float) $data['current_balance']);
        }

        AuditService::log($user, 'updated', 'customers', 'customer', $customer->id, $old, $customer->only(['name', 'phone', 'status']));

        return $customer;
    }

    public function delete(User $user, Customer $customer): void
    {
        AuditService::log($user, 'deleted', 'customers', 'customer', $customer->id, $customer->only(['name', 'phone']), null);
        $this->customers->delete($customer);
    }

    /**
     * Move the customer's outstanding balance to $target by appending a single
     * correcting entry, leaving the entries already on the ledger untouched.
     */
    protected function setOutstandingBalance(User $user, Customer $customer, float $target): void
    {
        $target = $this->money($target);
        $current = $this->ledger->balanceForCustomer($user->tenant_id, $customer->id);
        $delta = $this->money($target - $current);

        if (abs($delta) < 0.005) {
            return;
        }

        $this->postCustomerLedger(
            $user->tenant_id,
            $customer->id,
            'balance_adjustment',
            $delta > 0 ? $delta : 0.0,
            $delta < 0 ? abs($delta) : 0.0,
            now(),
            $user->id,
            note: 'Outstanding balance corrected from '.number_format($current, 2).' to '.number_format($target, 2),
        );
    }
}
