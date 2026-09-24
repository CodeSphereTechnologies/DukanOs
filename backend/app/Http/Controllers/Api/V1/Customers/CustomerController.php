<?php

namespace App\Http\Controllers\Api\V1\Customers;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Customers\CustomerRequest;
use App\Http\Resources\CustomerLedgerResource;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Repositories\CustomerLedgerRepository;
use App\Repositories\CustomerRepository;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerRepository $customers,
        private readonly CustomerLedgerRepository $ledger,
        private readonly CustomerService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $customers = $this->customers->paginateForTenant($this->tenantId(), $request->integer('per_page', 25), $request->query('search'));

        $customers->getCollection()->transform(function ($customer) {
            $customer->setAttribute('balance', $this->ledger->balanceForCustomer($this->tenantId(), $customer->id));
            return $customer;
        });

        return $this->success(CustomerResource::collection($customers)->response()->getData(true), 'Customers retrieved.');
    }

    public function store(CustomerRequest $request): JsonResponse
    {
        $customer = $this->service->create($request->user(), $request->validated());

        return $this->created(new CustomerResource($customer), 'Customer created.');
    }

    public function show($customer): JsonResponse
    {
        $model = $this->findOrFail($this->customers->findForTenant($this->tenantId(), $customer));

        $model->setAttribute('balance', $this->ledger->balanceForCustomer($this->tenantId(), $customer));

        return $this->success(new CustomerResource($model), 'Customer retrieved.');
    }

    public function update(CustomerRequest $request, $customer): JsonResponse
    {
        $model = $this->findOrFail($this->customers->findForTenant($this->tenantId(), $customer));

        return $this->success(new CustomerResource($this->service->update($request->user(), $model, $request->validated())), 'Customer updated.');
    }

    public function destroy($customer): JsonResponse
    {
        $model = $this->findOrFail($this->customers->findForTenant($this->tenantId(), $customer));

        $this->service->delete(request()->user(), $model);

        return $this->deleted('Customer deleted.');
    }

    /**
     * Customer ledger (running balance entries).
     */
    public function ledger(Request $request, $customer): JsonResponse
    {
        $this->findOrFail($this->customers->findForTenant($this->tenantId(), $customer));

        $entries = $this->ledger->paginateForCustomer($this->tenantId(), $customer, $request->integer('per_page', 25));

        $data = CustomerLedgerResource::collection($entries)->response()->getData(true);
        $data['balance'] = $this->ledger->balanceForCustomer($this->tenantId(), $customer);

        return $this->success($data, 'Customer ledger retrieved.');
    }

    /**
     * Purchase history (invoices) for a customer.
     */
    public function invoices(Request $request, $customer): JsonResponse
    {
        $this->findOrFail($this->customers->findForTenant($this->tenantId(), $customer));

        $invoices = Invoice::query()
            ->where('tenant_id', $this->tenantId())
            ->where('customer_id', $customer)
            ->with(['items', 'payments'])
            ->orderByDesc('invoice_date')
            ->paginate($request->integer('per_page', 25));

        return $this->success(InvoiceResource::collection($invoices)->response()->getData(true), 'Purchase history retrieved.');
    }
}
