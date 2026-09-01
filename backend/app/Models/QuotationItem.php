<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id', 'quotation_id', 'product_id', 'name', 'sku', 'quantity',
    'unit', 'unit_price', 'discount_type', 'discount_value', 'discount_amount',
    'line_total',
])]
class QuotationItem extends Model
{
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
