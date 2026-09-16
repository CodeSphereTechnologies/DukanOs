import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { QuickActionCard } from '../../../components/common/QuickActionCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  DollarSign,
  Users,
  AlertTriangle,
  ShoppingCart,
  Plus,
  CreditCard,
  UserPlus,
  ArrowUpRight,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { productService } from '../../../services/product.service';
import { invoiceService } from '../../../services/invoice.service';
import type { Invoice } from '../../../types/invoice.types';

const PAYMENT_VARIANT: Record<Invoice['payment_status'], 'mint' | 'warning' | 'destructive'> = {
  paid: 'mint',
  partial: 'warning',
  unpaid: 'destructive',
  ledger: 'destructive',
};

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    productService.getAll().then((res) => {
      if (res.data) {
        const count = res.data.filter((p) => {
          const stock = p.current_stock || 0;
          const threshold = p.min_quantity_threshold || 5;
          return stock > 0 && stock <= threshold;
        }).length;
        setLowStockCount(count);
      }
    });
  }, []);

  useEffect(() => {
    invoiceService.getAll().then((res) => {
      if (res.data) {
        const sorted = [...res.data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentInvoices(sorted.slice(0, 5));
      }
    });
  }, []);

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
          value={lowStockCount}
          change={{ value: lowStockCount > 0 ? 'Requires purchase order' : 'All stock healthy', trend: lowStockCount > 0 ? 'down' : 'neutral' }}
          icon={<AlertTriangle className="w-5 h-5 text-[#DC2626]" />}
          onClick={() => navigate('/products', { state: { stockFilter: 'low_stock' } })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#71717A]" />
            <h3 className="text-sm font-semibold text-[#18181B] font-display">Recent Invoices</h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#52525B] hover:text-black transition-colors"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-2xl shadow-subtle overflow-hidden">
          {recentInvoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#A1A1AA]">
              No invoices yet. Start your first sale from the POS counter.
            </div>
          ) : (
            <div className="divide-y divide-[#E4E4E7]/60">
              {recentInvoices.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => navigate('/invoices')}
                  className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-[#FAFAF8] transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div>
                      <div className="text-sm font-semibold text-black">{inv.invoice_number}</div>
                      <div className="text-xs text-[#71717A]">
                        {inv.customer?.name || 'Walk-in Customer'} · {formatDate(inv.invoice_date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-[#18181B]">{formatCurrency(inv.total_amount)}</span>
                    <Badge variant={PAYMENT_VARIANT[inv.payment_status]} size="sm">
                      {inv.payment_status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
