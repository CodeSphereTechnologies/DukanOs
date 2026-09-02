import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Package, FileText, CheckCircle2 } from 'lucide-react';

interface StockAlert {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  threshold: number;
}

const INITIAL_ALERTS: StockAlert[] = [
  { id: 1, name: 'Pakistan Cables 7/29 Single Core Red 90m', sku: 'PAK-CAB-729R', current_stock: 8, threshold: 15 },
  { id: 2, name: 'Royal Deluxe Fan 56" Copper', sku: 'ROY-FAN-56', current_stock: 12, threshold: 15 },
  { id: 3, name: 'Schneider MCB 32A Double Pole', sku: 'SCH-MCB-32DP', current_stock: 6, threshold: 10 },
];

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<StockAlert[]>(INITIAL_ALERTS);
  const [adjustItem, setAdjustItem] = useState<StockAlert | null>(null);
  const [newStock, setNewStock] = useState<number>(0);

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    setAlerts(alerts.map((a) => (a.id === adjustItem.id ? { ...a, current_stock: Number(newStock) } : a)));
    setAdjustItem(null);
  };

  const columns: Column<StockAlert>[] = [
    {
      key: 'name',
      header: 'Item Description',
      render: (a) => (
        <div>
          <div className="font-semibold text-[#18181B]">{a.name}</div>
          <div className="text-xs text-[#71717A] font-mono">{a.sku}</div>
        </div>
      ),
    },
    {
      key: 'current_stock',
      header: 'Current Stock',
      align: 'center',
      render: (a) => <span className="font-bold text-[#DC2626]">{a.current_stock} units</span>,
    },
    { key: 'threshold', header: 'Min Threshold', align: 'center' },
    {
      key: 'actions',
      header: 'Adjustment',
      align: 'right',
      render: (a) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setAdjustItem(a);
            setNewStock(a.current_stock);
          }}
        >
          Quick Adjust
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Operations Management"
      subtitle="Catalog inventory thresholds, quotation pipelines, and operational stock adjustments."
      primaryAction={
        <Button variant="primary" size="md" onClick={() => navigate('/products')}>
          Manage Catalog
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Inventory Alerts"
          value={alerts.length}
          change={{ value: 'Immediate replenishment needed', trend: 'down' }}
          icon={<Package className="w-5 h-5 text-[#DC2626]" />}
        />
        <StatCard
          title="Active Quotations"
          value="4"
          change={{ value: '2 ready to convert to invoice', trend: 'up' }}
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          title="Stock Accuracy"
          value="98.2%"
          change={{ value: 'Cycle count verified', trend: 'up' }}
          icon={<CheckCircle2 className="w-5 h-5 text-[#065F46]" />}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#18181B] font-display">Inventory Stock Reorder Queue</h3>
        <DataTable columns={columns} data={alerts} keyExtractor={(item) => item.id} />
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        title="Adjust Physical Inventory"
        description={`Record verified count for ${adjustItem?.name}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAdjustItem(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveAdjustment}>
              Save Stock
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          <FormField label="Verified Physical Stock" required>
            <Input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(Number(e.target.value))}
              autoFocus
            />
          </FormField>
        </form>
      </Dialog>
    </PageContainer>
  );
};
