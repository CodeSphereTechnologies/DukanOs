<?php

namespace App\Repositories;

use App\Models\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TenantRepository extends BaseRepository
{
    protected function modelClass(): string
    {
        return Tenant::class;
    }

    public function paginate(int $perPage = 25, ?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        return $this->query()
            ->withCount('users')
            ->when($search, fn ($q) => $q->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%']))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function find(int $id): ?Tenant
    {
        return $this->query()->withCount('users')->find($id);
    }

    public function existsBySlug(string $slug, ?int $exceptId = null): bool
    {
        return $this->query()
            ->where('slug', $slug)
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }
}
