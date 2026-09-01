<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'tenant_id', 'category_id', 'brand_id', 'name', 'sku', 'barcode',
    'model_number', 'description', 'unit', 'purchase_cost', 'selling_price',
    'min_selling_price', 'image', 'status',
])]
class Product extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'purchase_cost' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'min_selling_price' => 'decimal:2',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function specificationValues(): HasMany
    {
        return $this->hasMany(ProductSpecificationValue::class);
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(Inventory::class);
    }

    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function quotationItems(): HasMany
    {
        return $this->hasMany(QuotationItem::class);
    }
}
