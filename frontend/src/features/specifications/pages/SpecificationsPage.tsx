import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Plus } from 'lucide-react';
import type { Specification } from '../../../types/product.types';

const INITIAL_SPECS: Specification[] = [
  { id: 1, name: 'Wattage', slug: 'wattage', data_type: 'number', unit: 'W', is_required: true, is_filterable: true, sort_order: 1, status: 'active' },
  { id: 2, name: 'Voltage Rating', slug: 'voltage', data_type: 'select', unit: 'V', is_required: true, is_filterable: true, sort_order: 2, status: 'active', values: ['220V', '240V', '110V'] },
  { id: 3, name: 'Warranty Period', slug: 'warranty', data_type: 'text', unit: 'Months', is_required: false, is_filterable: true, sort_order: 3, status: 'active' },
];

export const SpecificationsPage: React.FC = () => {
  const [specs] = useState<Specification[]>(INITIAL_SPECS);

  const columns: Column<Specification>[] = [
    {
      key: 'name',
      header: 'Specification Name',
      render: (s) => (
        <div>
          <div className="font-semibold text-[#18181B]">{s.name}</div>
          <div className="text-xs text-[#71717A] font-mono">{s.slug}</div>
        </div>
      ),
    },
    {
      key: 'data_type',
      header: 'Data Type',
      align: 'center',
      render: (s) => <Badge variant="neutral" className="uppercase text-[11px]">{s.data_type}</Badge>,
    },
    { key: 'unit', header: 'Unit' },
    {
      key: 'is_required',
      header: 'Required',
      align: 'center',
      render: (s) => <span className="text-xs">{s.is_required ? 'Yes' : 'Optional'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (s) => <Badge variant={s.status === 'active' ? 'mint' : 'neutral'}>{s.status}</Badge>,
    },
  ];

  return (
    <PageContainer
      title="Dynamic Specifications Engine"
      subtitle="Define platform-wide product specifications (Wattage, Voltage, Dimensions) dynamically."
      primaryAction={
        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
          Create Specification
        </Button>
      }
    >
      <div className="space-y-4">
        <DataTable columns={columns} data={specs} keyExtractor={(item) => item.id} />
      </div>
    </PageContainer>
  );
};
