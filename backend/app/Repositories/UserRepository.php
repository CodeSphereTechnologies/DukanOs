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

    public function paginateForTenant(int $tenantId, int $perPage = 25, ?string $search = null): LengthAwarePaginator
    {
        return $this->tenantQuery($tenantId)
            ->with('role')
            ->when($search, function ($q) use ($search) {
                $needle = '%'.mb_strtolower($search).'%';
                $q->whereRaw('LOWER(name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
            })
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForTenant(int $tenantId, int $id): ?User
    {
        return $this->tenantQuery($tenantId)->with('role')->find($id);
    }

    public function existsEmail(string $email, ?int $exceptId = null): bool
    {
        return $this->query()
            ->where('email', $email)
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }
}
