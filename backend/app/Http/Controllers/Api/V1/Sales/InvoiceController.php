<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Sales\InvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Repositories\InvoiceRepository;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly InvoiceRepository $invoices,
        private readonly InvoiceService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $invoices = $this->invoices->paginateForTenant(
            $this->tenantId(),
            $request->integer('per_page', 25),
            $request->query('search'),
            $request->integer('customer_id') ?: null,
            $request->query('payment_status'),
            $request->query('from'),
            $request->query('to'),
        );

        return $this->success(InvoiceResource::collection($invoices)->response()->getData(true), 'Invoices retrieved.');
    }

    public function store(InvoiceRequest $request): JsonResponse
    {
        $invoice = $this->service->create($request->user(), $request->validated());

        return $this->created(new InvoiceResource($invoice), 'Invoice created.');
    }

    public function show($invoice): JsonResponse
    {
        $model = $this->findOrFail($this->invoices->findForTenant($this->tenantId(), $invoice));

        return $this->success(new InvoiceResource($model), 'Invoice retrieved.');
    }

    /**
     * Void an invoice (restores stock).
     */
    public function void(Request $request, $invoice): JsonResponse
    {
        $model = $this->findOrFail($this->invoices->findForTenant($this->tenantId(), $invoice));

        $voided = $this->service->void($request->user(), $model);

        return $this->success(new InvoiceResource($voided), 'Invoice voided.');
    }
}
