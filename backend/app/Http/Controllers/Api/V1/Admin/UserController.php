<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Admin\UserStoreRequest;
use App\Http\Requests\Admin\UserUpdateRequest;
use App\Http\Resources\UserResource;
use App\Repositories\UserRepository;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly UserService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $users = $this->users->paginateForTenant($this->tenantId(), $request->integer('per_page', 25), $request->query('search'));

        return $this->success(UserResource::collection($users)->response()->getData(true), 'Users retrieved.');
    }

    public function store(UserStoreRequest $request): JsonResponse
    {
        $user = $this->service->create($request->user(), $request->validated());

        return $this->created(new UserResource($user), 'User created.');
    }

    public function show($user): JsonResponse
    {
        $model = $this->findOrFail($this->users->findForTenant($this->tenantId(), $user));

        return $this->success(new UserResource($model->load(['role', 'tenant'])), 'User retrieved.');
    }

    public function update(UserUpdateRequest $request, $user): JsonResponse
    {
        $model = $this->findOrFail($this->users->findForTenant($this->tenantId(), $user));

        return $this->success(new UserResource($this->service->update($request->user(), $model, $request->validated())), 'User updated.');
    }

    public function destroy($user): JsonResponse
    {
        $model = $this->findOrFail($this->users->findForTenant($this->tenantId(), $user));

        $this->service->delete(request()->user(), $model);

        return $this->deleted('User deleted.');
    }
}
