import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ShoppingCart, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import type { Invoice } from '../../../types/invoice.types';

const INITIAL_INVOICES: Invoice[] = [
  { id: 1, invoice_number: 'INV-2026-0094', customer_id: 1, customer: { id: 1, name: 'Al-Madina Construction', status: 'active', current_balance: 0 }, invoice_date: '2026-09-02', status: 'issued', payment_status: 'paid', subtotal: 145000, discount_amount: 0, total_amount: 145000, paid_amount: 145000, balance_amount: 0, payment_method: 'cash', items: [], created_at: '2026-09-02T06:45:00Z' },
  { id: 2, invoice_number: 'INV-2026-0093', customer_id: 2, customer: { id: 2, name: 'Tariq Electric Works', status: 'active', current_balance: 18500 }, invoice_date: '2026-09-02', status: 'issued', payment_status: 'partial', subtotal: 38500, discount_amount: 0, total_amount: 38500, paid_amount: 20000, balance_amount: 18500, payment_method: 'bank_transfer', items: [], created_at: '2026-09-02T06:12:00Z' },
  { id: 3, invoice_number: 'INV-2026-0092', customer_id: undefined, customer: { id: 0, name: 'Walk-in Customer', status: 'active', current_balance: 0 }, invoice_date: '2026-09-02', status: 'issued', payment_status: 'paid', subtotal: 6200, discount_amount: 0, total_amount: 6200, paid_amount: 6200, balance_amount: 0, payment_method: 'cash', items: [], created_at: '2026-09-02T05:30:00Z' },
];

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [invoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [search, setSearch] = useState('');

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice Number',
      render: (inv) => <span className="font-semibold text-black">{inv.invoice_number}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (inv) => <span>{inv.customer?.name || 'Walk-in Customer'}</span>,
    },
    {
      key: 'total_amount',
      header: 'Total Bill',
      align: 'right',
      render: (inv) => <span className="font-bold text-black">{formatCurrency(inv.total_amount)}</span>,
    },
    {
      key: 'paid_amount',
      header: 'Paid Amount',
      align: 'right',
      render: (inv) => <span className="text-[#065F46] font-medium">{formatCurrency(inv.paid_amount)}</span>,
    },
    {
      key: 'balance_amount',
      header: 'Remaining Balance',
      align: 'right',
      render: (inv) => (
        <span className={inv.balance_amount > 0 ? 'text-[#DC2626] font-bold' : 'text-[#71717A]'}>
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
    {
      key: 'actions',
      header: 'Print',
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
      title="Sales Invoices"
      subtitle="Complete financial invoice history, payment statuses, and customer ledger balances."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<ShoppingCart className="w-4 h-4" />}
          onClick={() => navigate('/pos')}
        >
          Create POS Invoice
        </Button>
      }
    >
      <div className="space-y-4">
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by invoice number or customer name..."
        />
        <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
      </div>
    </PageContainer>
  );
};
