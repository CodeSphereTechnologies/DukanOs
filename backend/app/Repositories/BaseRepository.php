<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

abstract class BaseRepository
{
    /**
     * The fully-qualified model class name managed by this repository.
     */
    abstract protected function modelClass(): string;

    protected function query(): Builder
    {
        return $this->modelClass()::query();
    }

    public function find(int $id): ?Model
    {
        return $this->query()->find($id);
    }

    public function create(array $attributes): Model
    {
        return $this->query()->create($attributes);
    }

    public function update(Model $model, array $attributes): Model
    {
        $model->update($attributes);

        return $model;
    }

    public function delete(Model $model): bool
    {
        return (bool) $model->delete();
    }
}
