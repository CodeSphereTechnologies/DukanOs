<?php

namespace App\Http\Controllers\Api\V1\Customers;

use App\Http\Controllers\Api\V1\Controller;
use App\Models\Customer;
use App\Models\CustomerLedger;
use App\Services\AuditService;
use App\Services\Concerns\PostsAccounting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerLedgerAdjustmentController extends Controller
{
    use PostsAccounting;

    public function store(Request $request, $customer): JsonResponse
    {
        $request->validate([
            'amount' => ['required', 'numeric', 'gt:0'],
            'type' => ['required', 'in:add,subtract'],
            'description' => ['required', 'string', 'max:255'],
        ]);

        $model = $this->findOrFail(Customer::where('tenant_id', $this->tenantId())->find($customer));
        $user = $request->user();

        $amount = (float) $request->amount;
        $isAdd = $request->type === 'add';

        // Add = debit (customer owes more)
        // Subtract = credit (customer owes less / pays)
        $debit = $isAdd ? $amount : 0.0;
        $credit = ! $isAdd ? $amount : 0.0;

        $this->postCustomerLedger(
            $this->tenantId(),
            $model->id,
            'manual_adjustment',
            $debit,
            $credit,
            now(),
            $user->id,
            Customer::class,
            $model->id,
            $request->description
        );

        AuditService::log(
            $user, 
            'adjusted_ledger', 
            'customers', 
            'customer_ledger', 
            $model->id, 
            null, 
            ['type' => $request->type, 'amount' => $amount, 'description' => $request->description]
        );

        $latestEntry = CustomerLedger::where('tenant_id', $this->tenantId())
            ->where('customer_id', $model->id)
            ->latest('id')
            ->first();

        return $this->created([
            'message' => 'Ledger adjusted successfully.',
            'entry' => $latestEntry
        ]);
    }
}
