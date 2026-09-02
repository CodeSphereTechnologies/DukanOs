import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/common/StatCard';
import { TrendingUp, TrendingDown, Coins, Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';

interface LedgerItem {
  id: number;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
}

const INITIAL_FINANCE: LedgerItem[] = [
  { id: 1, category: 'Customer Payments', type: 'income', amount: 68450, description: 'POS Counter cash and bank payments', date: '2026-09-02' },
  { id: 2, category: 'Electricity Bill', type: 'expense', amount: 34200, description: 'LESCO Commercial Meter Bill for August', date: '2026-09-01' },
  { id: 3, category: 'Shop Rent', type: 'expense', amount: 85000, description: 'Plaza ground floor advance rent', date: '2026-09-01' },
];

export const FinancePage: React.FC = () => {
  const [items] = useState<LedgerItem[]>(INITIAL_FINANCE);
  const [search, setSearch] = useState('');

  const filtered = items.filter(
    (item) =>
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<LedgerItem>[] = [
    {
      key: 'category',
      header: 'Category & Description',
      render: (tx) => (
        <div>
          <div className="font-semibold text-[#18181B]">{tx.category}</div>
          <div className="text-xs text-[#71717A]">{tx.description}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      align: 'center',
      render: (tx) => (
        <Badge variant={tx.type === 'income' ? 'mint' : 'destructive'}>
          {tx.type === 'income' ? <span className="flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> Income</span> : <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Expense</span>}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (tx) => (
        <span className={`font-semibold ${tx.type === 'income' ? 'text-[#065F46]' : 'text-[#991B1B]'}`}>
          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      align: 'right',
      render: (tx) => formatDate(tx.date),
    },
  ];

  return (
    <PageContainer
      title="Daily Cashflow Ledger"
      subtitle="Track operational revenue, utility expenses, supplier payments, and store disbursements."
      primaryAction={
        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
          Record Entry
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Cash In (Month)"
          value={formatCurrency(820000)}
          change={{ value: '+14% vs last month', trend: 'up' }}
          icon={<TrendingUp className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Total Cash Out (Month)"
          value={formatCurrency(215000)}
          change={{ value: 'Rent + Utility + Misc', trend: 'neutral' }}
          icon={<TrendingDown className="w-5 h-5 text-[#991B1B]" />}
        />
        <StatCard
          title="Net Cash Position"
          value={formatCurrency(605000)}
          change={{ value: 'Positive cashflow', trend: 'up' }}
          icon={<Coins className="w-5 h-5" />}
        />
      </div>

      <div className="space-y-4">
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search transactions..."
        />
        <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
      </div>
    </PageContainer>
  );
};
