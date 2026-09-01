<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name', 'slug', 'data_type', 'unit', 'is_required', 'is_filterable',
    'sort_order', 'status',
])]
class Specification extends Model
{
    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'is_filterable' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function values(): HasMany
    {
        return $this->hasMany(SpecificationValue::class);
    }

    public function productSpecificationValues(): HasMany
    {
        return $this->hasMany(ProductSpecificationValue::class);
    }
}
