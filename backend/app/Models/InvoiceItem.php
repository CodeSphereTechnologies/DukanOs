<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id', 'invoice_id', 'product_id', 'name', 'sku', 'barcode',
    'quantity', 'unit', 'unit_price', 'discount_type', 'discount_value',
    'discount_amount', 'line_total', 'cost_price',
])]
class InvoiceItem extends Model
{
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
