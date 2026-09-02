import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { QuickActionCard } from '../../../components/common/QuickActionCard';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import {
  DollarSign,
  Users,
  AlertTriangle,
  ShoppingCart,
  Plus,
  CreditCard,
  UserPlus,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';

interface LowStockAlert {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  threshold: number;
  category: string;
}

const LOW_STOCK: LowStockAlert[] = [
  { id: 1, name: 'Pakistan Cables 7/29 Single Core Red 90m', sku: 'PAK-CAB-729R', current_stock: 8, threshold: 15, category: 'Cables' },
  { id: 2, name: 'Royal Deluxe Fan 56" Copper Winding', sku: 'ROY-FAN-56', current_stock: 12, threshold: 15, category: 'Fans' },
  { id: 3, name: 'Schneider MCB 32A Double Pole 6kA', sku: 'SCH-MCB-32DP', current_stock: 6, threshold: 10, category: 'Breakers' },
];

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const columns: Column<LowStockAlert>[] = [
    {
      key: 'name',
      header: 'Product Details',
      render: (item) => (
        <div>
          <div className="font-semibold text-[#18181B]">{item.name}</div>
          <div className="text-xs text-[#71717A] font-mono">{item.sku}</div>
        </div>
      ),
    },
    { key: 'category', header: 'Category' },
    {
      key: 'current_stock',
      header: 'Stock / Threshold',
      align: 'right',
      render: (item) => (
        <span className="font-bold text-[#DC2626]">
          {item.current_stock} / {item.threshold} units
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: () => (
        <Button variant="secondary" size="sm" onClick={() => navigate('/products')}>
          Restock
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Store Owner Dashboard"
      subtitle="Executive summary of store operations, sales cashflow, and receivables."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<ShoppingCart className="w-4 h-4" />}
          onClick={() => navigate('/pos')}
        >
          Launch POS
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(68450)}
          change={{ value: '+14.2%', trend: 'up', label: 'vs yesterday' }}
          icon={<DollarSign className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(820000)}
          change={{ value: '+8.5%', trend: 'up', label: 'vs last month' }}
          icon={<ArrowUpRight className="w-5 h-5 text-black" />}
        />
        <StatCard
          title="Customer Receivables"
          value={formatCurrency(382400)}
          change={{ value: '3 on-account ledgers', trend: 'neutral' }}
          icon={<Users className="w-5 h-5 text-[#92400E]" />}
        />
        <StatCard
          title="Low Stock Watchlist"
          value={LOW_STOCK.length}
          change={{ value: 'Requires purchase order', trend: 'down' }}
          icon={<AlertTriangle className="w-5 h-5 text-[#DC2626]" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickActionCard
          title="New POS Invoice"
          description="High speed counter sales"
          icon={<ShoppingCart className="w-5 h-5" />}
          onClick={() => navigate('/pos')}
        />
        <QuickActionCard
          title="Add Catalog Product"
          description="Item & electrical specs"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => navigate('/products')}
        />
        <QuickActionCard
          title="Customer Account"
          description="Ledgers & credit terms"
          icon={<UserPlus className="w-5 h-5" />}
          onClick={() => navigate('/customers')}
        />
        <QuickActionCard
          title="Daily Cashflow"
          description="Operational income/expense"
          icon={<CreditCard className="w-5 h-5" />}
          onClick={() => navigate('/finance')}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#18181B] font-display flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
            Low Stock Reorder Alerts
          </h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
            View Full Inventory
          </Button>
        </div>
        <DataTable columns={columns} data={LOW_STOCK} keyExtractor={(item) => item.id} />
      </div>
    </PageContainer>
  );
};
