import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Plus } from 'lucide-react';
import { formatDate } from '../../../lib/formatters';
import type { Tenant } from '../../../types/auth.types';

const INITIAL_TENANTS: Tenant[] = [
  { id: 1, name: 'Punjab Electric Store', slug: 'punjab-electric-store', city: 'Lahore', currency: 'PKR', timezone: 'Asia/Karachi', status: 'active', created_at: '2026-08-01' },
  { id: 2, name: 'Karachi Appliances Mall', slug: 'karachi-appliances-mall', city: 'Karachi', currency: 'PKR', timezone: 'Asia/Karachi', status: 'active', created_at: '2026-08-15' },
];

export const TenantsPage: React.FC = () => {
  const [tenants] = useState<Tenant[]>(INITIAL_TENANTS);

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Tenant Name',
      render: (t) => (
        <div>
          <div className="font-semibold text-[#18181B]">{t.name}</div>
          <div className="text-xs text-[#71717A] font-mono">{t.slug}</div>
        </div>
      ),
    },
    { key: 'city', header: 'Region' },
    { key: 'currency', header: 'Currency' },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (t) => (
        <Badge variant={t.status === 'active' ? 'mint' : 'destructive'}>
          {t.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Provisioned',
      align: 'right',
      render: (t) => formatDate(t.created_at),
    },
  ];

  return (
    <PageContainer
      title="Store Tenants Management"
      subtitle="Super Admin multi-tenant provisioning, store database isolation, and lifecycle control."
      primaryAction={
        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
          Provision Tenant
        </Button>
      }
    >
      <div className="space-y-4">
        <DataTable columns={columns} data={tenants} keyExtractor={(item) => item.id} />
      </div>
    </PageContainer>
  );
};
