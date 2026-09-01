<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Admin\TenantRequest;
use App\Http\Resources\TenantResource;
use App\Repositories\TenantRepository;
use App\Services\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function __construct(
        private readonly TenantRepository $tenants,
        private readonly TenantService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tenants = $this->tenants->paginate($request->integer('per_page', 25), $request->query('search'), $request->query('status'));

        return $this->success(TenantResource::collection($tenants)->response()->getData(true), 'Tenants retrieved.');
    }

    public function store(TenantRequest $request): JsonResponse
    {
        $tenant = $this->service->create($request->user(), $request->validated());

        return $this->created(new TenantResource($tenant), 'Tenant created.');
    }

    public function show($tenant): JsonResponse
    {
        $model = $this->findOrFail($this->tenants->find($tenant));

        return $this->success(new TenantResource($model), 'Tenant retrieved.');
    }

    public function update(TenantRequest $request, $tenant): JsonResponse
    {
        $model = $this->findOrFail($this->tenants->find($tenant));

        return $this->success(new TenantResource($this->service->update($request->user(), $model, $request->validated())), 'Tenant updated.');
    }

    public function destroy($tenant): JsonResponse
    {
        $model = $this->findOrFail($this->tenants->find($tenant));

        $this->service->delete(request()->user(), $model);

        return $this->deleted('Tenant deleted.');
    }
}
