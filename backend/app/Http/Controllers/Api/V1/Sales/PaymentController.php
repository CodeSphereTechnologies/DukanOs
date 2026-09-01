<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Sales\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Repositories\PaymentRepository;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentRepository $payments,
        private readonly PaymentService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $payments = $this->payments->paginateForTenant(
            $this->tenantId(),
            $request->integer('per_page', 25),
            $request->integer('customer_id') ?: null,
            $request->integer('invoice_id') ?: null,
        );

        return $this->success(PaymentResource::collection($payments)->response()->getData(true), 'Payments retrieved.');
    }

    public function store(PaymentRequest $request): JsonResponse
    {
        $payment = $this->service->record($request->user(), $request->validated());

        return $this->created(new PaymentResource($payment), 'Payment recorded.');
    }

    public function show($payment): JsonResponse
    {
        $model = $this->findOrFail($this->payments->findForTenant($this->tenantId(), $payment));

        return $this->success(new PaymentResource($model), 'Payment retrieved.');
    }
}
