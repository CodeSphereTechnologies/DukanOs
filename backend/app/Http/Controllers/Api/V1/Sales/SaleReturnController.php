<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Sales\SaleReturnRequest;
use App\Http\Resources\SaleReturnResource;
use App\Repositories\SaleReturnRepository;
use App\Services\SaleReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleReturnController extends Controller
{
    public function __construct(
        private readonly SaleReturnRepository $returns,
        private readonly SaleReturnService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $returns = $this->returns->paginateForTenant($this->tenantId(), $request->integer('per_page', 25), $request->integer('invoice_id') ?: null);

        return $this->success(SaleReturnResource::collection($returns)->response()->getData(true), 'Returns retrieved.');
    }

    public function store(SaleReturnRequest $request): JsonResponse
    {
        $saleReturn = $this->service->create($request->user(), $request->validated());

        return $this->created(new SaleReturnResource($saleReturn), 'Return created.');
    }

    public function show($return): JsonResponse
    {
        $model = $this->findOrFail($this->returns->findForTenant($this->tenantId(), $return));

        return $this->success(new SaleReturnResource($model), 'Return retrieved.');
    }
}
