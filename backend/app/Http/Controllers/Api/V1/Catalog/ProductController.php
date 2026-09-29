<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Catalog\ProductImageUploadRequest;
use App\Http\Requests\Catalog\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Repositories\ProductRepository;
use App\Services\ProductImageService;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductRepository $products,
        private readonly ProductService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $products = $this->products->paginateForTenant(
            $this->tenantId(),
            $request->integer('per_page', 25),
            $request->query('search'),
            $request->integer('category_id') ?: null,
            $request->integer('brand_id') ?: null,
            $request->query('status'),
        );

        return $this->success(ProductResource::collection($products)->response()->getData(true), 'Products retrieved.');
    }

    /**
     * Accept a multipart image upload and return a public URL for it.
     *
     * The product endpoints persist products.image as a varchar(255), so a
     * data URL for a real photo cannot be stored. Uploading separately keeps
     * that column holding a short path.
     */
    public function uploadImage(ProductImageUploadRequest $request, ProductImageService $images): JsonResponse
    {
        $tenant = $this->tenant();

        $url = $images->store($request->file('image'), $tenant);

        return $this->success(['url' => $url], 'Image uploaded.');
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $product = $this->service->create($request->user(), $request->validated());

        return $this->created(new ProductResource($product), 'Product created.');
    }

    public function show($product): JsonResponse
    {
        $model = $this->findOrFail($this->products->findForTenant($this->tenantId(), $product));

        return $this->success(new ProductResource($model), 'Product retrieved.');
    }

    public function update(ProductRequest $request, $product): JsonResponse
    {
        $model = $this->findOrFail($this->products->findForTenant($this->tenantId(), $product));

        return $this->success(new ProductResource($this->service->update($request->user(), $model, $request->validated())), 'Product updated.');
    }

    public function destroy($product): JsonResponse
    {
        $model = $this->findOrFail($this->products->findForTenant($this->tenantId(), $product));

        $this->service->delete(request()->user(), $model);

        return $this->deleted('Product deleted.');
    }

    /**
     * Look up a product by its barcode (POS barcode scanning workflow).
     */
    public function byBarcode(Request $request): JsonResponse
    {
        $request->validate(['barcode' => ['required', 'string']]);

        $product = $this->products->findByBarcode($this->tenantId(), $request->input('barcode'));

        return $this->success($product ? new ProductResource($product) : null, $product ? 'Product found.' : 'No product found for this barcode.');
    }
}
