import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { returnService } from '../../../services/return.service';
import type { SaleReturn } from '../../../types/invoice.types';

export const ReturnsPage: React.FC = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await returnService.getAll();
      if (!active) return;
      if (res.data) setReturns(res.data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = returns.filter(
    (ret) =>
      ret.return_number.toLowerCase().includes(search.toLowerCase()) ||
      (ret.customer?.name && ret.customer.name.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<SaleReturn>[] = [
    {
      key: 'return_number',
      header: 'Return Number',
      render: (ret) => <span className="font-semibold text-black">{ret.return_number}</span>,
    },
    {
      key: 'return_date',
      header: 'Date',
      render: (ret) => formatDate(ret.return_date),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (ret) => <span>{ret.customer?.name || 'Unknown'}</span>,
    },
    {
      key: 'refund_type',
      header: 'Refund Type',
      align: 'center',
      render: (ret) => <span className="capitalize">{ret.refund_type.replace('_', ' ')}</span>,
    },
    {
      key: 'total_amount',
      header: 'Refund Amount',
      align: 'right',
      render: (ret) => <span className="font-bold text-[#DC2626]">{formatCurrency(ret.total_amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (ret) => (
        <Badge variant={ret.status === 'processed' || ret.status === 'completed' ? 'mint' : 'warning'}>
          {ret.status || 'Completed'}
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer
      title="Sale Returns"
      subtitle="View all processed sales returns, refunds, and restocked items."
    >
      <div className="space-y-4">
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by return number or customer name..."
        />
        
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          isLoading={loading}
          onRowClick={(ret) => navigate(`/returns/${ret.id}`)}
        />
      </div>
    </PageContainer>
  );
};
