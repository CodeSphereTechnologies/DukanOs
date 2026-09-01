<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Finance\DailyTransactionRequest;
use App\Http\Resources\DailyTransactionResource;
use App\Repositories\DailyTransactionRepository;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DailyTransactionController extends Controller
{
    public function __construct(
        private readonly DailyTransactionRepository $transactions,
        private readonly LedgerService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $transactions = $this->transactions->paginateForTenant(
            $this->tenantId(),
            $request->integer('per_page', 25),
            $request->query('type'),
            $request->integer('category_id') ?: null,
            $request->query('from'),
            $request->query('to'),
        );

        return $this->success(DailyTransactionResource::collection($transactions)->response()->getData(true), 'Transactions retrieved.');
    }

    public function store(DailyTransactionRequest $request): JsonResponse
    {
        $transaction = $this->service->recordTransaction($request->user(), $request->validated());

        return $this->created(new DailyTransactionResource($transaction->load(['category', 'creator'])), 'Transaction recorded.');
    }
}
