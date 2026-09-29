<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Admin\UserStatusRequest;
use App\Http\Requests\Admin\UserStoreRequest;
use App\Http\Requests\Admin\UserUpdateRequest;
use App\Http\Resources\UserResource;
use App\Repositories\UserRepository;
use App\Services\AuditService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly UserService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $users = $this->users->paginateScoped(
            $this->scopeTenantId($request),
            $request->integer('per_page', 25),
            $request->query('search'),
        );

        return $this->success(UserResource::collection($users)->response()->getData(true), 'Users retrieved.');
    }

    public function store(UserStoreRequest $request): JsonResponse
    {
        $result = $this->service->create($request->user(), $request->validated());

        // The account is created either way, but when the invitation cannot be
        // delivered the caller has to be told: it is the only place the initial
        // password is disclosed. Report the failure and hand the password back
        // so onboarding can still be completed by hand.
        if (! $result->invitationSent) {
            return $this->created(
                (new UserResource($result->user))->resolve($request) + [
                    'invitation_sent' => false,
                    'temporary_password' => $result->recoveryPassword(),
                ],
                'User created, but the invitation email could not be sent. Share the temporary password manually.',
            );
        }

        return $this->created(
            (new UserResource($result->user))->resolve($request) + ['invitation_sent' => true],
            'User created. Sign-in credentials were emailed.',
        );
    }

    public function show(Request $request, $user): JsonResponse
    {
        $model = $this->findOrFail($this->users->findScoped($this->scopeTenantId($request), (int) $user));

        return $this->success(new UserResource($model->load(['role', 'tenant'])), 'User retrieved.');
    }

    public function update(UserUpdateRequest $request, $user): JsonResponse
    {
        $model = $this->findOrFail($this->users->findScoped($this->scopeTenantId($request), (int) $user));

        return $this->success(new UserResource($this->service->update($request->user(), $model, $request->validated())), 'User updated.');
    }

    /**
     * Toggle a user's access without touching their other details.
     */
    public function updateStatus(UserStatusRequest $request, $user): JsonResponse
    {
        $model = $this->findOrFail($this->users->findScoped($this->scopeTenantId($request), (int) $user));

        if ($model->id === $request->user()->id) {
            throw ValidationException::withMessages(['status' => ['You cannot change your own access status.']]);
        }

        $old = ['status' => $model->status];

        $model->update(['status' => $request->validated()['status']]);

        AuditService::log(
            $request->user(),
            'updated',
            'users',
            'user',
            $model->id,
            $old,
            ['status' => $model->status],
        );

        return $this->success(new UserResource($model->fresh(['role', 'tenant'])), 'User status updated.');
    }

    public function destroy(Request $request, $user): JsonResponse
    {
        $model = $this->findOrFail($this->users->findScoped($this->scopeTenantId($request), (int) $user));

        $this->service->delete($request->user(), $model);

        return $this->deleted('User deleted.');
    }

    /**
     * The tenant a user lookup is confined to.
     *
     * Store users are pinned to their own tenant. Super admins have no tenant,
     * so they may narrow the scope with ?tenant_id= and otherwise see everyone.
     */
    private function scopeTenantId(Request $request): ?int
    {
        if (! $request->user()->isSuperAdmin()) {
            return $this->tenantId();
        }

        return $request->integer('tenant_id') ?: null;
    }
}
