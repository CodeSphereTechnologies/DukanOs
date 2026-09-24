import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

import { ShoppingCart, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { invoiceService } from '../../../services/invoice.service';
import type { Invoice } from '../../../types/invoice.types';
import { useAuth } from '../../auth/hooks/useAuth';

const STATUS_VARIANT: Record<Invoice['payment_status'], 'mint' | 'warning' | 'destructive'> = {
  paid: 'mint',
  partial: 'warning',
  unpaid: 'destructive',
  ledger: 'destructive',
};

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await invoiceService.getAll();
      if (!active) return;
      if (res.data) setInvoices(res.data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(search.toLowerCase()))
  );

  const openDetail = (inv: Invoice) => {
    navigate(`/invoices/${inv.id}`);
  };

  const itemCount = (inv: Invoice) => inv.items?.length || 0;
  const hasItems = (inv: Invoice) => itemCount(inv) > 0;

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
      key: 'items',
      header: 'Items',
      align: 'center',
      render: (inv) => (
        <span className={hasItems(inv) ? 'text-[#52525B] font-medium' : 'text-[#A1A1AA]'}>
          {hasItems(inv) ? `${itemCount(inv)} line${itemCount(inv) === 1 ? '' : 's'}` : '—'}
        </span>
      ),
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
        <Badge variant={STATUS_VARIANT[inv.payment_status] || 'destructive'}>
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
      header: 'Actions',
      align: 'right',
      render: (inv) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="View invoice"
          onClick={(e) => {
            e.stopPropagation();
            openDetail(inv);
          }}
        >
          <Eye className="w-4 h-4 text-[#52525B]" />
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Sales Invoices"
      subtitle="Complete financial invoice history, payment statuses, and customer ledger balances."
      primaryAction={
        hasRole('accountant') ? (
          undefined
        ) : (
          <Button
            variant="primary"
            size="md"
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            onClick={() => navigate('/pos')}
          >
            Create POS Invoice
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by invoice number or customer name..."
        />

        <div className="flex items-center gap-2 text-xs text-[#71717A] px-1">
          <span>
            Showing <strong className="text-black">{filtered.length}</strong> invoices
            {invoices.length !== filtered.length && (
              <>
                {' '}
                of <strong className="text-black">{invoices.length}</strong>
              </>
            )}
          </span>
          <span className="mx-1 text-[#D4D4D8]">•</span>
          <span>
            Collected:{' '}
            <strong className="text-[#065F46]">
              {formatCurrency(invoices.reduce((s, i) => s + (i.paid_amount || 0), 0))}
            </strong>
          </span>
          <span className="mx-1 text-[#D4D4D8]">•</span>
          <span>
            Outstanding:{' '}
            <strong className="text-[#DC2626]">
              {formatCurrency(invoices.reduce((s, i) => s + (i.balance_amount || 0), 0))}
            </strong>
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          onRowClick={openDetail}
        />
      </div>
    </PageContainer>
  );
};
