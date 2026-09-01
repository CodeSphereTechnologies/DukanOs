<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Catalog\BrandRequest;
use App\Http\Resources\BrandResource;
use App\Repositories\BrandRepository;
use App\Services\BrandService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function __construct(
        private readonly BrandRepository $brands,
        private readonly BrandService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $brands = $this->brands->paginateForTenant($this->tenantId(), $request->integer('per_page', 25));

        return $this->success(BrandResource::collection($brands)->response()->getData(true), 'Brands retrieved.');
    }

    public function store(BrandRequest $request): JsonResponse
    {
        $brand = $this->service->create($request->user(), $request->validated());

        return $this->created(new BrandResource($brand), 'Brand created.');
    }

    public function show($brand): JsonResponse
    {
        $model = $this->findOrFail($this->brands->findForTenant($this->tenantId(), $brand));

        return $this->success(new BrandResource($model), 'Brand retrieved.');
    }

    public function update(BrandRequest $request, $brand): JsonResponse
    {
        $model = $this->findOrFail($this->brands->findForTenant($this->tenantId(), $brand));

        return $this->success(new BrandResource($this->service->update($request->user(), $model, $request->validated())), 'Brand updated.');
    }

    public function destroy($brand): JsonResponse
    {
        $model = $this->findOrFail($this->brands->findForTenant($this->tenantId(), $brand));

        $this->service->delete(request()->user(), $model);

        return $this->deleted('Brand deleted.');
    }
}
