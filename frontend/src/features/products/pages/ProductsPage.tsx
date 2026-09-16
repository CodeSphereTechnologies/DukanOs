import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { FilterBar } from '../../../components/ui/FilterBar';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Plus, SlidersHorizontal, RotateCcw, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';
import type { Product, Category, Brand } from '../../../types/product.types';
import { productService } from '../../../services/product.service';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>(
    (location.state as { stockFilter?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' } | null)?.stockFilter || 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

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

  // Dynamic filter lists (all configured categories/brands, not just ones in use)
  const categoriesFilter = useMemo(() => categories.map((c) => c.name), [categories]);

  const brandsFilter = useMemo(() => brands.map((b) => b.name), [brands]);

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
            onClick={() => navigate(`/products/${p.id}/edit`)}
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
          onClick={() => navigate('/products/create')}
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
    </PageContainer>
  );
};