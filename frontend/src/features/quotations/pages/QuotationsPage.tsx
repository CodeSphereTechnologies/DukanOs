import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Plus, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import type { Quotation } from '../../../types/invoice.types';

const INITIAL_QUOTATIONS: Quotation[] = [
  { id: 1, quotation_number: 'QTN-2026-0042', customer: { id: 1, name: 'Chaudhry Bilal (Contractor)', status: 'active', current_balance: 0 }, quotation_date: '2026-09-02', valid_until: '2026-09-15', status: 'sent', subtotal: 185000, discount_amount: 5000, total_amount: 180000, items: [], created_at: '2026-09-02T05:00:00Z' },
  { id: 2, quotation_number: 'QTN-2026-0041', customer: { id: 2, name: 'Al-Madina Construction', status: 'active', current_balance: 0 }, quotation_date: '2026-09-01', valid_until: '2026-09-10', status: 'draft', subtotal: 64000, discount_amount: 0, total_amount: 64000, items: [], created_at: '2026-09-01T14:30:00Z' },
];

export const QuotationsPage: React.FC = () => {
  const [quotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [search, setSearch] = useState('');

  const filtered = quotations.filter(
    (q) =>
      q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      (q.customer?.name && q.customer.name.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Quotation>[] = [
    {
      key: 'quotation_number',
      header: 'Quotation #',
      render: (q) => <span className="font-semibold text-black">{q.quotation_number}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (q) => <span>{q.customer?.name || 'Walk-in'}</span>,
    },
    {
      key: 'total_amount',
      header: 'Estimated Total',
      align: 'right',
      render: (q) => <span className="font-bold text-black">{formatCurrency(q.total_amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (q) => (
        <Badge
          variant={
            q.status === 'accepted'
              ? 'mint'
              : q.status === 'sent'
              ? 'default'
              : q.status === 'draft'
              ? 'neutral'
              : 'warning'
          }
        >
          {q.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'valid_until',
      header: 'Valid Until',
      align: 'right',
      render: (q) => formatDate(q.valid_until),
    },
    {
      key: 'actions',
      header: 'Convert to Invoice',
      align: 'right',
      render: (q) => (
        <Button
          variant="secondary"
          size="sm"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={() => alert(`Converting ${q.quotation_number} to Invoice...`)}
        >
          Convert
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Estimates & Quotations"
      subtitle="Non-financial draft estimates. Converting automatically generates invoices and deducts stock."
      primaryAction={
        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
          Create Quotation
        </Button>
      }
    >
      <div className="space-y-4">
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search quotations..."
        />
        <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
      </div>
    </PageContainer>
  );
};
