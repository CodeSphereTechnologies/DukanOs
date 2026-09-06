import React, { useState, useMemo } from 'react';
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
import { Plus, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';
import type { Product } from '../../../types/product.types';

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Royal Deluxe Ceiling Fan 56"', sku: 'ROY-FAN-56', barcode: '8901234567890', unit: 'pc', selling_price: 9500, purchase_cost: 7800, current_stock: 12, min_quantity_threshold: 10, status: 'active', category: { id: 1, name: 'Ceiling Fans', slug: 'ceiling-fans', status: 'active' }, brand: { id: 1, name: 'Royal Fans', slug: 'royal-fans', status: 'active' } },
  { id: 2, name: 'Pakistan Cables 7/29 Single Core Red 90m', sku: 'PAK-CAB-729R', barcode: '8901234567891', unit: 'coil', selling_price: 14500, purchase_cost: 12200, current_stock: 8, min_quantity_threshold: 15, status: 'active', category: { id: 2, name: 'Cables & Wires', slug: 'cables-wires', status: 'active' }, brand: { id: 2, name: 'Pakistan Cables', slug: 'pak-cables', status: 'active' } },
  { id: 3, name: 'Philips LED Bulb 18W Cool Daylight E27', sku: 'PHI-LED-18W', barcode: '8901234567892', unit: 'pc', selling_price: 650, purchase_cost: 480, current_stock: 45, min_quantity_threshold: 25, status: 'active', category: { id: 3, name: 'LED Bulbs', slug: 'led-bulbs', status: 'active' }, brand: { id: 3, name: 'Philips', slug: 'philips', status: 'active' } },
  { id: 4, name: 'Schneider MCB 32A Double Pole 6kA', sku: 'SCH-MCB-32DP', barcode: '8901234567893', unit: 'pc', selling_price: 2200, purchase_cost: 1650, current_stock: 24, min_quantity_threshold: 8, status: 'active', category: { id: 4, name: 'Circuit Breakers', slug: 'breakers', status: 'active' }, brand: { id: 4, name: 'Schneider', slug: 'schneider', status: 'active' } },
  { id: 5, name: 'Pak Fan Bracket Fan 18" Remote Control', sku: 'PAK-FAN-18B', barcode: '8901234567894', unit: 'pc', selling_price: 12800, purchase_cost: 10500, current_stock: 6, min_quantity_threshold: 5, status: 'active', category: { id: 1, name: 'Ceiling Fans', slug: 'ceiling-fans', status: 'active' }, brand: { id: 3, name: 'Pak Fan', slug: 'pak-fan', status: 'active' } },
];

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Add Product Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryName, setCategoryName] = useState('Ceiling Fans');
  const [brandName, setBrandName] = useState('Royal Fans');
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [unit, setUnit] = useState('pc');

  // Dynamic filter lists
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set);
  }, [products]);

  const brands = useMemo(() => {
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
      // Search
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

      // Category
      if (selectedCategory !== 'all' && p.category?.name !== selectedCategory) {
        return false;
      }

      // Brand
      if (selectedBrand !== 'all' && p.brand?.name !== selectedBrand) {
        return false;
      }

      // Stock status
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

      // Lifecycle status
      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }

      // Price range
      if (minPrice && p.selling_price < Number(minPrice)) {
        return false;
      }
      if (maxPrice && p.selling_price > Number(maxPrice)) {
        return false;
      }

      return true;
    });
  }, [products, search, selectedCategory, selectedBrand, stockStatus, selectedStatus, minPrice, maxPrice]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !price) return;

    const newProd: Product = {
      id: products.length + 1,
      name,
      sku,
      barcode: barcode || undefined,
      category: categoryName ? { id: Date.now(), name: categoryName, slug: categoryName.toLowerCase().replace(/\s+/g, '-'), status: 'active' } : undefined,
      brand: brandName ? { id: Date.now() + 1, name: brandName, slug: brandName.toLowerCase().replace(/\s+/g, '-'), status: 'active' } : undefined,
      selling_price: Number(price),
      purchase_cost: Number(cost) || undefined,
      current_stock: Number(stock) || 0,
      unit,
      status: 'active',
    };

    setProducts([newProd, ...products]);
    setIsAddOpen(false);
    setName('');
    setSku('');
    setBarcode('');
    setPrice(0);
    setCost(0);
    setStock(0);
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product Details',
      render: (p) => (
        <div>
          <div className="font-semibold text-[#18181B]">{p.name}</div>
          <div className="text-xs text-[#71717A] font-mono">
            SKU: {p.sku} {p.barcode ? `· Barcode: ${p.barcode}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category / Brand',
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
      render: (p) => {
        const isLow = (p.current_stock || 0) <= (p.min_quantity_threshold || 5);
        const isOut = (p.current_stock || 0) === 0;
        return (
          <span
            className={`font-semibold ${
              isOut ? 'text-[#DC2626] font-extrabold' : isLow ? 'text-[#D97706]' : 'text-[#065F46]'
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
      render: (p) => <span className="font-bold text-black">{formatCurrency(p.selling_price)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (p) => <Badge variant={p.status === 'active' ? 'mint' : 'neutral'}>{p.status}</Badge>,
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

        <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
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
                ...categories.map((c) => ({ label: c, value: c })),
              ]}
            />
          </FormField>

          <FormField label="Brand">
            <Select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              options={[
                { label: 'All Brands', value: 'all' },
                ...brands.map((b) => ({ label: b, value: b })),
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

      {/* Add Product Modal */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Catalog Product"
        description="Register an appliance item with pricing, barcode, and dynamic electrical attributes."
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
          <FormField label="Product Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Royal Deluxe Fan 56''"
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Category">
              <Select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                options={[
                  { label: 'Ceiling Fans', value: 'Ceiling Fans' },
                  { label: 'Cables & Wires', value: 'Cables & Wires' },
                  { label: 'LED Bulbs', value: 'LED Bulbs' },
                  { label: 'Circuit Breakers', value: 'Circuit Breakers' },
                  { label: 'Bracket Fans', value: 'Bracket Fans' },
                  { label: 'General Appliances', value: 'General Appliances' },
                ]}
              />
            </FormField>

            <FormField label="Brand">
              <Select
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                options={[
                  { label: 'Royal Fans', value: 'Royal Fans' },
                  { label: 'Pakistan Cables', value: 'Pakistan Cables' },
                  { label: 'Philips', value: 'Philips' },
                  { label: 'Schneider', value: 'Schneider' },
                  { label: 'Pak Fan', value: 'Pak Fan' },
                  { label: 'Generic', value: 'Generic' },
                ]}
              />
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
        </form>
      </Dialog>
    </PageContainer>
  );
};

