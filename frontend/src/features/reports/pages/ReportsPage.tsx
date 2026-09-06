import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Printer,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart,
  Users,
  ShoppingBag,
  Coins,
  Wallet,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { invoiceService } from '../../../services/invoice.service';
import { financeService, type FinanceLedgerItem } from '../../../services/finance.service';
import { customerService } from '../../../services/customer.service';
import { payrollService, type EmployeeSalary } from '../../../services/payroll.service';
import { productService } from '../../../services/product.service';
import type { Invoice } from '../../../types/invoice.types';
import type { Customer } from '../../../types/customer.types';
import type { Product } from '../../../types/product.types';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [financeItems, setFinanceItems] = useState<FinanceLedgerItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & tab states
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [activeTab, setActiveTab] = useState<'pnl' | 'sales' | 'receivables' | 'cashflow'>('pnl');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Load all operational data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [invRes, finRes, custRes, payRes, prodRes] = await Promise.all([
        invoiceService.getAll(),
        financeService.getTransactions(),
        customerService.getAll(),
        payrollService.getEmployees(),
        productService.getAll(),
      ]);

      if (invRes.data) setInvoices(invRes.data);
      if (finRes.data) setFinanceItems(finRes.data);
      if (custRes.data) setCustomers(custRes.data);
      if (payRes.data) setSalaries(payRes.data);
      if (prodRes.data) setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load report analytics data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Financial Metrics Calculations
  const grossSales = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    [invoices]
  );

  const totalCollectedCash = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
    [invoices]
  );

  const customerRecoveries = useMemo(
    () =>
      financeItems
        .filter((item) => item.category === 'Customer Recovery' && item.type === 'income')
        .reduce((sum, item) => sum + item.amount, 0),
    [financeItems]
  );

  const totalRevenue = grossSales;

  const utilityExpenses = useMemo(
    () =>
      financeItems
        .filter((item) => item.type === 'expense' && (item.category.includes('Electricity') || item.category.includes('Utility')))
        .reduce((sum, item) => sum + item.amount, 0),
    [financeItems]
  );

  const rentExpenses = useMemo(
    () =>
      financeItems
        .filter((item) => item.type === 'expense' && item.category.includes('Rent'))
        .reduce((sum, item) => sum + item.amount, 0),
    [financeItems]
  );

  const payrollDisbursed = useMemo(
    () => salaries.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.net_payable, 0),
    [salaries]
  );

  const otherExpenses = useMemo(
    () =>
      financeItems
        .filter(
          (item) =>
            item.type === 'expense' &&
            !item.category.includes('Rent') &&
            !item.category.includes('Electricity') &&
            !item.category.includes('Utility')
        )
        .reduce((sum, item) => sum + item.amount, 0),
    [financeItems]
  );

  const totalOperatingExpenses = utilityExpenses + rentExpenses + payrollDisbursed + otherExpenses;
  const netOperatingProfit = totalRevenue - totalOperatingExpenses;
  const profitMarginPercent = totalRevenue > 0 ? ((netOperatingProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const totalReceivables = useMemo(
    () => customers.reduce((sum, c) => sum + (c.current_balance || 0), 0),
    [customers]
  );

  const totalInventoryValuation = useMemo(
    () => products.reduce((sum, p) => sum + p.selling_price * p.current_stock, 0),
    [products]
  );

  // CSV Export Action
  const handleExportCSV = () => {
    const rows = [
      ['DUKANOS ERP - FINANCIAL & SALES ANALYTICS REPORT'],
      ['Generated At', new Date().toLocaleString()],
      ['Reporting Scope', selectedPeriod === 'month' ? 'Current Month (September 2026)' : 'Year to Date'],
      [],
      ['EXECUTIVE FINANCIAL METRICS'],
      ['Metric', 'Amount (PKR)'],
      ['Gross Invoiced Sales', grossSales],
      ['Cash Collected from Invoices', totalCollectedCash],
      ['Customer Credit Recoveries (Vasooli)', customerRecoveries],
      ['Staff Salaries & Payroll Disbursed', payrollDisbursed],
      ['Store Rent Expense', rentExpenses],
      ['Electricity & Utility (LESCO)', utilityExpenses],
      ['Other Operating Expenses', otherExpenses],
      ['Total Operating Expenses', totalOperatingExpenses],
      ['Net Operating Profit', netOperatingProfit],
      ['Net Profit Margin (%)', `${profitMarginPercent}%`],
      ['Total Outstanding Customer Receivables', totalReceivables],
      ['Total Inventory Asset Valuation', totalInventoryValuation],
      [],
      ['CUSTOMER RECEIVABLES (KHATA) BREAKDOWN'],
      ['Customer Name', 'Phone', 'Address / Area', 'Outstanding Balance (PKR)', 'Status'],
      ...customers.map((c) => [c.name, c.phone || 'N/A', c.address || 'Local', c.current_balance, c.status]),
      [],
      ['INVOICE SALES RECORD'],
      ['Invoice Number', 'Customer', 'Date', 'Bill Total (PKR)', 'Paid (PKR)', 'Balance (PKR)', 'Status', 'Payment Method'],
      ...invoices.map((inv) => [
        inv.invoice_number,
        inv.customer?.name || 'Walk-in',
        inv.invoice_date,
        inv.total_amount,
        inv.paid_amount,
        inv.balance_amount,
        inv.payment_status,
        inv.payment_method || 'cash',
      ]),
      [],
      ['CASHFLOW LEDGER TRANSACTIONS'],
      ['Category', 'Type', 'Amount (PKR)', 'Date', 'Payment Mode', 'Reference #', 'Narration'],
      ...financeItems.map((tx) => [
        tx.category,
        tx.type,
        tx.amount,
        tx.date,
        tx.payment_method || 'cash',
        tx.reference_no || '',
        tx.description,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows
        .map((row) =>
          row
            .map((cell) => {
              const str = String(cell ?? '');
              return `"${str.replace(/"/g, '""')}"`;
            })
            .join(',')
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `dukanos_financial_report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Financial report successfully downloaded as CSV spreadsheet!');
    setTimeout(() => setExportNotice(null), 5000);
  };

  // Columns for Sales Invoices Tab
  const salesColumns: Column<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      render: (inv) => <span className="font-semibold text-[#18181B] font-mono">{inv.invoice_number}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (inv) => (
        <div>
          <div className="font-medium text-[#18181B]">{inv.customer?.name || 'Walk-in Customer'}</div>
          <div className="text-[11px] text-[#71717A] capitalize">{inv.payment_method || 'cash'} payment</div>
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Bill Amount',
      align: 'right',
      render: (inv) => <span className="font-bold text-[#18181B] font-mono">{formatCurrency(inv.total_amount)}</span>,
    },
    {
      key: 'paid_amount',
      header: 'Paid Amount',
      align: 'right',
      render: (inv) => <span className="font-mono text-[#065F46] font-medium">{formatCurrency(inv.paid_amount)}</span>,
    },
    {
      key: 'balance_amount',
      header: 'Balance',
      align: 'right',
      render: (inv) => (
        <span className={`font-mono font-bold ${inv.balance_amount > 0 ? 'text-[#DC2626]' : 'text-[#71717A]'}`}>
          {formatCurrency(inv.balance_amount)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      header: 'Status',
      align: 'center',
      render: (inv) => (
        <Badge
          variant={
            inv.payment_status === 'paid'
              ? 'mint'
              : inv.payment_status === 'partial'
              ? 'warning'
              : 'destructive'
          }
        >
          {inv.payment_status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'invoice_date',
      header: 'Date',
      align: 'right',
      render: (inv) => formatDate(inv.invoice_date),
    },
  ];

  // Columns for Customer Receivables (Khata) Tab
  const receivablesColumns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer Account',
      render: (c) => (
        <div>
          <div className="font-semibold text-[#18181B]">{c.name}</div>
          <div className="text-xs text-[#71717A]">{c.phone || 'No phone recorded'}</div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Area / Market',
      render: (c) => <span className="text-xs text-[#52525B]">{c.address || 'Local Customer'}</span>,
    },
    {
      key: 'current_balance',
      header: 'Outstanding Balance',
      align: 'right',
      render: (c) => (
        <span className={`font-mono font-bold text-sm ${(c.current_balance || 0) > 0 ? 'text-[#DC2626]' : 'text-[#065F46]'}`}>
          {formatCurrency(c.current_balance || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Khata Status',
      align: 'center',
      render: (c) => {
        const bal = c.current_balance || 0;
        if (bal > 100000) {
          return <Badge variant="destructive">High Credit</Badge>;
        } else if (bal > 0) {
          return <Badge variant="warning">Active Credit</Badge>;
        }
        return <Badge variant="mint">Cleared (0)</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (c) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/finance')}
          leftIcon={<Coins className="w-3.5 h-3.5 text-[#047857]" />}
        >
          Collect Recovery
        </Button>
      ),
    },
  ];

  // Columns for Cashflow Ledger Tab
  const cashflowColumns: Column<FinanceLedgerItem>[] = [
    {
      key: 'category',
      header: 'Transaction & Details',
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
      key: 'payment_method',
      header: 'Mode / Ref',
      render: (tx) => (
        <div>
          <span className="text-xs capitalize text-[#27272A] font-medium">
            {tx.payment_method ? tx.payment_method.replace('_', ' ') : 'Cash'}
          </span>
          {tx.reference_no && (
            <span className="block text-[11px] font-mono text-[#71717A]">{tx.reference_no}</span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (tx) => (
        <span
          className={`font-mono font-bold ${
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
  ];

  return (
    <PageContainer
      title="Financial & Sales Analytics"
      subtitle="Comprehensive revenue, inventory turns, profit/loss, customer receivables, and cashflow audit."
      primaryAction={
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => setIsPrintModalOpen(true)}
          >
            Export PDF / A4
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Download CSV
          </Button>
        </div>
      }
    >
      {/* Export Notification Banner */}
      {exportNotice && (
        <div className="mb-6">
          <Alert variant="success">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {exportNotice}
              </span>
              <button
                onClick={() => setExportNotice(null)}
                className="text-xs underline hover:text-emerald-900"
              >
                Dismiss
              </button>
            </div>
          </Alert>
        </div>
      )}

      {/* Scope Toolbar & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#E4E4E7] rounded-xl mb-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-[#18181B] font-semibold">
          <Calendar className="w-4 h-4 text-[#71717A]" />
          <span>Accounting Reporting Period:</span>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={[
              { label: 'Current Month (September 2026)', value: 'month' },
              { label: 'Last Month (August 2026)', value: 'last_month' },
              { label: 'Current Quarter (Q3 2026)', value: 'quarter' },
              { label: 'Fiscal Year to Date (YTD 2026)', value: 'ytd' },
              { label: 'All Historic Records', value: 'all' },
            ]}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAllData}
            title="Refresh Data"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Top Level Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Gross Invoiced Sales"
          value={formatCurrency(grossSales)}
          change={{ value: `${invoices.length} invoices issued`, trend: 'up' }}
          icon={<DollarSign className="w-5 h-5 text-[#18181B]" />}
        />
        <StatCard
          title="Net Operating Profit"
          value={formatCurrency(netOperatingProfit)}
          change={{ value: `${profitMarginPercent}% Margin`, trend: netOperatingProfit >= 0 ? 'up' : 'down' }}
          icon={<TrendingUp className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Total Operating Expenses"
          value={formatCurrency(totalOperatingExpenses)}
          change={{ value: 'Rent + Utility + Payroll', trend: 'neutral' }}
          icon={<TrendingDown className="w-5 h-5 text-[#991B1B]" />}
        />
        <StatCard
          title="Customer Receivables (Khata)"
          value={formatCurrency(totalReceivables)}
          change={{ value: `${customers.filter((c) => (c.current_balance || 0) > 0).length} debtor accounts`, trend: 'neutral' }}
          icon={<Coins className="w-5 h-5 text-[#D97706]" />}
        />
      </div>

      {/* Analytics Tabs Navigation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E4E4E7] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pnl'
                ? 'bg-[#18181B] text-white'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Profit & Loss (P&L) Statement
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sales'
                ? 'bg-[#18181B] text-white'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Sales & Invoicing ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('receivables')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'receivables'
                ? 'bg-[#18181B] text-white'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Customer Receivables & Khata ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cashflow'
                ? 'bg-[#18181B] text-white'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Cashflow Audit Stream ({financeItems.length})
          </button>
        </div>

        {/* TAB 1: PROFIT & LOSS STATEMENT */}
        {activeTab === 'pnl' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue / Income Inflows */}
            <div className="p-5 bg-white border border-[#E4E4E7] rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#F0FDF4] rounded-lg text-[#065F46]">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#18181B]">Operating Inflows & Revenues</h3>
                </div>
                <span className="font-mono font-bold text-sm text-[#065F46]">{formatCurrency(totalRevenue)}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#F4F4F5]">
                  <div>
                    <span className="font-medium text-[#18181B]">Invoiced Commercial Sales</span>
                    <span className="block text-[11px] text-[#71717A]">Wholesale & retail customer orders</span>
                  </div>
                  <span className="font-mono font-semibold text-[#18181B]">{formatCurrency(grossSales)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#F4F4F5]">
                  <div>
                    <span className="font-medium text-[#18181B]">Customer Credit Recoveries (Vasooli)</span>
                    <span className="block text-[11px] text-[#71717A]">Payments collected against old Khata debt</span>
                  </div>
                  <span className="font-mono font-semibold text-[#065F46]">+{formatCurrency(customerRecoveries)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#F4F4F5]">
                  <div>
                    <span className="font-medium text-[#18181B]">Actual Cash Drawer Collected</span>
                    <span className="block text-[11px] text-[#71717A]">Instant cash & verified bank transfers</span>
                  </div>
                  <span className="font-mono font-semibold text-[#18181B]">{formatCurrency(totalCollectedCash)}</span>
                </div>
              </div>

              <div className="p-3 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0] flex justify-between items-center text-xs">
                <span className="font-bold text-[#14532D]">Total Operating Inflows:</span>
                <span className="font-mono font-black text-base text-[#065F46]">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>

            {/* Operating Expenditures */}
            <div className="p-5 bg-white border border-[#E4E4E7] rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#FEF2F2] rounded-lg text-[#991B1B]">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#18181B]">Operating Disbursements & Expenses</h3>
                </div>
                <span className="font-mono font-bold text-sm text-[#991B1B]">{formatCurrency(totalOperatingExpenses)}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#F4F4F5]">
                  <div>
                    <span className="font-medium text-[#18181B]">Staff Salaries & Payroll</span>
                    <span className="block text-[11px] text-[#71717A]">Monthly wages for {salaries.length} staff</span>
                  </div>
                  <span className="font-mono font-semibold text-[#991B1B]">-{formatCurrency(payrollDisbursed)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#F4F4F5]">
                  <div>
                    <span className="font-medium text-[#18181B]">Plaza / Store Rent</span>
                    <span className="block text-[11px] text-[#71717A]">Ground floor commercial space</span>
                  </div>
                  <span className="font-mono font-semibold text-[#991B1B]">-{formatCurrency(rentExpenses)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#F4F4F5]">
                  <div>
                    <span className="font-medium text-[#18181B]">Electricity & Utilities (LESCO)</span>
                    <span className="block text-[11px] text-[#71717A]">Commercial power meter bill</span>
                  </div>
                  <span className="font-mono font-semibold text-[#991B1B]">-{formatCurrency(utilityExpenses)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#F4F4F5]">
                  <div>
                    <span className="font-medium text-[#18181B]">Freight, Maintenance & Miscellaneous</span>
                    <span className="block text-[11px] text-[#71717A]">Biltee, store upkeep, tea & refreshments</span>
                  </div>
                  <span className="font-mono font-semibold text-[#991B1B]">-{formatCurrency(otherExpenses)}</span>
                </div>
              </div>

              <div className="p-3 bg-[#FEF2F2] rounded-lg border border-[#FECACA] flex justify-between items-center text-xs">
                <span className="font-bold text-[#7F1D1D]">Total Operating Outflows:</span>
                <span className="font-mono font-black text-base text-[#991B1B]">{formatCurrency(totalOperatingExpenses)}</span>
              </div>
            </div>

            {/* Bottom Net Margin Summary Card */}
            <div className="lg:col-span-2 p-5 bg-[#FAFAF8] border border-[#E4E4E7] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-bold text-base text-[#18181B] flex items-center gap-2">
                  <span>Net Commercial Position:</span>
                  <Badge variant={netOperatingProfit >= 0 ? 'mint' : 'destructive'}>
                    {netOperatingProfit >= 0 ? 'NET PROFIT' : 'DEFICIT'}
                  </Badge>
                </div>
                <div className="text-xs text-[#71717A] mt-1">
                  Operating Profit Margin is currently calculated at{' '}
                  <span className="font-bold text-[#18181B]">{profitMarginPercent}%</span> against gross invoiced revenues.
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#71717A] block uppercase font-medium">Net Retained Margin</span>
                <span
                  className={`font-mono font-black text-2xl ${
                    netOperatingProfit >= 0 ? 'text-[#065F46]' : 'text-[#991B1B]'
                  }`}
                >
                  {formatCurrency(netOperatingProfit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SALES & INVOICING */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            <DataTable columns={salesColumns} data={invoices} keyExtractor={(inv) => inv.id} />
          </div>
        )}

        {/* TAB 3: CUSTOMER RECEIVABLES & KHATA */}
        {activeTab === 'receivables' && (
          <div className="space-y-4">
            <DataTable columns={receivablesColumns} data={customers} keyExtractor={(c) => c.id} />
          </div>
        )}

        {/* TAB 4: CASHFLOW AUDIT STREAM */}
        {activeTab === 'cashflow' && (
          <div className="space-y-4">
            <DataTable columns={cashflowColumns} data={financeItems} keyExtractor={(item) => item.id} />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* PRINTABLE EXECUTIVE REPORT MODAL (A4 Format)               */}
      {/* ========================================================= */}
      <Dialog
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Executive Financial & Operational Report"
        description="Comprehensive accounting statement formatted for print, audit review, and board presentation."
        maxWidth="lg"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsPrintModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Report (A4)
            </Button>
          </div>
        }
      >
        <div className="p-6 border border-[#E4E4E7] rounded-xl bg-white space-y-6 text-xs font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-[#E4E4E7] pb-4">
            <div>
              <div className="font-extrabold text-xl text-[#18181B] font-display">DUKANOS TRADING & CO.</div>
              <div className="text-xs text-[#52525B]">Wholesale Electrical & Hardware Suppliers</div>
              <div className="text-[11px] text-[#71717A]">Brandreth Road, Lahore &bull; NTN # 4920194-8</div>
            </div>
            <div className="text-right">
              <Badge variant="mint">EXECUTIVE AUDIT REPORT</Badge>
              <div className="mt-1.5 font-mono text-xs font-bold text-[#18181B]">
                REPORT-SEP-2026
              </div>
              <div className="text-[10px] text-[#71717A]">
                Date: {formatDate(new Date().toISOString().split('T')[0])}
              </div>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E4E4E7]">
              <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Total Revenue</span>
              <span className="font-mono font-bold text-sm text-[#18181B]">{formatCurrency(grossSales)}</span>
            </div>
            <div className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E4E4E7]">
              <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Operating Costs</span>
              <span className="font-mono font-bold text-sm text-[#991B1B]">{formatCurrency(totalOperatingExpenses)}</span>
            </div>
            <div className="p-3 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0]">
              <span className="text-[10px] text-[#15803D] uppercase block font-semibold">Net Profit</span>
              <span className="font-mono font-black text-sm text-[#065F46]">{formatCurrency(netOperatingProfit)}</span>
            </div>
            <div className="p-3 bg-[#FEF2F2] rounded-lg border border-[#FECACA]">
              <span className="text-[10px] text-[#991B1B] uppercase block font-semibold">Customer Debt</span>
              <span className="font-mono font-bold text-sm text-[#DC2626]">{formatCurrency(totalReceivables)}</span>
            </div>
          </div>

          {/* P&L Statement Table */}
          <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
            <div className="bg-[#F4F4F5] px-3 py-2 font-bold text-[#18181B] border-b border-[#E4E4E7]">
              Profit & Loss Summary Breakdown
            </div>
            <table className="w-full text-left text-xs">
              <tbody>
                <tr className="border-b border-[#F4F4F5]">
                  <td className="p-2.5 font-medium">1. Gross Invoiced Commercial Sales</td>
                  <td className="p-2.5 text-right font-mono font-semibold">{formatCurrency(grossSales)}</td>
                </tr>
                <tr className="border-b border-[#F4F4F5]">
                  <td className="p-2.5 font-medium">2. Customer Credit Recoveries (Vasooli)</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-[#065F46]">+{formatCurrency(customerRecoveries)}</td>
                </tr>
                <tr className="border-b border-[#F4F4F5]">
                  <td className="p-2.5 font-medium">3. Staff Salaries & Payroll Disbursed</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-[#991B1B]">-{formatCurrency(payrollDisbursed)}</td>
                </tr>
                <tr className="border-b border-[#F4F4F5]">
                  <td className="p-2.5 font-medium">4. Store Plaza Commercial Rent</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-[#991B1B]">-{formatCurrency(rentExpenses)}</td>
                </tr>
                <tr className="border-b border-[#F4F4F5]">
                  <td className="p-2.5 font-medium">5. Electricity & Utilities (LESCO)</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-[#991B1B]">-{formatCurrency(utilityExpenses)}</td>
                </tr>
                <tr className="border-b border-[#F4F4F5]">
                  <td className="p-2.5 font-medium">6. Freight, Supplies & Misc Maintenance</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-[#991B1B]">-{formatCurrency(otherExpenses)}</td>
                </tr>
                <tr className="bg-[#FAFAF8] font-bold">
                  <td className="p-2.5 text-[#18181B]">NET OPERATING PROFIT / SURPLUS</td>
                  <td className="p-2.5 text-right font-mono text-[#065F46] text-sm">
                    {formatCurrency(netOperatingProfit)} ({profitMarginPercent}%)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Customer Debt Overview */}
          <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
            <div className="bg-[#F4F4F5] px-3 py-2 font-bold text-[#18181B] border-b border-[#E4E4E7]">
              Customer Receivables (Khata) Ageing Top Accounts
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E4E7] text-[#71717A] text-[11px]">
                  <th className="p-2">Customer Name</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Market / Area</th>
                  <th className="p-2 text-right">Outstanding Debt</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-[#F4F4F5]">
                    <td className="p-2 font-medium text-[#18181B]">{c.name}</td>
                    <td className="p-2 text-[#71717A]">{c.phone || 'N/A'}</td>
                    <td className="p-2 text-[#71717A]">{c.address || 'Local'}</td>
                    <td className="p-2 text-right font-mono font-bold text-[#DC2626]">
                      {formatCurrency(c.current_balance || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-8 text-[11px] text-[#71717A]">
            <div className="border-t border-[#D4D4D8] pt-1.5 text-center">
              <span className="font-semibold text-[#18181B]">Prepared by:</span> Chief Accountant
            </div>
            <div className="border-t border-[#D4D4D8] pt-1.5 text-center">
              <span className="font-semibold text-[#18181B]">Verified & Approved by:</span> Managing Partner / Owner
            </div>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
};

