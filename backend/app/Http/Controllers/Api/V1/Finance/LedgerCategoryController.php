<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Finance\LedgerCategoryRequest;
use App\Http\Resources\LedgerCategoryResource;
use App\Repositories\LedgerCategoryRepository;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LedgerCategoryController extends Controller
{
    public function __construct(
        private readonly LedgerCategoryRepository $categories,
        private readonly LedgerService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $categories = $this->categories->allForTenant($this->tenantId(), $request->query('type'));

        return $this->success(LedgerCategoryResource::collection($categories), 'Ledger categories retrieved.');
    }

    public function store(LedgerCategoryRequest $request): JsonResponse
    {
        $category = $this->service->createCategory($request->user(), $request->validated());

        return $this->created(new LedgerCategoryResource($category), 'Category created.');
    }

    public function update(LedgerCategoryRequest $request, $category): JsonResponse
    {
        $model = $this->findOrFail($this->categories->findForTenant($this->tenantId(), $category));

        return $this->success(new LedgerCategoryResource($this->service->updateCategory($request->user(), $model, $request->validated())), 'Category updated.');
    }

    public function destroy($category): JsonResponse
    {
        $model = $this->findOrFail($this->categories->findForTenant($this->tenantId(), $category));

        $this->service->deleteCategory(request()->user(), $model);

        return $this->deleted('Category deleted.');
    }
}
