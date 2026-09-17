import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Alert } from '../../../components/ui/Alert';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Plus, X, ImagePlus, Upload, Tag, CheckCircle2 } from 'lucide-react';
import type { Category, Brand, Unit } from '../../../types/product.types';
import { productService } from '../../../services/product.service';
import { unitService } from '../../../services/unit.service';

export const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [brandId, setBrandId] = useState<string>('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(0);
  const [unit, setUnit] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    productService.getCategories().then((res) => {
      if (res.data) setCategories(res.data);
    });
    productService.getBrands().then((res) => {
      if (res.data) setBrands(res.data);
    });
    unitService.getAll().then((res) => {
      if (res.data) setUnits(res.data);
    });
  }, []);

  const handleAddCategoryInline = async () => {
    const catName = newCategoryName.trim();
    if (!catName) return;
    const cat = await productService.addCategory(catName);
    setCategories((prev) => [...prev.filter((c) => c.id !== cat.id), cat]);
    setCategoryId(String(cat.id));
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !sku.trim() || !price) {
      setError('Product Name, SKU, and Selling Price are required.');
      return;
    }

    const selectedCat = categories.find((c) => c.id === Number(categoryId)) || categories[0];
    const selectedBrd = brands.find((b) => b.id === Number(brandId)) || brands[0];

    await productService.saveProduct({
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim() || undefined,
      category: selectedCat,
      brand: selectedBrd,
      selling_price: Number(price),
      purchase_cost: Number(cost) || undefined,
      current_stock: Number(stock) || 0,
      min_quantity_threshold: Number(threshold) || 0,
      unit,
      status: 'active',
      image_url: imageUrl || undefined,
    });

    setSuccess(true);
    setTimeout(() => {
      navigate('/products');
    }, 800);
  };

  const handleResetForm = () => {
    setName('');
    setSku('');
    setBarcode('');
    setCategoryId('');
    setBrandId('');
    setPrice(0);
    setCost(0);
    setStock(0);
    setThreshold(0);
    setUnit('');
    setImageUrl('');
    setShowNewCategory(false);
    setNewCategoryName('');
    setError(null);
    setSuccess(false);
  };

  return (
    <PageContainer
      title="Add Catalog Product"
      subtitle="Register an appliance item with pricing, barcode, category, brand, and make it available in the POS terminal."
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
            <Alert variant="success" title="Product created">
              Product saved successfully. Redirecting...
            </Alert>
          )}

          <form onSubmit={handleAddProduct} className="space-y-5">
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4">
              <div className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#065F46]" />
                Basic Details
              </div>

              <FormField label="Product Image">
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border border-[#E4E4E7]">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Product preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="w-6 h-6 text-slate-400" />
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
                    >
                      Upload Image
                    </Button>
                    <Input
                      value={imageUrl.startsWith('data:') ? '' : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="or paste image URL..."
                      disabled={imageUrl.startsWith('data:')}
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
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Deluxe Fan 56''"
                  autoFocus
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="SKU Code" required>
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. ROY-FAN-56" />
                </FormField>
                <FormField label="Barcode (EAN/UPC)">
                  <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="e.g. 8901234567890" />
                </FormField>
              </div>
            </div>

            <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4">
              <div className="text-sm font-semibold text-[#18181B]">Category & Brand</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Category" required>
                  {!showNewCategory ? (
                    <Select
                      value={categoryId}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setShowNewCategory(true);
                        } else {
                          setCategoryId(e.target.value);
                        }
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
                  <Select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    options={[
                      { label: 'Select a brand...', value: '' },
                      ...brands.map((b) => ({ label: b.name, value: String(b.id) })),
                    ]}
                  />
                </FormField>
              </div>
            </div>

            <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4">
              <div className="text-sm font-semibold text-[#18181B]">Pricing & Inventory</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Selling Price (PKR)" required>
                  <Input
                    type="number"
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="e.g. 9500"
                  />
                </FormField>
                <FormField label="Purchase Cost (PKR)">
                  <Input
                    type="number"
                    value={cost || ''}
                    onChange={(e) => setCost(Number(e.target.value))}
                    placeholder="e.g. 7800"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Opening Stock">
                  <Input
                    type="number"
                    value={stock || ''}
                    onChange={(e) => setStock(Number(e.target.value))}
                    placeholder="e.g. 20"
                  />
                </FormField>
                <FormField label="Low-Stock Threshold">
                  <Input
                    type="number"
                    value={threshold || ''}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    placeholder="e.g. 5"
                  />
                </FormField>
              </div>

              <FormField label="Unit of Sale">
                <Select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  options={[
                    { label: 'Select the unit of sale...', value: '' },
                    ...units.map((u) => ({ label: `${u.name} (${u.code})`, value: u.code })),
                  ]}
                />
              </FormField>
            </div>

            {(!categoryId || !brandId) && (
              <div className="flex items-center gap-2 p-2.5 bg-[#FEF3C7] rounded-lg text-xs text-[#92400E]">
                <Tag className="w-3.5 h-3.5 shrink-0" />
                Select a category and brand, or add a new one directly (e.g. "Sequential Brand", "Industrial Switches").
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold text-[#18181B]">Save Product</div>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Review the details above. Once saved, the product will be available immediately in the POS terminal.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="md"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleAddProduct}
                disabled={success}
              >
                Save Product
              </Button>
              <Button variant="ghost" size="md" onClick={handleResetForm} disabled={success}>
                Clear Form
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};