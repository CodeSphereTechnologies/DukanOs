import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/common/StatCard';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Alert } from '../../../components/ui/Alert';
import {
  TrendingUp,
  TrendingDown,
  Coins,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  Trash2,
  CheckCircle2,
  User,
  Wallet,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { financeService, type FinanceLedgerItem } from '../../../services/finance.service';
import { customerService } from '../../../services/customer.service';
import type { Customer } from '../../../types/customer.types';

const EXPENSE_CATEGORIES = [
  { label: 'Electricity / Utility (LESCO)', value: 'Electricity Bill' },
  { label: 'Shop / Plaza Rent', value: 'Shop Rent' },
  { label: 'Supplier Payment', value: 'Supplier Payment' },
  { label: 'Staff Salaries & Daily Wages', value: 'Staff Salaries' },
  { label: 'Staff Meals & Tea', value: 'Staff Meals & Tea' },
  { label: 'Freight & Transport (Biltee)', value: 'Freight & Carriage' },
  { label: 'Store Maintenance & Repairs', value: 'Repairs & Maintenance' },
  { label: 'Packaging & Stationery', value: 'Packaging & Stationery' },
  { label: 'Miscellaneous Expense', value: 'Miscellaneous Expense' },
];

const INCOME_CATEGORIES = [
  { label: 'Customer Credit Recovery', value: 'Customer Recovery' },
  { label: 'Counter Cash Sales', value: 'Customer Payments' },
  { label: 'Owner Capital Injection', value: 'Owner Capital Injection' },
  { label: 'Scrap & Packaging Sale', value: 'Scrap Sale' },
  { label: 'Supplier Rebate / Incentive', value: 'Supplier Rebate' },
  { label: 'Miscellaneous Income', value: 'Miscellaneous Income' },
];

const PAYMENT_METHODS = [
  { label: 'Cash Counter Drawer', value: 'cash' },
  { label: 'Bank Transfer (HBL / Meezan)', value: 'bank_transfer' },
  { label: 'Bank Cheque', value: 'cheque' },
  { label: 'Online (Raast / JazzCash / Easypaisa)', value: 'online' },
];

export const FinancePage: React.FC = () => {
  const [items, setItems] = useState<FinanceLedgerItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recovery' | 'expense' | 'income'>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dialog States
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<FinanceLedgerItem | null>(null);

  // Recovery Form State
  const [recoveryCustomerId, setRecoveryCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [recoveryAmount, setRecoveryAmount] = useState<number | ''>('');
  const [recoveryMethod, setRecoveryMethod] = useState<'cash' | 'bank_transfer' | 'cheque' | 'online'>('cash');
  const [recoveryDate, setRecoveryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [recoveryRef, setRecoveryRef] = useState<string>(() => `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [recoveryNotes, setRecoveryNotes] = useState('');

  // General Entry Form State
  const [entryType, setEntryType] = useState<'expense' | 'income'>('expense');
  const [entryCategory, setEntryCategory] = useState('Electricity Bill');
  const [entryAmount, setEntryAmount] = useState<number | ''>('');
  const [entryMethod, setEntryMethod] = useState<'cash' | 'bank_transfer' | 'cheque' | 'online'>('bank_transfer');
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [entryRef, setEntryRef] = useState<string>('');
  const [entryDescription, setEntryDescription] = useState('');

  // Load ledger and customers
  const loadData = async () => {
    const [txRes, custRes] = await Promise.all([
      financeService.getTransactions(),
      customerService.getAll(),
    ]);
    if (txRes.data) setItems(txRes.data);
    if (custRes.data) setCustomers(custRes.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  // Selected customer object for Recovery Dialog
  const selectedCustomer = useMemo(() => {
    if (!recoveryCustomerId || recoveryCustomerId === 'custom') return null;
    return customers.find((c) => c.id === Number(recoveryCustomerId)) || null;
  }, [recoveryCustomerId, customers]);

  // Handle open Recovery dialog
  const handleOpenRecovery = () => {
    // Pick the first customer with an outstanding balance by default
    const firstDebtor = customers.find((c) => (c.current_balance || 0) > 0) || customers[0];
    if (firstDebtor) {
      setRecoveryCustomerId(String(firstDebtor.id));
      setRecoveryAmount(firstDebtor.current_balance || '');
    } else {
      setRecoveryCustomerId('custom');
      setRecoveryAmount('');
    }
    setCustomCustomerName('');
    setCustomCustomerPhone('');
    setRecoveryMethod('cash');
    setRecoveryDate(new Date().toISOString().split('T')[0]);
    setRecoveryRef(`REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setRecoveryNotes('');
    setIsRecoveryOpen(true);
  };

  // Handle submit recovery
  const handleSubmitRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(recoveryAmount);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter a valid recovery payment amount.');
      return;
    }

    const isCustom = recoveryCustomerId === 'custom';
    const targetName = isCustom ? customCustomerName.trim() : (selectedCustomer?.name || 'Customer');

    if (!targetName) {
      alert('Please select or specify customer name.');
      return;
    }

    const linkedCustId = isCustom ? undefined : selectedCustomer?.id;

    await financeService.recordRecovery({
      customer_id: linkedCustId,
      customer_name: targetName,
      amount: amountVal,
      payment_method: recoveryMethod,
      reference_no: recoveryRef || undefined,
      notes: recoveryNotes || `Credit Recovery from ${targetName}`,
      date: recoveryDate,
    });

    setIsRecoveryOpen(false);
    await loadData();

    setSuccessMsg(
      `Successfully recorded recovery of ${formatCurrency(amountVal)} from ${targetName}! Cashflow & customer ledger updated.`
    );
    setTimeout(() => setSuccessMsg(null), 7000);
  };

  // Handle open general record entry dialog
  const handleOpenRecord = () => {
    setEntryType('expense');
    setEntryCategory('Electricity Bill');
    setEntryAmount('');
    setEntryMethod('bank_transfer');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryRef(`TXN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setEntryDescription('');
    setIsRecordOpen(true);
  };

  // Handle submit general record entry
  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(entryAmount);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    await financeService.createTransaction({
      category: entryCategory,
      type: entryType,
      amount: amountVal,
      description: entryDescription || `${entryCategory} transaction`,
      date: entryDate,
      payment_method: entryMethod,
      reference_no: entryRef || undefined,
    });

    setIsRecordOpen(false);
    await loadData();

    setSuccessMsg(
      `Successfully recorded ${entryType === 'income' ? 'income' : 'expense'} of ${formatCurrency(amountVal)} for ${entryCategory}!`
    );
    setTimeout(() => setSuccessMsg(null), 7000);
  };

  // Handle delete transaction
  const handleDeleteTx = async (id: number) => {
    if (!confirm('Are you sure you want to void and remove this ledger transaction?')) return;
    await financeService.deleteTransaction(id);
    await loadData();
  };

  // Dynamic calculations
  const totalCashIn = useMemo(
    () => items.filter((i) => i.type === 'income').reduce((acc, cur) => acc + cur.amount, 0),
    [items]
  );
  const totalCashOut = useMemo(
    () => items.filter((i) => i.type === 'expense').reduce((acc, cur) => acc + cur.amount, 0),
    [items]
  );
  const netCashPosition = totalCashIn - totalCashOut;
  const totalRecoveries = useMemo(
    () => items.filter((i) => i.category === 'Customer Recovery').reduce((acc, cur) => acc + cur.amount, 0),
    [items]
  );

  // Filtered entries
  const filtered = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === 'recovery' && item.category !== 'Customer Recovery') return false;
      if (activeTab === 'expense' && item.type !== 'expense') return false;
      if (activeTab === 'income' && (item.type !== 'income' || item.category === 'Customer Recovery')) return false;

      // Search query
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(q)) ||
        (item.reference_no && item.reference_no.toLowerCase().includes(q)) ||
        (item.payment_method && item.payment_method.toLowerCase().includes(q))
      );
    });
  }, [items, activeTab, search]);

  const columns: Column<FinanceLedgerItem>[] = [
    {
      key: 'category',
      header: 'Category & Details',
      render: (tx) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#18181B]">{tx.category}</span>
            {tx.customer_name && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#F4F4F5] text-[#27272A] border border-[#E4E4E7]">
                <User className="w-3 h-3 text-[#71717A]" />
                {tx.customer_name}
              </span>
            )}
          </div>
          <div className="text-xs text-[#71717A] mt-0.5">{tx.description}</div>
        </div>
      ),
    },
    {
      key: 'payment_method',
      header: 'Payment / Ref',
      render: (tx) => (
        <div>
          <div className="capitalize text-xs font-medium text-[#27272A]">
            {tx.payment_method ? tx.payment_method.replace('_', ' ') : 'Cash'}
          </div>
          {tx.reference_no && (
            <div className="text-[11px] text-[#71717A] font-mono">{tx.reference_no}</div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      align: 'center',
      render: (tx) => (
        <Badge variant={tx.type === 'income' ? 'mint' : 'destructive'}>
          {tx.type === 'income' ? (
            <span className="flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Income
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Expense
            </span>
          )}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (tx) => (
        <span
          className={`font-bold font-mono ${
            tx.type === 'income' ? 'text-[#065F46]' : 'text-[#991B1B]'
          }`}
        >
          {tx.type === 'income' ? '+' : '-'}
          {formatCurrency(tx.amount)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      align: 'right',
      render: (tx) => formatDate(tx.date),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (tx) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedVoucher(tx)}
            title="View & Print Voucher"
          >
            <Printer className="w-3.5 h-3.5 text-[#52525B]" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTx(tx.id)}
            title="Remove Entry"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageContainer
        title="Daily Cashflow & Recovery Ledger"
        subtitle="Track operational revenue, customer credit recoveries (Vasooli), utility expenses, and disbursements."
        className="print:hidden"
      primaryAction={
        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Coins className="w-4 h-4 text-emerald-300" />}
            onClick={handleOpenRecovery}
            className="bg-[#047857] hover:bg-[#065F46] shadow-sm"
          >
            Add Recovery
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenRecord}
          >
            Record Entry
          </Button>
        </div>
      }
    >
      {/* Success Notification */}
      {successMsg && (
        <div className="mb-6">
          <Alert variant="success">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {successMsg}
              </span>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-xs underline hover:text-emerald-900"
              >
                Dismiss
              </button>
            </div>
          </Alert>
        </div>
      )}

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Cash In"
          value={formatCurrency(totalCashIn)}
          change={{ value: `${items.filter((i) => i.type === 'income').length} credit & pos receipts`, trend: 'up' }}
          icon={<TrendingUp className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Customer Recoveries"
          value={formatCurrency(totalRecoveries)}
          change={{ value: 'Collected on-account debt', trend: 'up' }}
          icon={<Coins className="w-5 h-5 text-[#0284C7]" />}
        />
        <StatCard
          title="Total Cash Out"
          value={formatCurrency(totalCashOut)}
          change={{ value: `${items.filter((i) => i.type === 'expense').length} bills & disbursements`, trend: 'neutral' }}
          icon={<TrendingDown className="w-5 h-5 text-[#991B1B]" />}
        />
        <StatCard
          title="Net Cash Position"
          value={formatCurrency(netCashPosition)}
          change={{ value: netCashPosition >= 0 ? 'Surplus cash balance' : 'Deficit position', trend: netCashPosition >= 0 ? 'up' : 'down' }}
          icon={<Wallet className="w-5 h-5 text-[#18181B]" />}
        />
      </div>

      <div className="space-y-4">
        {/* Filter Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
              }`}
            >
              All Entries ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('recovery')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'recovery'
                  ? 'bg-[#047857] text-white'
                  : 'text-[#71717A] hover:text-[#047857] hover:bg-[#F0FDF4]'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              Customer Recoveries ({items.filter((i) => i.category === 'Customer Recovery').length})
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'expense'
                  ? 'bg-[#DC2626] text-white'
                  : 'text-[#71717A] hover:text-[#DC2626] hover:bg-[#FEF2F2]'
              }`}
            >
              Expenses ({items.filter((i) => i.type === 'expense').length})
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'income'
                  ? 'bg-[#0284C7] text-white'
                  : 'text-[#71717A] hover:text-[#0284C7] hover:bg-[#F0F9FF]'
              }`}
            >
              Other Income ({items.filter((i) => i.type === 'income' && i.category !== 'Customer Recovery').length})
            </button>
          </div>
        </div>

        {/* Search Toolbar */}
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search transactions by category, customer name, ref #, description..."
        />

        {/* Transactions Table */}
        <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
      </div>

      {/* ========================================================= */}
      {/* 1. ADD RECOVERY MODAL (Vasooli)                           */}
      {/* ========================================================= */}
      <Dialog
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        title="Record Customer Recovery (Vasooli)"
        description="Collect on-account payment from a customer, deduct from their ledger balance, and post to daily cashflow."
        maxWidth="lg"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsRecoveryOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleSubmitRecovery}
              className="bg-[#047857] hover:bg-[#065F46]"
            >
              Save Recovery & Post Ledger
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitRecovery} className="space-y-4">
          {/* Customer Selection */}
          <FormField label="Customer Account" required>
            <Select
              value={recoveryCustomerId}
              onChange={(e) => {
                const val = e.target.value;
                setRecoveryCustomerId(val);
                if (val && val !== 'custom') {
                  const cust = customers.find((c) => c.id === Number(val));
                  if (cust && cust.current_balance > 0) {
                    setRecoveryAmount(cust.current_balance);
                  }
                }
              }}
              options={[
                ...customers.map((c) => ({
                  label: `${c.name} — (Balance: ${formatCurrency(c.current_balance || 0)})`,
                  value: String(c.id),
                })),
                { label: '+ Walk-in / Unregistered Debtor', value: 'custom' },
              ]}
            />
          </FormField>

          {/* If Registered Customer Selected: Live Balance Card */}
          {selectedCustomer && (
            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-[#14532D] text-sm">{selectedCustomer.name}</div>
                <div className="text-[#15803D] mt-0.5">
                  Phone: {selectedCustomer.phone || 'N/A'} &bull; Area: {selectedCustomer.address || 'Local'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#15803D] font-medium">Outstanding Balance</div>
                <div className="text-base font-extrabold text-[#DC2626]">
                  {formatCurrency(selectedCustomer.current_balance || 0)}
                </div>
              </div>
            </div>
          )}

          {/* If Custom Customer: Text Inputs */}
          {recoveryCustomerId === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7]">
              <FormField label="Customer Name" required>
                <Input
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  placeholder="e.g. Master Farooq (Electrician)"
                  autoFocus
                />
              </FormField>
              <FormField label="Contact Phone">
                <Input
                  value={customCustomerPhone}
                  onChange={(e) => setCustomCustomerPhone(e.target.value)}
                  placeholder="e.g. +92 300 0000000"
                />
              </FormField>
            </div>
          )}

          {/* Quick Amount Suggestion Buttons */}
          {selectedCustomer && (selectedCustomer.current_balance || 0) > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#71717A] font-medium">Quick Fill:</span>
              <button
                type="button"
                onClick={() => setRecoveryAmount(selectedCustomer.current_balance)}
                className="px-2.5 py-1 bg-[#E4E4E7] hover:bg-[#D4D4D8] rounded-md font-medium text-[#18181B]"
              >
                Full ({formatCurrency(selectedCustomer.current_balance)})
              </button>
              <button
                type="button"
                onClick={() => setRecoveryAmount(Math.round(selectedCustomer.current_balance / 2))}
                className="px-2.5 py-1 bg-[#E4E4E7] hover:bg-[#D4D4D8] rounded-md font-medium text-[#18181B]"
              >
                50% ({formatCurrency(Math.round(selectedCustomer.current_balance / 2))})
              </button>
              <button
                type="button"
                onClick={() => setRecoveryAmount(10000)}
                className="px-2 py-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-md text-[#52525B]"
              >
                10k
              </button>
              <button
                type="button"
                onClick={() => setRecoveryAmount(25000)}
                className="px-2 py-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-md text-[#52525B]"
              >
                25k
              </button>
              <button
                type="button"
                onClick={() => setRecoveryAmount(50000)}
                className="px-2 py-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-md text-[#52525B]"
              >
                50k
              </button>
            </div>
          )}

          {/* Amount and Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Recovery Amount (PKR)" required>
              <Input
                type="number"
                value={recoveryAmount}
                onChange={(e) => setRecoveryAmount(Number(e.target.value))}
                placeholder="e.g. 45000"
                autoFocus={recoveryCustomerId !== 'custom'}
              />
            </FormField>
            <FormField label="Payment Method" required>
              <Select
                value={recoveryMethod}
                onChange={(e) => setRecoveryMethod(e.target.value as 'cash' | 'bank_transfer' | 'cheque' | 'online')}
                options={PAYMENT_METHODS}
              />
            </FormField>
          </div>

          {/* Live Remaining Balance Calculation */}
          {selectedCustomer && Number(recoveryAmount) > 0 && (
            <div className="p-3 bg-[#F4F4F5] rounded-xl flex items-center justify-between text-xs border border-[#E4E4E7]">
              <span className="text-[#52525B] font-medium">Customer Balance After This Recovery:</span>
              <span className="font-mono font-bold text-sm text-[#065F46]">
                {formatCurrency(Math.max(0, (selectedCustomer.current_balance || 0) - Number(recoveryAmount)))}
              </span>
            </div>
          )}

          {/* Date & Ref Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Recovery Date" required>
              <Input
                type="date"
                value={recoveryDate}
                onChange={(e) => setRecoveryDate(e.target.value)}
              />
            </FormField>
            <FormField label="Receipt / Ref Voucher #">
              <Input
                value={recoveryRef}
                onChange={(e) => setRecoveryRef(e.target.value)}
                placeholder="e.g. REC-2026-0042"
              />
            </FormField>
          </div>

          {/* Notes / Remarks */}
          <FormField label="Remarks / Ledger Note">
            <Textarea
              value={recoveryNotes}
              onChange={(e) => setRecoveryNotes(e.target.value)}
              placeholder="e.g. Partial recovery against July credit sales / received by cashier at counter"
              rows={2}
            />
          </FormField>
        </form>
      </Dialog>

      {/* ========================================================= */}
      {/* 2. RECORD GENERAL ENTRY MODAL (Expense / Other Income)    */}
      {/* ========================================================= */}
      <Dialog
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Financial Transaction"
        description="Post an operational expense or miscellaneous income entry directly to the general cashflow ledger."
        maxWidth="lg"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsRecordOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleSubmitRecord}
            >
              Post Transaction
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitRecord} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Transaction Type" required>
              <Select
                value={entryType}
                onChange={(e) => {
                  const newType = e.target.value as 'expense' | 'income';
                  setEntryType(newType);
                  setEntryCategory(newType === 'expense' ? EXPENSE_CATEGORIES[0].value : INCOME_CATEGORIES[0].value);
                }}
                options={[
                  { label: 'Expense (Cash Out)', value: 'expense' },
                  { label: 'Income (Cash In)', value: 'income' },
                ]}
              />
            </FormField>
            <FormField label="Category" required>
              <Select
                value={entryCategory}
                onChange={(e) => setEntryCategory(e.target.value)}
                options={entryType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Amount (PKR)" required>
              <Input
                type="number"
                value={entryAmount}
                onChange={(e) => setEntryAmount(Number(e.target.value))}
                placeholder="e.g. 15000"
                autoFocus
              />
            </FormField>
            <FormField label="Payment Method" required>
              <Select
                value={entryMethod}
                onChange={(e) => setEntryMethod(e.target.value as 'cash' | 'bank_transfer' | 'cheque' | 'online')}
                options={PAYMENT_METHODS}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Transaction Date" required>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </FormField>
            <FormField label="Voucher / Reference #">
              <Input
                value={entryRef}
                onChange={(e) => setEntryRef(e.target.value)}
                placeholder="e.g. LESCO-991204 or CHQ-448102"
              />
            </FormField>
          </div>

          <FormField label="Description / Remarks" required>
            <Input
              value={entryDescription}
              onChange={(e) => setEntryDescription(e.target.value)}
              placeholder="e.g. LESCO Commercial Meter August bill payment / Plaza shop rent"
            />
          </FormField>
        </form>
      </Dialog>

      {/* ========================================================= */}
      {/* 3. VOUCHER / RECEIPT PREVIEW DIALOG                      */}
      {/* ========================================================= */}
      <Dialog
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        title="Transaction Voucher Receipt"
        description="Official financial voucher for store accounts & audit records."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="sm" onClick={() => setSelectedVoucher(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Voucher
            </Button>
          </div>
        }
      >
        {selectedVoucher && (
          <div className="p-4 border border-[#E4E4E7] rounded-xl bg-white space-y-4 text-xs font-sans">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#E4E4E7] pb-3">
              <div>
                <div className="font-bold text-base text-[#18181B] font-display">PUNJAB ELECTRIC STORE</div>
                <div className="text-[11px] text-[#71717A]">Wholesale Electrical & Hardware Supplies</div>
                <div className="text-[10px] text-[#A1A1AA]">HUSSAINI CHOWK BAHAWALPUR</div>
              </div>
              <div className="text-right">
                <Badge variant={selectedVoucher.type === 'income' ? 'mint' : 'destructive'}>
                  {selectedVoucher.type === 'income' ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER'}
                </Badge>
                <div className="mt-1 text-xs font-mono font-bold text-[#18181B]">
                  {selectedVoucher.reference_no || `VCH-${selectedVoucher.id}`}
                </div>
                <div className="text-[10px] text-[#71717A]">{formatDate(selectedVoucher.date)}</div>
              </div>
            </div>

            {/* Details Table */}
            <div className="grid grid-cols-2 gap-3 py-2 border-b border-[#E4E4E7]">
              <div>
                <span className="text-[#71717A] block text-[10px] uppercase font-semibold">
                  {selectedVoucher.type === 'income' ? 'Received From' : 'Paid To / Category'}
                </span>
                <span className="font-bold text-sm text-[#18181B]">
                  {selectedVoucher.customer_name || selectedVoucher.category}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[#71717A] block text-[10px] uppercase font-semibold">Payment Mode</span>
                <span className="font-bold text-sm text-[#18181B] capitalize">
                  {selectedVoucher.payment_method ? selectedVoucher.payment_method.replace('_', ' ') : 'Cash'}
                </span>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <span className="text-[#71717A] block text-[10px] uppercase font-semibold">Narration / Remarks</span>
              <p className="text-[#27272A] mt-0.5">{selectedVoucher.description}</p>
            </div>

            {/* Total Amount Box */}
            <div className="p-3 bg-[#F4F4F5] rounded-lg flex items-center justify-between">
              <span className="font-bold text-sm text-[#18181B]">Total Amount:</span>
              <span
                className={`font-mono font-black text-lg ${
                  selectedVoucher.type === 'income' ? 'text-[#065F46]' : 'text-[#991B1B]'
                }`}
              >
                {formatCurrency(selectedVoucher.amount)}
              </span>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-[11px] text-[#71717A]">
              <div className="border-t border-[#D4D4D8] pt-1 text-center">Prepared / Cashier By</div>
              <div className="border-t border-[#D4D4D8] pt-1 text-center">Authorized Signature</div>
            </div>
          </div>
        )}
      </Dialog>
      </PageContainer>

      {/* Print-Only Voucher Slip */}
      {selectedVoucher && (
        <div className="hidden print:block">
          <div className="mx-auto bg-white text-black max-w-[320px] p-6 font-mono text-[11px] leading-[1.6]">
            <div className="text-center mb-1">
              <div className="text-lg font-bold tracking-[0.2em]">DUKANOS</div>
              <div className="text-[10px]">ELECTRICAL &amp; APPLIANCE STORE</div>
              <div>HUSSAINI CHOWK BAHAWALPUR</div>
              <div>Tel: 0300-1234567</div>
            </div>

            <div className="text-center my-2">- - - - - - - - - - - - - - - -</div>

            <div className="flex justify-between">
              <span className="font-bold uppercase">
                {selectedVoucher.type === 'income' ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ref #</span>
              <span className="font-bold">{selectedVoucher.reference_no || `VCH-${selectedVoucher.id}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>{formatDate(selectedVoucher.date)}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span>{selectedVoucher.type === 'income' ? 'Received From' : 'Paid To'}</span>
              <span className="font-bold text-right">{selectedVoucher.customer_name || selectedVoucher.category}</span>
            </div>
            <div className="flex justify-between">
              <span>Mode</span>
              <span className="uppercase">
                {selectedVoucher.payment_method ? selectedVoucher.payment_method.replace('_', ' ') : 'Cash'}
              </span>
            </div>

            {selectedVoucher.description && (
              <>
                <div className="text-center my-2">- - - - - - - - - - - - - - - -</div>
                <div>
                  <div className="uppercase text-[10px]">Narration</div>
                  <div>{selectedVoucher.description}</div>
                </div>
              </>
            )}

            <div className="text-center my-2">- - - - - - - - - - - - - - - -</div>

            <div className="flex justify-between font-bold text-[13px] border-t border-black pt-1.5">
              <span>TOTAL</span>
              <span>{formatCurrency(selectedVoucher.amount)}</span>
            </div>

            <div className="text-center my-3">***</div>

            <div className="text-center text-[10px]">
              <div>This is a computer generated slip.</div>
              <div>Subject to audit verification.</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

