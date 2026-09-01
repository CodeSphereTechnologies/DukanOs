<?php

namespace App\Repositories;

use App\Models\Specification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class SpecificationRepository extends BaseRepository
{
    protected function modelClass(): string
    {
        return Specification::class;
    }

    /**
     * @return Collection<int, Specification>
     */
    public function all(): Collection
    {
        return $this->query()->with('values')->orderBy('sort_order')->get();
    }

    public function paginate(int $perPage = 25): LengthAwarePaginator
    {
        return $this->query()->with('values')->orderBy('sort_order')->paginate($perPage);
    }

    public function find(int $id): ?Specification
    {
        return $this->query()->with('values')->find($id);
    }

    public function existsBySlug(string $slug, ?int $exceptId = null): bool
    {
        return $this->query()
            ->where('slug', $slug)
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }
}
