<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Catalog\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Repositories\CategoryRepository;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryRepository $categories,
        private readonly CategoryService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $categories = $this->categories->paginateForTenant($this->tenantId(), $request->integer('per_page', 25));

        return $this->success(CategoryResource::collection($categories)->response()->getData(true), 'Categories retrieved.');
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $category = $this->service->create($request->user(), $request->validated());

        return $this->created(new CategoryResource($category), 'Category created.');
    }

    public function show($category): JsonResponse
    {
        $model = $this->findOrFail($this->categories->findForTenant($this->tenantId(), $category));

        return $this->success(new CategoryResource($model), 'Category retrieved.');
    }

    public function update(CategoryRequest $request, $category): JsonResponse
    {
        $model = $this->findOrFail($this->categories->findForTenant($this->tenantId(), $category));

        $updated = $this->service->update($request->user(), $model, $request->validated());

        return $this->success(new CategoryResource($updated), 'Category updated.');
    }

    public function destroy($category): JsonResponse
    {
        $model = $this->findOrFail($this->categories->findForTenant($this->tenantId(), $category));

        $this->service->delete(request()->user(), $model);

        return $this->deleted('Category deleted.');
    }
}
