import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Package, FileText, CheckCircle2 } from 'lucide-react';
import { inventoryService, type ReorderQueueItem, type StockAccuracySummary } from '../../../services/inventory.service';
import { invoiceService } from '../../../services/invoice.service';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<ReorderQueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [adjustItem, setAdjustItem] = useState<ReorderQueueItem | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeQuotations, setActiveQuotations] = useState<number | null>(null);
  const [readyQuotations, setReadyQuotations] = useState(0);
  const [stockAccuracy, setStockAccuracy] = useState<StockAccuracySummary | null>(null);

  useEffect(() => {
    let active = true;
    inventoryService
      .getReorderQueue()
      .then((items) => {
        if (active) setAlerts(items);
      })
      .catch(() => {
        if (active) setAlerts([]);
      })
      .finally(() => {
        if (active) setLoadingQueue(false);
      });

    invoiceService
      .getQuotations()
      .then((res) => {
        if (!active) return;
        const quotations = res.data || [];
        const activeList = quotations.filter((q) => ['draft', 'sent', 'accepted'].includes(q.status));
        setActiveQuotations(activeList.length);
        setReadyQuotations(activeList.filter((q) => ['sent', 'accepted'].includes(q.status)).length);
      })
      .catch(() => {
        if (active) setActiveQuotations(0);
      });

    inventoryService
      .getStockAccuracy()
      .then((summary) => {
        if (active) setStockAccuracy(summary);
      })
      .catch(() => {
        if (active) setStockAccuracy(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    setAdjustError(null);
    const delta = Number(newStock) - adjustItem.current_stock;
    if (delta === 0) {
      setAdjustItem(null);
      return;
    }
    setBusy(true);
    const ok = await inventoryService.adjustStock(adjustItem.id, delta);
    if (!ok) {
      setBusy(false);
      setAdjustError('Unable to save the stock adjustment. Please try again.');
      return;
    }
    const refreshed = await inventoryService.getReorderQueue().catch(() => alerts.filter((a) => a.id !== adjustItem.id));
    setAlerts(refreshed);
    setBusy(false);
    setAdjustItem(null);
  };

  const columns: Column<ReorderQueueItem>[] = [
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
          value={activeQuotations === null ? '—' : activeQuotations}
          change={{
            value: activeQuotations === null ? 'Loading quotations' : `${readyQuotations} ready to convert to invoice`,
            trend: readyQuotations > 0 ? 'up' : 'down',
          }}
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          title="Stock Accuracy"
          value={stockAccuracy === null ? '—' : `${stockAccuracy.accuracy}%`}
          change={{
            value: stockAccuracy === null
              ? 'Loading stock ledger'
              : `${stockAccuracy.reconciled_products} of ${stockAccuracy.verified_products} items ledger-reconciled`,
            trend: stockAccuracy && stockAccuracy.accuracy >= 95 ? 'up' : 'down',
          }}
          icon={<CheckCircle2 className="w-5 h-5 text-[#065F46]" />}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#18181B] font-display">Inventory Stock Reorder Queue</h3>
        <DataTable
          columns={columns}
          data={alerts}
          keyExtractor={(item) => item.id}
          isLoading={loadingQueue}
          emptyMessage="No items currently need reordering. Low stock stays above its threshold."
        />
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        title="Adjust Physical Inventory"
        description={`Record verified count for ${adjustItem?.name}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAdjustItem(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveAdjustment} isLoading={busy}>
              Save Stock
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          {adjustError && <p className="text-xs text-[#DC2626]">{adjustError}</p>}
          <FormField label="Verified Physical Stock" required>
            <Input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(Number(e.target.value))}
              min={0}
              autoFocus
            />
          </FormField>
        </form>
      </Dialog>
    </PageContainer>
  );
};
