import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Alert } from '../../../components/ui/Alert';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { LoadingState } from '../../../components/ui/LoadingState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ArrowLeft, Plus, Upload, X, CheckCircle2, Tag, Loader2 } from 'lucide-react';
import type { Product, Category, Brand, Unit } from '../../../types/product.types';
import { productService } from '../../../services/product.service';
import { unitService } from '../../../services/unit.service';
import { formatError } from '../../../lib/utils';

export const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = Number(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [brandId, setBrandId] = useState<string>('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(0);
  const [unit, setUnit] = useState('pc');
  const [status, setStatus] = useState<Product['status']>('active');
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [prod, cats, brds, unts] = await Promise.all([
        productService.getById(productId),
        productService.getCategories(),
        productService.getBrands(),
        unitService.getAll(),
      ]);
      if (!active) return;
      if (!prod) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProduct(prod);
      setCategories(cats.data || []);
      setBrands(brds.data || []);
      setUnits(unts.data || []);
      setName(prod.name);
      setSku(prod.sku);
      setBarcode(prod.barcode || '');
      setDescription(prod.description || '');
      setCategoryId(prod.category ? String(prod.category.id) : '');
      setBrandId(prod.brand ? String(prod.brand.id) : '');
      setPrice(prod.selling_price);
      setCost(prod.purchase_cost || 0);
      setStock(prod.current_stock || 0);
      setThreshold(prod.min_quantity_threshold || 0);
      setUnit(prod.unit);
      setStatus(prod.status);
      setImageUrl(prod.image_url || '');
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [productId]);

  const handleAddCategoryInline = async () => {
    const catName = newCategoryName.trim();
    if (!catName) return;
    try {
      const cat = await productService.addCategory(catName);
      setCategories((prev) => [...prev.filter((c) => c.id !== cat.id), cat]);
      setCategoryId(String(cat.id));
      setShowNewCategory(false);
      setNewCategoryName('');
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleAddBrandInline = async () => {
    const bName = newBrandName.trim();
    if (!bName) return;
    try {
      const brand = await productService.addBrand(bName);
      setBrands((prev) => [...prev.filter((b) => b.id !== brand.id), brand]);
      setBrandId(String(brand.id));
      setShowNewBrand(false);
      setNewBrandName('');
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setIsUploading(true);
    try {
      // Upload the bytes rather than inlining them: the image column is short
      // and cannot hold a data URL for a real photo.
      const url = await productService.uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      setImageError(formatError(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !sku.trim() || !price) {
      setError('Product Name, SKU, and Selling Price are required.');
      return;
    }

    const selectedCat = categories.find((c) => c.id === Number(categoryId)) || categories[0];
    const selectedBrd = brands.find((b) => b.id === Number(brandId)) || brands[0];

    try {
      await productService.saveProduct({
        id: productId,
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        description: description.trim() || undefined,
        category: selectedCat,
        brand: selectedBrd,
        selling_price: Number(price),
        purchase_cost: Number(cost) || undefined,
        current_stock: Number(stock) || 0,
        min_quantity_threshold: Number(threshold) || 0,
        unit,
        status,
        image_url: imageUrl || undefined,
      });
    } catch (err) {
      setError(formatError(err));
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      navigate('/products');
    }, 800);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (notFound || !product) {
    return (
      <PageContainer
        title="Product Not Found"
        secondaryActions={
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-[#52525B] hover:text-black hover:bg-[#F4F4F5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        }
      >
        <EmptyState
          title="Product not found"
          description="This product may have been deleted, or the link is incorrect."
          action={
            <Button variant="primary" size="md" onClick={() => navigate('/products')}>
              Go to Products
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Product"
      subtitle={`Update details for "${product.name}". Changes take effect immediately in the POS terminal.`}
      secondaryActions={
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-[#52525B] hover:text-black hover:bg-[#F4F4F5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <Alert variant="error" title="Validation Error">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" title="Product updated">
              Product saved successfully. Redirecting...
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4">
              <div className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#065F46]" />
                Basic Details
              </div>

              <FormField
                label="Product Image"
                error={imageError || undefined}
                helperText="Upload a file from your device, or paste a link to an existing image."
              >
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border border-[#E4E4E7]">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Product preview" className="w-full h-full object-cover" />
                    ) : isUploading ? (
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    ) : (
                      <Tag className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="or paste image URL..."
                      disabled={isUploading}
                    />
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-xs text-[#DC2626] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Remove image
                      </button>
                    )}
                  </div>
                </div>
              </FormField>

              <FormField label="Product Name" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" autoFocus />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="SKU Code" required>
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. ROY-FAN-56" />
                </FormField>
                <FormField label="Barcode (EAN/UPC)">
                  <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="e.g. 8901234567890" />
                </FormField>
              </div>

              <FormField label="Description">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional product description..."
                  rows={4}
                />
              </FormField>
            </div>

            <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4">
              <div className="text-sm font-semibold text-[#18181B]">Category & Brand</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Category" required>
                  {!showNewCategory ? (
                    <Select
                      value={categoryId}
                      onChange={(e) => {
                        if (e.target.value === '__new__') setShowNewCategory(true);
                        else setCategoryId(e.target.value);
                      }}
                      options={[
                        { label: 'Select a category...', value: '' },
                        ...categories.map((c) => ({ label: c.name, value: String(c.id) })),
                        { label: '+ Add New Category...', value: '__new__' },
                      ]}
                    />
                  ) : (
                    <div className="flex items-end gap-2">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Type new category name"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        onClick={handleAddCategoryInline}
                        disabled={!newCategoryName.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewCategory(false);
                          setNewCategoryName('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </FormField>

                <FormField label="Brand" required>
                  {!showNewBrand ? (
                    <Select
                      value={brandId}
                      onChange={(e) => {
                        if (e.target.value === '__new__') setShowNewBrand(true);
                        else setBrandId(e.target.value);
                      }}
                      options={[
                        { label: 'Select a brand...', value: '' },
                        ...brands.map((b) => ({ label: b.name, value: String(b.id) })),
                        { label: '+ Add New Brand...', value: '__new__' },
                      ]}
                    />
                  ) : (
                    <div className="flex items-end gap-2">
                      <Input
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="Type new brand name"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        onClick={handleAddBrandInline}
                        disabled={!newBrandName.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewBrand(false);
                          setNewBrandName('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </FormField>
              </div>
            </div>

            <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4">
              <div className="text-sm font-semibold text-[#18181B]">Pricing & Inventory</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Selling Price (PKR)" required>
                  <Input type="number" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} placeholder="e.g. 9500" />
                </FormField>
                <FormField label="Purchase Cost (PKR)">
                  <Input type="number" value={cost || ''} onChange={(e) => setCost(Number(e.target.value))} placeholder="e.g. 7800" />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Current Stock">
                  <Input type="number" value={stock || ''} onChange={(e) => setStock(Number(e.target.value))} placeholder="e.g. 20" />
                </FormField>
                <FormField label="Low-Stock Threshold">
                  <Input type="number" value={threshold || ''} onChange={(e) => setThreshold(Number(e.target.value))} placeholder="e.g. 5" />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Unit of Sale">
                  <Select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    options={[
                      ...units.map((u) => ({ label: `${u.name} (${u.code})`, value: u.code })),
                    ]}
                  />
                </FormField>
                <FormField label="Status">
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Product['status'])}
                    options={[
                      { label: 'Active (Available for sale)', value: 'active' },
                      { label: 'Inactive (Hidden from POS)', value: 'inactive' },
                      { label: 'Archived', value: 'archived' },
                    ]}
                  />
                </FormField>
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold text-[#18181B]">Save Changes</div>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Review the details above. The updated information will be reflected immediately in the POS terminal.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="md"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleSave}
                disabled={success}
              >
                Save Changes
              </Button>
              <Button variant="ghost" size="md" onClick={() => navigate('/products')} disabled={success}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};