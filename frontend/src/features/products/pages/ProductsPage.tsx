import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { FilterBar } from '../../../components/ui/FilterBar';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Plus, SlidersHorizontal, RotateCcw, ImagePlus, Upload, X, Tag, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency } from '../../../lib/formatters';
import type { Product, Category, Brand } from '../../../types/product.types';
import { productService } from '../../../services/product.service';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Add Product Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [brandId, setBrandId] = useState<string>('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [unit, setUnit] = useState('pc');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Product Form State
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editBrandId, setEditBrandId] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCost, setEditCost] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editThreshold, setEditThreshold] = useState<number>(0);
  const [editUnit, setEditUnit] = useState('pc');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'archived'>('active');

  useEffect(() => {
    productService.getAll().then((res) => {
      if (res.data) setProducts(res.data);
    });
    productService.getCategories().then((res) => {
      if (res.data) setCategories(res.data);
    });
    productService.getBrands().then((res) => {
      if (res.data) setBrands(res.data);
    });
  }, []);

  useEffect(() => {
    // Refresh products after edit or delete
    if (editProductId !== null || deleteId !== null) {
      productService.getAll().then((res) => {
        if (res.data) setProducts(res.data);
      });
    }
  }, [editProductId, deleteId]);

  const handleAddCategoryInline = async () => {
    const catName = newCategoryName.trim();
    if (!catName) return;
    const cat = await productService.addCategory(catName);
    setCategories((prev) => [...prev.filter((c) => c.id !== cat.id), cat]);
    setCategoryId(String(cat.id));
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const handleAddBrandInline = async () => {
    const bName = newBrandName.trim();
    if (!bName) return;
    const brand = await productService.addBrand(bName);
    setBrands((prev) => [...prev.filter((b) => b.id !== brand.id), brand]);
    setBrandId(String(brand.id));
    setShowNewBrand(false);
    setNewBrandName('');
  };

  const handleEditProduct = (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setEditProductId(id);
    setEditName(product.name);
    setEditSku(product.sku);
    setEditBarcode(product.barcode || '');
    setEditDescription(product.description || '');
    setEditCategoryId(product.category ? String(product.category.id) : '');
    setEditBrandId(product.brand ? String(product.brand.id) : '');
    setEditPrice(product.selling_price);
    setEditCost(product.purchase_cost || 0);
    setEditStock(product.current_stock);
    setEditThreshold(product.min_quantity_threshold || 0);
    setEditUnit(product.unit);
    setEditStatus(product.status);
    setShowNewCategory(false);
    setShowNewBrand(false);
    setIsEditOpen(true);
  };

  const handleDeleteProduct = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (deleteId === null) return;
    await productService.deleteProduct(deleteId);
    setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    setIsDeleteOpen(false);
  };

  const saveEditedProduct = async () => {
    if (editProductId === null || !editName.trim() || !editSku.trim()) return;
    const productIndex = products.findIndex((p) => p.id === editProductId);
    if (productIndex < 0) return;
    
    const selectedCat = categories.find((c) => c.id === Number(editCategoryId)) || categories[0];
    const selectedBrd = brands.find((b) => b.id === Number(editBrandId)) || brands[0];
    
    const updated = await productService.saveProduct({
      id: editProductId,
      name: editName.trim(),
      sku: editSku.trim(),
      barcode: editBarcode.trim() || undefined,
      description: editDescription.trim() || undefined,
      category: selectedCat,
      brand: selectedBrd,
      selling_price: Number(editPrice) || 0,
      purchase_cost: Number(editCost) || undefined,
      current_stock: Number(editStock) || 0,
      unit,
      status: editStatus,
    });
    
    setProducts((prev) => {
      const next = [...prev];
      next[productIndex] = updated;
      return next;
    });
    
    setIsEditOpen(false);
    setEditProductId(null);
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

  // Dynamic filter lists
  const categoriesFilter = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set);
  }, [products]);

  const brandsFilter = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand?.name) set.add(p.brand.name);
    });
    return Array.from(set);
  }, [products]);

  // Active filters for FilterBar
  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; value: string }[] = [];
    if (selectedCategory !== 'all') {
      list.push({ key: 'category', label: 'Category', value: selectedCategory });
    }
    if (selectedBrand !== 'all') {
      list.push({ key: 'brand', label: 'Brand', value: selectedBrand });
    }
    if (stockStatus !== 'all') {
      const labels: Record<string, string> = {
        in_stock: 'In Stock',
        low_stock: 'Low Stock (≤ Threshold)',
        out_of_stock: 'Out of Stock',
      };
      list.push({ key: 'stock', label: 'Stock Level', value: labels[stockStatus] });
    }
    if (selectedStatus !== 'all') {
      list.push({ key: 'status', label: 'Status', value: selectedStatus.toUpperCase() });
    }
    if (minPrice) {
      list.push({ key: 'minPrice', label: 'Min Price', value: `PKR ${minPrice}` });
    }
    if (maxPrice) {
      list.push({ key: 'maxPrice', label: 'Max Price', value: `PKR ${maxPrice}` });
    }
    return list;
  }, [selectedCategory, selectedBrand, stockStatus, selectedStatus, minPrice, maxPrice]);

  const handleRemoveFilter = (key: string) => {
    if (key === 'category') setSelectedCategory('all');
    if (key === 'brand') setSelectedBrand('all');
    if (key === 'stock') setStockStatus('all');
    if (key === 'status') setSelectedStatus('all');
    if (key === 'minPrice') setMinPrice('');
    if (key === 'maxPrice') setMaxPrice('');
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setStockStatus('all');
    setSelectedStatus('all');
    setMinPrice('');
    setMaxPrice('');
  };

  // Filtered products calculation
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchSearch =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q)) ||
          (p.category?.name && p.category.name.toLowerCase().includes(q)) ||
          (p.brand?.name && p.brand.name.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      if (selectedCategory !== 'all' && p.category?.name !== selectedCategory) {
        return false;
      }

      if (selectedBrand !== 'all' && p.brand?.name !== selectedBrand) {
        return false;
      }

      const threshold = p.min_quantity_threshold || 5;
      if (stockStatus === 'in_stock' && p.current_stock <= threshold) {
        return false;
      }
      if (stockStatus === 'low_stock' && (p.current_stock > threshold || p.current_stock <= 0)) {
        return false;
      }
      if (stockStatus === 'out_of_stock' && p.current_stock > 0) {
        return false;
      }

      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }

      if (minPrice && p.selling_price < Number(minPrice)) {
        return false;
      }
      if (maxPrice && p.selling_price > Number(maxPrice)) {
        return false;
      }

      return true;
    });
  }, [products, search, selectedCategory, selectedBrand, stockStatus, selectedStatus, minPrice, maxPrice]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !price) return;

    const selectedCat = categories.find((c) => c.id === Number(categoryId)) || categories[0];
    const selectedBrd = brands.find((b) => b.id === Number(brandId)) || brands[0];

    await productService.saveProduct({
      name,
      sku,
      barcode: barcode || undefined,
      category: selectedCat,
      brand: selectedBrd,
      selling_price: Number(price),
      purchase_cost: Number(cost) || undefined,
      current_stock: Number(stock) || 0,
      unit,
      status: 'active',
      image_url: imageUrl || undefined,
    });

    const saved = await productService.getAll();
    if (saved.data) setProducts(saved.data);

    setIsAddOpen(false);
    setName('');
    setSku('');
    setBarcode('');
    setCategoryId('');
    setBrandId('');
    setPrice(0);
    setCost(0);
    setStock(0);
    setImageUrl('');
    setShowNewCategory(false);
    setShowNewBrand(false);
    setNewCategoryName('');
    setNewBrandName('');
    setEditProductId(null);
    setEditName('');
    setEditSku('');
    setEditBarcode('');
    setEditDescription('');
    setEditCategoryId('');
    setEditBrandId('');
    setEditPrice(0);
    setEditCost(0);
    setEditStock(0);
    setEditThreshold(0);
    setEditUnit('pc');
    setEditStatus('active');
  };

