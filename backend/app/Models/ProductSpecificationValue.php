<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_id', 'specification_id', 'specification_value_id', 'value'])]
class ProductSpecificationValue extends Model
{
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function specification(): BelongsTo
    {
        return $this->belongsTo(Specification::class);
    }

    public function specificationValue(): BelongsTo
    {
        return $this->belongsTo(SpecificationValue::class);
    }
}
