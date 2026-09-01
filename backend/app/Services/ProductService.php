<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductSpecificationValue;
use App\Models\User;
use App\Repositories\ProductRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public function __construct(private readonly ProductRepository $products) {}

    public function create(User $user, array $data): Product
    {
        $tenantId = $user->tenant_id;

        return DB::transaction(function () use ($tenantId, $user, $data) {
            if ($this->products->existsForTenant($tenantId, $data['sku'])) {
                throw ValidationException::withMessages(['sku' => ['This SKU already exists for your store.']]);
            }

            if (! empty($data['barcode']) && $this->products->existsByBarcode($tenantId, $data['barcode'])) {
                throw ValidationException::withMessages(['barcode' => ['This barcode already exists for your store.']]);
            }

            $product = Product::create([
                'tenant_id' => $tenantId,
                'category_id' => $data['category_id'] ?? null,
                'brand_id' => $data['brand_id'] ?? null,
                'name' => $data['name'],
                'sku' => $data['sku'],
                'barcode' => $data['barcode'] ?? null,
                'model_number' => $data['model_number'] ?? null,
                'description' => $data['description'] ?? null,
                'unit' => $data['unit'] ?? 'pc',
                'purchase_cost' => (float) ($data['purchase_cost'] ?? 0),
                'selling_price' => (float) ($data['selling_price'] ?? 0),
                'min_selling_price' => isset($data['min_selling_price']) ? (float) $data['min_selling_price'] : null,
                'status' => $data['status'] ?? 'active',
            ]);

            $this->syncSpecifications($product, $data['specifications'] ?? []);

            $this->seedInventory($tenantId, $product, $data);

            AuditService::log($user, 'created', 'products', 'product', $product->id, null, $product->only(['name', 'sku']));

            return $this->products->findForTenant($tenantId, $product->id);
        });
    }

    public function update(User $user, Product $product, array $data): Product
    {
        $tenantId = $user->tenant_id;

        return DB::transaction(function () use ($tenantId, $user, $product, $data) {
            if ($this->products->existsForTenant($tenantId, $data['sku'], $product->id)) {
                throw ValidationException::withMessages(['sku' => ['This SKU already exists for your store.']]);
            }

            if (! empty($data['barcode']) && $this->products->existsByBarcode($tenantId, $data['barcode'], $product->id)) {
                throw ValidationException::withMessages(['barcode' => ['This barcode already exists for your store.']]);
            }

            $old = $product->only(['name', 'sku', 'selling_price', 'purchase_cost', 'status']);

            $product->update([
                'category_id' => $data['category_id'] ?? $product->category_id,
                'brand_id' => $data['brand_id'] ?? $product->brand_id,
                'name' => $data['name'],
                'sku' => $data['sku'],
                'barcode' => $data['barcode'] ?? $product->barcode,
                'model_number' => $data['model_number'] ?? $product->model_number,
                'description' => $data['description'] ?? $product->description,
                'unit' => $data['unit'] ?? $product->unit,
                'purchase_cost' => (float) ($data['purchase_cost'] ?? $product->purchase_cost),
                'selling_price' => (float) ($data['selling_price'] ?? $product->selling_price),
                'min_selling_price' => isset($data['min_selling_price']) ? (float) $data['min_selling_price'] : $product->min_selling_price,
                'status' => $data['status'] ?? $product->status,
            ]);

            if (array_key_exists('specifications', $data)) {
                $product->specificationValues()->delete();
                $this->syncSpecifications($product, $data['specifications']);
            }

            if (isset($data['min_quantity_threshold']) && $product->inventory) {
                $product->inventory->update(['min_quantity_threshold' => (float) $data['min_quantity_threshold']]);
            }

            $new = $product->fresh()->only(['name', 'sku', 'selling_price', 'purchase_cost', 'status']);

            AuditService::log($user, 'updated', 'products', 'product', $product->id, $old, $new);

            return $this->products->findForTenant($tenantId, $product->id);
        });
    }

    public function delete(User $user, Product $product): void
    {
        $product->update(['status' => 'deleted']);
        $product->delete();

        AuditService::log($user, 'deleted', 'products', 'product', $product->id, $product->only(['name', 'sku']), null);
    }

    private function syncSpecifications(Product $product, array $specifications): void
    {
        foreach ($specifications as $spec) {
            $value = $spec['value'] ?? null;
            $specValueId = $spec['specification_value_id'] ?? null;

            ProductSpecificationValue::create([
                'product_id' => $product->id,
                'specification_id' => $spec['specification_id'],
                'specification_value_id' => $specValueId,
                'value' => $specValueId ? null : $value,
            ]);
        }
    }

    private function seedInventory(int $tenantId, Product $product, array $data): void
    {
        $quantity = (float) ($data['opening_quantity'] ?? 0);
        $threshold = (float) ($data['min_quantity_threshold'] ?? 0);

        if ($quantity > 0) {
            Inventory::create([
                'tenant_id' => $tenantId,
                'product_id' => $product->id,
                'quantity' => $quantity,
                'min_quantity_threshold' => $threshold,
            ]);

            InventoryTransaction::create([
                'tenant_id' => $tenantId,
                'product_id' => $product->id,
                'type' => 'in',
                'quantity' => $quantity,
                'before_quantity' => 0,
                'after_quantity' => $quantity,
                'notes' => 'Opening stock',
            ]);
        } else {
            Inventory::create([
                'tenant_id' => $tenantId,
                'product_id' => $product->id,
                'quantity' => 0,
                'min_quantity_threshold' => $threshold,
            ]);
        }
    }
}
