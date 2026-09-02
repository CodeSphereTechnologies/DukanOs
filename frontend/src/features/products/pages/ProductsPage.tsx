import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Plus, SlidersHorizontal } from 'lucide-react';
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

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [unit, setUnit] = useState('pc');

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
  );

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !price) return;

    const newProd: Product = {
      id: products.length + 1,
      name,
      sku,
      barcode: barcode || undefined,
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
          <div className="text-xs text-[#71717A] font-mono">SKU: {p.sku} {p.barcode ? `· Barcode: ${p.barcode}` : ''}</div>
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
      render: (p) => (
        <span className={`font-semibold ${((p.current_stock || 0) <= (p.min_quantity_threshold || 5)) ? 'text-[#DC2626]' : 'text-black'}`}>
          {p.current_stock} {p.unit}
        </span>
      ),
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
            <Button variant="secondary" size="md" leftIcon={<SlidersHorizontal className="w-4 h-4" />}>
              Filters
            </Button>
          }
        />

        <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
      </div>

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

          <div className="grid grid-cols-2 gap-3">
            <FormField label="SKU Code" required>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. ROY-FAN-56" />
            </FormField>
            <FormField label="Barcode (EAN/UPC)">
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="e.g. 8901234567890" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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
