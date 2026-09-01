<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Sales\QuotationConvertRequest;
use App\Http\Requests\Sales\QuotationRequest;
use App\Http\Requests\Sales\QuotationStatusRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\QuotationResource;
use App\Repositories\QuotationRepository;
use App\Services\QuotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotationController extends Controller
{
    public function __construct(
        private readonly QuotationRepository $quotations,
        private readonly QuotationService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $quotations = $this->quotations->paginateForTenant($this->tenantId(), $request->integer('per_page', 25), $request->query('search'), $request->query('status'));

        return $this->success(QuotationResource::collection($quotations)->response()->getData(true), 'Quotations retrieved.');
    }

    public function store(QuotationRequest $request): JsonResponse
    {
        $quotation = $this->service->create($request->user(), $request->validated());

        return $this->created(new QuotationResource($quotation), 'Quotation created.');
    }

    public function show($quotation): JsonResponse
    {
        $model = $this->findOrFail($this->quotations->findForTenant($this->tenantId(), $quotation));

        return $this->success(new QuotationResource($model), 'Quotation retrieved.');
    }

    /**
     * Update quotation status (draft/sent/accepted/rejected/expired).
     */
    public function updateStatus(QuotationStatusRequest $request, $quotation): JsonResponse
    {
        $model = $this->findOrFail($this->quotations->findForTenant($this->tenantId(), $quotation));

        return $this->success(new QuotationResource($this->service->updateStatus($request->user(), $model, $request->input('status'))), 'Quotation status updated.');
    }

    /**
     * Convert a quotation into an invoice.
     */
    public function convert(QuotationConvertRequest $request, $quotation): JsonResponse
    {
        $model = $this->findOrFail($this->quotations->findForTenant($this->tenantId(), $quotation));

        $invoice = $this->service->convert($request->user(), $model, $request->validated());

        return $this->created(new InvoiceResource($invoice), 'Quotation converted to invoice.');
    }
}