const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product Details',
      className: 'w-48',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-slate-400">
                {p.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <Link
              to={`/products/${p.id}`}
              className="font-semibold text-[#18181B] hover:text-[#047857] hover:underline underline-offset-2 transition-colors inline-flex items-center gap-0.5 group"
            >
              {p.name}
              <ChevronRight className="w-3 h-3 text-[#A1A1AA] group-hover:text-[#047857] transition-colors" />
            </Link>
            <div className="text-xs text-[#71717A] font-mono">
              SKU: {p.sku} {p.barcode ? `· Barcode: ${p.barcode}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category / Brand',
      className: 'w-40',
      render: (p) => (
        <span className="text-xs text-[#52525B]">
          {p.category?.name || 'General'} · {p.brand?.name || 'Generic'}
        </span>
      ),
    },
    {
      key: 'current_stock',
      header: 'Stock',
      align: 'center',
      className: 'w-28',
      render: (p) => {
        const isLow = (p.current_stock || 0) <= (p.min_quantity_threshold || 5);
        const isOut = (p.current_stock || 0) === 0;
        return (
          <span
            className={`font-semibold ${
              isOut ? 'text-[#DC2626] font-extrabold' : isLow ? 'text-[#D97706]' : 'text-[#065F46]'}
            }`}
          >
            {p.current_stock} {p.unit}
          </span>
        );
      },
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      align: 'right',
      className: 'w-36',
      render: (p) => <span className="font-bold text-black">{formatCurrency(p.selling_price)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      className: 'w-24',
      render: (p) => (
        <Badge
          variant={
            p.status === 'active'
              ? 'mint'
              : p.status === 'archived'
                ? 'outline'
                : 'neutral'
          }
        >
          {p.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      className: 'w-32',
      render: (p) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="link"
            size="sm"
            leftIcon={<Pencil className="w-3 h-3" />}
            onClick={() => handleEditProduct(p.id)}
            className="text-[#047857] hover:text-[#18181B]"
            title="Edit"
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<Trash2 className="w-3 h-3" />}
            onClick={() => handleDeleteProduct(p.id)}
            className="text-[#DC2626] hover:text-[#18181B]"
            title="Delete"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Products & Catalog"
      subtitle="Manage appliance items, dynamic specifications, barcode identifiers, and stock levels."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddOpen(true)}
        >
          Add Product
        </Button>
      }
    >
      <div className="space-y-4">
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search products by name, SKU, or barcode..."
          actions={
            <Button
              variant={activeFilters.length > 0 ? 'primary' : 'secondary'}
              size="md"
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setIsFilterDrawerOpen(true)}
              className="relative"
            >
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-white text-black font-extrabold rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          }
        />

        {/* Active Filter Chips */}
        <FilterBar
          activeFilters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />

        {/* Product Count Indicator */}
        <div className="flex items-center justify-between text-xs text-[#71717A] px-1">
          <span>
            Showing <strong className="text-black">{filtered.length}</strong> of{' '}
            <strong className="text-black">{products.length}</strong> products
          </span>
          {activeFilters.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[#065F46] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => navigate(`/products/${item.id}`)}
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Catalog Products"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="sm" onClick={handleClearAllFilters}>
              Reset All
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsFilterDrawerOpen(false)}>
              Apply Filters ({filtered.length} matching)
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <FormField label="Category">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { label: 'All Categories', value: 'all' },
                ...categoriesFilter.map((c) => ({ label: c, value: c })),
              ]}
            />
          </FormField>

          <FormField label="Brand">
            <Select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              options={[
                { label: 'All Brands', value: 'all' },
                ...brandsFilter.map((b) => ({ label: b, value: b })),
              ]}
            />
          </FormField>

          <FormField label="Stock Level Status">
            <Select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value as typeof stockStatus)}
              options={[
                { label: 'All Stock Levels', value: 'all' },
                { label: 'In Stock (Healthy inventory)', value: 'in_stock' },
                { label: 'Low Stock (At or below threshold)', value: 'low_stock' },
                { label: 'Out of Stock (0 quantity)', value: 'out_of_stock' },
              ]}
            />
          </FormField>

          <FormField label="Product Lifecycle Status">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Active (Available for sale)', value: 'active' },
                { label: 'Inactive (Hidden from POS)', value: 'inactive' },
                { label: 'Archived (Removed from POS)', value: 'archived' },
              ]}
            />
          </FormField>

          <div className="space-y-2 pt-2 border-t border-[#E4E4E7]">
            <label className="block text-xs font-semibold text-[#18181B]">Selling Price Range (PKR)</label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min Rs."
              />
              <Input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max Rs."
              />
            </div>
          </div>
        </div>
      </Drawer>

      {/* Edit Product Modal */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Product"
        description="Update product details"
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={saveEditedProduct} isLoading={false}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); saveEditedProduct(); }} className="space-y-4">
          <FormField label="Product Name" required>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Product name" autoFocus />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Category" required>
              {!showNewCategory ? (
                <Select
                  value={editCategoryId}
                  onChange={(e) => {
                    if (e.target.value === '__new__') setShowNewCategory(true);
                    else setEditCategoryId(e.target.value);
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
                  value={editBrandId}
                  onChange={(e) => {
                    if (e.target.value === '__new__') setShowNewBrand(true);
                    else setEditBrandId(e.target.value);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="SKU Code" required>
              <Input value={editSku} onChange={(e) => setEditSku(e.target.value)} placeholder="e.g. ROY-FAN-56" />
            </FormField>
            <FormField label="Barcode (EAN/UPC)">
              <Input value={editBarcode} onChange={(e) => setEditBarcode(e.target.value)} placeholder="e.g. 8901234567890" />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Optional product description..."
              rows={2}
              className="w-full px-3.5 py-2.5 text-sm bg-white text-[#18181B] placeholder:text-[#A1A1AA] rounded-lg border border-[#E4E4E7] transition-all focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Selling Price (PKR)" required>
              <Input type="number" value={editPrice || ''} onChange={(e) => setEditPrice(Number(e.target.value))} placeholder="e.g. 9500" />
            </FormField>
            <FormField label="Purchase Cost (PKR)">
              <Input type="number" value={editCost || ''} onChange={(e) => setEditCost(Number(e.target.value))} placeholder="e.g. 7800" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Current Stock">
              <Input type="number" value={editStock || ''} onChange={(e) => setEditStock(Number(e.target.value))} placeholder="e.g. 20" />
            </FormField>
            <FormField label="Low-Stock Threshold">
              <Input type="number" value={editThreshold || ''} onChange={(e) => setEditThreshold(Number(e.target.value))} placeholder="e.g. 5" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Unit of Sale">
              <Select
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                options={[
                  { label: 'Piece (pc)', value: 'pc' },
                  { label: 'Coil / Roll (coil)', value: 'coil' },
                  { label: 'Meter (m)', value: 'm' },
                  { label: 'Box (box)', value: 'box' },
                ]}
              />
            </FormField>
            <FormField label="Status">
              <Select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as Product['status'])}
                options={[
                  { label: 'Active (Available for sale)', value: 'active' },
                  { label: 'Inactive (Hidden from POS)', value: 'inactive' },
                  { label: 'Archived', value: 'archived' },
                ]}
              />
            </FormField>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDeleteProduct}
        title="Delete this product?"
        message="This permanently removes the product from the catalog. Historical invoices and quotations will still show its name, but the product can no longer be sold. This cannot be undone."
        confirmText="Delete Product"
        variant="destructive"
        isLoading={false}
      />

      {/* Add Product Modal */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Catalog Product"
        description="Register an appliance item with pricing, barcode, category, brand, and make it available in the POS terminal."
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddProduct}>
              Save Product
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          {/* Image Upload */}
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
            <FormField label="Category" required>
              {!showNewCategory ? (
                <div className="flex items-end gap-2">
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
                </div>
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
                    if (e.target.value === '__new__') {
                      setShowNewBrand(true);
                    } else {
                      setBrandId(e.target.value);
                    }
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="SKU Code" required>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. ROY-FAN-56" />
            </FormField>
            <FormField label="Barcode (EAN/UPC)">
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="e.g. 8901234567890" />
            </FormField>
          </div>

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
            <FormField label="Unit of Sale">
              <Select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                options={[
                  { label: 'Piece (pc)', value: 'pc' },
                  { label: 'Coil / Roll (coil)', value: 'coil' },
                  { label: 'Meter (m)', value: 'm' },
                  { label: 'Box (box)', value: 'box' },
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
      </Dialog>
    </PageContainer>
  );
};