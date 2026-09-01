<?php

namespace App\Services;

use App\Models\Specification;
use App\Models\SpecificationValue;
use App\Models\User;
use App\Repositories\SpecificationRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SpecificationService
{
    public function __construct(private readonly SpecificationRepository $specifications) {}

    public function create(User $user, array $data): Specification
    {
        return DB::transaction(function () use ($user, $data) {
            if ($this->specifications->existsBySlug($data['slug'])) {
                throw ValidationException::withMessages(['slug' => ['This slug is already in use.']]);
            }

            $specification = $this->specifications->create([
                'name' => $data['name'],
                'slug' => $data['slug'],
                'data_type' => $data['data_type'] ?? 'text',
                'unit' => $data['unit'] ?? null,
                'is_required' => (bool) ($data['is_required'] ?? false),
                'is_filterable' => (bool) ($data['is_filterable'] ?? false),
                'sort_order' => (int) ($data['sort_order'] ?? 0),
                'status' => $data['status'] ?? 'active',
            ]);

            $this->syncValues($specification, $data['values'] ?? []);

            AuditService::log($user, 'created', 'specifications', 'specification', $specification->id, null, $specification->only(['name', 'slug']));

            return $this->specifications->find($specification->id);
        });
    }

    public function update(User $user, Specification $specification, array $data): Specification
    {
        return DB::transaction(function () use ($user, $specification, $data) {
            if ($this->specifications->existsBySlug($data['slug'], $specification->id)) {
                throw ValidationException::withMessages(['slug' => ['This slug is already in use.']]);
            }

            $old = $specification->only(['name', 'slug', 'data_type', 'status']);

            $specification->update([
                'name' => $data['name'],
                'slug' => $data['slug'],
                'data_type' => $data['data_type'] ?? $specification->data_type,
                'unit' => $data['unit'] ?? $specification->unit,
                'is_required' => (bool) ($data['is_required'] ?? $specification->is_required),
                'is_filterable' => (bool) ($data['is_filterable'] ?? $specification->is_filterable),
                'sort_order' => (int) ($data['sort_order'] ?? $specification->sort_order),
                'status' => $data['status'] ?? $specification->status,
            ]);

            if (array_key_exists('values', $data)) {
                $specification->values()->delete();
                $this->syncValues($specification, $data['values']);
            }

            AuditService::log($user, 'updated', 'specifications', 'specification', $specification->id, $old, $specification->only(['name', 'slug', 'data_type', 'status']));

            return $this->specifications->find($specification->id);
        });
    }

    public function delete(User $user, Specification $specification): void
    {
        AuditService::log($user, 'deleted', 'specifications', 'specification', $specification->id, $specification->only(['name', 'slug']), null);
        $this->specifications->delete($specification);
    }

    private function syncValues(Specification $specification, array $values): void
    {
        foreach ($values as $index => $value) {
            SpecificationValue::create([
                'specification_id' => $specification->id,
                'value' => $value,
                'sort_order' => $index,
            ]);
        }
    }
}
