import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { TrendingUp, TrendingDown, Coins, Plus, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';

interface DailyTx {
  id: number;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
}

const INITIAL_TX: DailyTx[] = [
  { id: 1, category: 'Customer Payments', type: 'income', amount: 45000, description: 'POS Counter cash and bank payments', date: '2026-09-02' },
  { id: 2, category: 'Shop Rent', type: 'expense', amount: 85000, description: 'Plaza ground floor advance rent', date: '2026-09-01' },
  { id: 3, category: 'Customer Payments', type: 'income', amount: 92400, description: 'Al-Madina Construction invoice clearing', date: '2026-08-31' },
  { id: 4, category: 'Electricity Bill', type: 'expense', amount: 34200, description: 'LESCO Commercial Meter Bill for August', date: '2026-08-31' },
];

export const AccountantDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<DailyTx[]>(INITIAL_TX);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [category, setCategory] = useState('Utility');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const newEntry: DailyTx = {
      id: transactions.length + 1,
      category,
      type,
      amount: Number(amount),
      description: description || 'Direct entry',
      date: new Date().toISOString().split('T')[0],
    };

    setTransactions([newEntry, ...transactions]);
    setIsAddOpen(false);
    setAmount(0);
    setDescription('');
  };

  const columns: Column<DailyTx>[] = [
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
          {tx.type.toUpperCase()}
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
      title="Financial Accounting & Ledger"
      subtitle="Monthly cashflow position, receivables, expense management, and ledger stream."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddOpen(true)}
        >
          Record Transaction
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(820000)}
          change={{ value: '+14%', trend: 'up' }}
          icon={<TrendingUp className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(215000)}
          change={{ value: 'Rent + Utility + Misc', trend: 'neutral' }}
          icon={<TrendingDown className="w-5 h-5 text-[#991B1B]" />}
        />
        <StatCard
          title="Net Cashflow"
          value={formatCurrency(605000)}
          change={{ value: 'Positive balance', trend: 'up' }}
          icon={<Coins className="w-5 h-5" />}
        />
        <StatCard
          title="Receivables"
          value={formatCurrency(382400)}
          change={{ value: '3 Customer accounts', trend: 'neutral' }}
          icon={<DollarSign className="w-5 h-5 text-[#92400E]" />}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#18181B] font-display">Daily Cashflow Ledger Stream</h3>
        <DataTable columns={columns} data={transactions} keyExtractor={(item) => item.id} />
      </div>

      {/* Record Transaction Dialog */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Financial Transaction"
        description="Posts an income or expense record directly into the general cashflow ledger."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddTx}>
              Post Entry
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddTx} className="space-y-4">
          <FormField label="Transaction Type" required>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as 'income' | 'expense')}
              options={[
                { label: 'Expense (Cash Out)', value: 'expense' },
                { label: 'Income (Cash In)', value: 'income' },
              ]}
            />
          </FormField>
          <FormField label="Category" required>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { label: 'Utility / Electricity', value: 'Utility / Electricity' },
                { label: 'Shop Rent', value: 'Shop Rent' },
                { label: 'Supplier Payment', value: 'Supplier Payment' },
                { label: 'Customer Payments', value: 'Customer Payments' },
                { label: 'Miscellaneous', value: 'Miscellaneous' },
              ]}
            />
          </FormField>
          <FormField label="Amount (PKR)" required>
            <Input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="e.g. 15000"
              autoFocus
            />
          </FormField>
          <FormField label="Description / Remarks">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Commercial electricity bill payment"
            />
          </FormField>
        </form>
      </Dialog>
    </PageContainer>
  );
};
