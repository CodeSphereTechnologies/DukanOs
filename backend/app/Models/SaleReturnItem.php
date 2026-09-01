<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id', 'return_id', 'invoice_item_id', 'product_id', 'quantity',
    'unit_price', 'amount', 'reason',
])]
class SaleReturnItem extends Model
{
    protected $table = 'return_items';

    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class, 'return_id');
    }

    public function invoiceItem(): BelongsTo
    {
        return $this->belongsTo(InvoiceItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
