import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Card } from '../../../components/ui/Card';
import {
  ShoppingCart,
  Receipt,
  Scan,
  Zap,
  Printer,
} from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';

interface CashierTransaction {
  id: number;
  invoice_number: string;
  customer_name: string;
  amount: number;
  method: string;
  time: string;
}

const TODAY_RECEIPTS: CashierTransaction[] = [
  { id: 1, invoice_number: 'INV-2026-0094', customer_name: 'Al-Madina Construction', amount: 145000, method: 'Cash', time: '11:45 AM' },
  { id: 2, invoice_number: 'INV-2026-0093', customer_name: 'Tariq Electric Works', amount: 38500, method: 'Bank Transfer', time: '11:12 AM' },
  { id: 3, invoice_number: 'INV-2026-0092', customer_name: 'Walk-in Customer', amount: 6200, method: 'Cash', time: '10:30 AM' },
];

export const CashierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [quickBarcode, setQuickBarcode] = useState('');

  const columns: Column<CashierTransaction>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      render: (t) => <span className="font-semibold text-black">{t.invoice_number}</span>,
    },
    { key: 'customer_name', header: 'Customer' },
    {
      key: 'amount',
      header: 'Amount Paid',
      align: 'right',
      render: (t) => <span className="font-bold text-[#065F46]">{formatCurrency(t.amount)}</span>,
    },
    {
      key: 'method',
      header: 'Payment Method',
      align: 'center',
      render: (t) => <Badge variant="neutral">{t.method}</Badge>,
    },
    { key: 'time', header: 'Time', align: 'right' },
    {
      key: 'actions',
      header: 'Receipt',
      align: 'right',
      render: () => (
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Cashier POS Hub"
      subtitle="Counter register, high-velocity barcode scanning, and invoice printing."
      primaryAction={
        <Button
          variant="primary"
          size="lg"
          leftIcon={<ShoppingCart className="w-5 h-5" />}
          onClick={() => navigate('/pos')}
          className="bg-black text-white hover:bg-neutral-800 text-sm font-bold shadow-lg"
        >
          New Sale / POS Counter
        </Button>
      }
    >
      {/* 3 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Today's Register Total"
          value={formatCurrency(68450)}
          change={{ value: '14 Invoices issued', trend: 'up' }}
          icon={<Receipt className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Cash Collected"
          value={formatCurrency(45000)}
          change={{ value: 'In drawer', trend: 'neutral' }}
          icon={<Zap className="w-5 h-5 text-black" />}
        />
        <StatCard
          title="Online / Raast"
          value={formatCurrency(23450)}
          change={{ value: 'Bank settled', trend: 'up' }}
          icon={<ShoppingCart className="w-5 h-5" />}
        />
      </div>

      {/* Barcode Quick Search Bar */}
      <Card className="p-4 mb-6 bg-white">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <SearchInput
              value={quickBarcode}
              onChange={setQuickBarcode}
              placeholder="Scan barcode or enter SKU code (e.g. 8901234567890)..."
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Scan className="w-4 h-4" />}
            onClick={() => navigate('/pos')}
            className="shrink-0 w-full sm:w-auto"
          >
            Open POS Scanner
          </Button>
        </div>
      </Card>

      {/* Today's Transactions Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#18181B] font-display">Today's Counter Invoices</h3>
        <DataTable columns={columns} data={TODAY_RECEIPTS} keyExtractor={(item) => item.id} />
      </div>
    </PageContainer>
  );
};
