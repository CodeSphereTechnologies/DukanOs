import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import { TrendingUp, TrendingDown, Coins, Plus, DollarSign, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { reportService } from '../../../services/report.service';
import type { FinancialSummary, CustomerBalance, DailyTransaction, LedgerCategory } from '../../../types/report.types';

interface LedgerRow {
  id: number;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
}

function monthBounds(offset: number = 0): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const iso = (d: Date) => d.toISOString().split('T')[0];
  return { from: iso(first), to: iso(last) };
}

export const AccountantDashboard: React.FC = () => {
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [balances, setBalances] = useState<CustomerBalance[]>([]);
  const [transactions, setTransactions] = useState<DailyTransaction[]>([]);
  const [categories, setCategories] = useState<LedgerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const range = useMemo(() => monthBounds(0), []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [finRes, balRes, txRes, catRes] = await Promise.all([
        reportService.getFinancial(range.from, range.to),
        reportService.getCustomerBalances(),
        reportService.getDailyTransactions({ from: range.from, to: range.to, per_page: 100 }),
        reportService.getLedgerCategories(),
      ]);
      if (finRes.data) setFinancial(finRes.data);
      if (balRes.data) setBalances(balRes.data);
      if (txRes.data?.data) setTransactions(txRes.data.data);
      if (catRes.data) setCategories(catRes.data);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load financial data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows: LedgerRow[] = useMemo(
    () =>
      transactions.map((tx) => ({
        id: tx.id,
        category: tx.category?.name ?? 'Miscellaneous',
        type: tx.type,
        amount: tx.amount,
        description: tx.description || tx.category?.name || 'Ledger entry',
        date: tx.transaction_date,
      })),
    [transactions]
  );

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c.type === type)
        .map((c) => ({ label: c.name, value: String(c.id) })),
    [categories, type]
  );

  const handleOpenAdd = () => {
    setType('expense');
    const firstExpense = categories.find((c) => c.type === 'expense');
    setCategoryId(firstExpense ? firstExpense.id : '');
    setTxDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setDescription('');
    setIsAddOpen(true);
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(amount);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      await reportService.postDailyTransaction({
        type,
        category_id: categoryId === '' ? undefined : Number(categoryId),
        amount: amountVal,
        transaction_date: txDate,
        description: description || `${type === 'income' ? 'Income' : 'Expense'} entry`,
      });
      setIsAddOpen(false);
      setAmount('');
      setDescription('');
      setSuccessMsg(`Posted ${type === 'income' ? 'income' : 'expense'} of ${formatCurrency(amountVal)} to the ledger.`);
      setTimeout(() => setSuccessMsg(null), 7000);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<LedgerRow>[] = [
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
          onClick={handleOpenAdd}
        >
          Record Transaction
        </Button>
      }
    >
      {successMsg && (
        <div className="mb-6">
          <Alert variant="success">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {successMsg}
            </span>
          </Alert>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6">
          <Alert variant="error">{errorMsg}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(financial?.income ?? 0)}
          change={{ value: loading ? 'Loading…' : `${transactions.filter((t) => t.type === 'income').length} credit entries`, trend: 'up' }}
          icon={<TrendingUp className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(financial?.expense ?? 0)}
          change={{ value: loading ? 'Loading…' : 'Rent + Utility + Misc', trend: 'neutral' }}
          icon={<TrendingDown className="w-5 h-5 text-[#991B1B]" />}
        />
        <StatCard
          title="Net Cashflow"
          value={formatCurrency(financial?.net ?? 0)}
          change={{
            value: (financial?.net ?? 0) >= 0 ? 'Positive balance' : 'Deficit position',
            trend: (financial?.net ?? 0) >= 0 ? 'up' : 'down',
          }}
          icon={<Coins className="w-5 h-5" />}
        />
        <StatCard
          title="Receivables"
          value={formatCurrency(financial?.outstanding ?? 0)}
          change={{ value: `${balances.length} customer ${balances.length === 1 ? 'account' : 'accounts'}`, trend: 'neutral' }}
          icon={<DollarSign className="w-5 h-5 text-[#92400E]" />}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#18181B] font-display">
          Daily Cashflow Ledger Stream <span className="text-[#71717A] font-normal">({rows.length} entries)</span>
        </h3>
        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={(item) => item.id}
          emptyMessage="No ledger transactions recorded this month."
        />
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
            <Button variant="primary" size="sm" onClick={handleAddTx} disabled={submitting}>
              {submitting ? 'Posting…' : 'Post Entry'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddTx} className="space-y-4">
          <FormField label="Transaction Type" required>
            <Select
              value={type}
              onChange={(e) => {
                const newType = e.target.value as 'income' | 'expense';
                setType(newType);
                const firstMatch = categories.find((c) => c.type === newType);
                setCategoryId(firstMatch ? firstMatch.id : '');
              }}
              options={[
                { label: 'Expense (Cash Out)', value: 'expense' },
                { label: 'Income (Cash In)', value: 'income' },
              ]}
            />
          </FormField>
          <FormField label="Category" required>
            <Select
              value={String(categoryId)}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { label: 'Select a category…', value: '' },
                ...categoryOptions,
              ]}
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Amount (PKR)" required>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="e.g. 15000"
                autoFocus
              />
            </FormField>
            <FormField label="Date" required>
              <Input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
            </FormField>
          </div>
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