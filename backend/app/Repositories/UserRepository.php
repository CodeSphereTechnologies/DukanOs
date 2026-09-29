<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Concerns\ScopesByTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository extends BaseRepository
{
    use ScopesByTenant;

    protected function modelClass(): string
    {
        return User::class;
    }

    /**
     * Paginate users, optionally scoped to a tenant.
     *
     * A null $tenantId lifts the scope, which is only reachable by super
     * admins. Store users must always pass their own tenant id.
     */
    public function paginateScoped(?int $tenantId, int $perPage = 25, ?string $search = null): LengthAwarePaginator
    {
        return $this->query()
            ->with(['role', 'tenant'])
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->when($search, function ($q) use ($search) {
                $needle = '%'.mb_strtolower($search).'%';
                $q->where(function ($q) use ($needle) {
                    $q->whereRaw('LOWER(name) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
                });
            })
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?string $search = null): LengthAwarePaginator
    {
        return $this->paginateScoped($tenantId, $perPage, $search);
    }

    /**
     * Find a user by id, optionally constrained to a tenant.
     */
    public function findScoped(?int $tenantId, int $id): ?User
    {
        return $this->query()
            ->with(['role', 'tenant'])
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->find($id);
    }

    public function findForTenant(int $tenantId, int $id): ?User
    {
        return $this->findScoped($tenantId, $id);
    }

    public function existsEmail(string $email, ?int $exceptId = null): bool
    {
        return $this->query()
            ->where('email', $email)
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }
}
