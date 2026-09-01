<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Catalog\SpecificationRequest;
use App\Http\Resources\SpecificationResource;
use App\Repositories\SpecificationRepository;
use App\Services\SpecificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpecificationController extends Controller
{
    public function __construct(
        private readonly SpecificationRepository $specifications,
        private readonly SpecificationService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $specs = $this->specifications->paginate($request->integer('per_page', 25));

        return $this->success(SpecificationResource::collection($specs)->response()->getData(true), 'Specifications retrieved.');
    }

    public function store(SpecificationRequest $request): JsonResponse
    {
        $spec = $this->service->create($request->user(), $request->validated());

        return $this->created(new SpecificationResource($spec), 'Specification created.');
    }

    public function show($specification): JsonResponse
    {
        $model = $this->findOrFail($this->specifications->find($specification));

        return $this->success(new SpecificationResource($model), 'Specification retrieved.');
    }

    public function update(SpecificationRequest $request, $specification): JsonResponse
    {
        $model = $this->findOrFail($this->specifications->find($specification));

        return $this->success(new SpecificationResource($this->service->update($request->user(), $model, $request->validated())), 'Specification updated.');
    }

    public function destroy($specification): JsonResponse
    {
        $model = $this->findOrFail($this->specifications->find($specification));

        $this->service->delete(request()->user(), $model);

        return $this->deleted('Specification deleted.');
    }
}
