<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Inventory\InventoryAdjustRequest;
use App\Http\Resources\InventoryResource;
use App\Http\Resources\InventoryTransactionResource;
use App\Repositories\InventoryRepository;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryRepository $inventory,
        private readonly InventoryService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $items = $this->inventory->paginateForTenant(
            $this->tenantId(),
            $request->integer('per_page', 25),
            $request->query('search'),
            $request->boolean('low_stock'),
        );

        return $this->success(InventoryResource::collection($items)->response()->getData(true), 'Inventory retrieved.');
    }

    public function transactions(Request $request, $product): JsonResponse
    {
        $transactions = $this->inventory->transactionPaginate($this->tenantId(), $product, $request->integer('per_page', 25));

        return $this->success(InventoryTransactionResource::collection($transactions)->response()->getData(true), 'Stock movements retrieved.');
    }

    public function adjust(InventoryAdjustRequest $request, $product): JsonResponse
    {
        $this->service->adjust($request->user(), $product, (float) $request->input('delta'), $request->input('note'));

        return $this->success(null, 'Stock adjusted.');
    }
}
