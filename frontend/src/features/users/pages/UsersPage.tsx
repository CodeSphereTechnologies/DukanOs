import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { UserPlus } from 'lucide-react';
import { formatDate } from '../../../lib/formatters';
import type { StoreUser } from '../../../types/user.types';

const INITIAL_USERS: StoreUser[] = [
  { id: 1, name: 'Muhammad Akram Ch.', email: 'owner@punjabelectric.pk', phone: '+92 300 4125678', status: 'active', role: { id: 2, name: 'Owner', slug: 'owner' }, created_at: '2026-08-01' },
  { id: 2, name: 'Tariq Mehmood', email: 'manager@punjabelectric.pk', phone: '+92 301 5551234', status: 'active', role: { id: 3, name: 'Manager', slug: 'manager' }, created_at: '2026-08-05' },
  { id: 3, name: 'Kashif Ali', email: 'cashier@punjabelectric.pk', phone: '+92 302 7778899', status: 'active', role: { id: 4, name: 'Cashier', slug: 'cashier' }, created_at: '2026-08-10' },
  { id: 4, name: 'Zahid Hussain', email: 'accountant@punjabelectric.pk', phone: '+92 303 9991122', status: 'active', role: { id: 5, name: 'Accountant', slug: 'accountant' }, created_at: '2026-08-12' },
];

export const UsersPage: React.FC = () => {
  const [users] = useState<StoreUser[]>(INITIAL_USERS);

  const columns: Column<StoreUser>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (u) => (
        <div>
          <div className="font-semibold text-[#18181B]">{u.name}</div>
          <div className="text-xs text-[#71717A]">{u.email}</div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone' },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (u) => (
        <Badge
          variant={
            u.role.slug === 'owner'
              ? 'mint'
              : u.role.slug === 'manager'
              ? 'default'
              : u.role.slug === 'accountant'
              ? 'warning'
              : 'neutral'
          }
        >
          {u.role.name}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (u) => <Badge variant={u.status === 'active' ? 'mint' : 'neutral'}>{u.status}</Badge>,
    },
    {
      key: 'created_at',
      header: 'Created',
      align: 'right',
      render: (u) => formatDate(u.created_at),
    },
  ];

  return (
    <PageContainer
      title="Store Staff & Roles"
      subtitle="Manage access permissions, team accounts, and role-based operational scopes."
      primaryAction={
        <Button variant="primary" size="md" leftIcon={<UserPlus className="w-4 h-4" />}>
          Invite Staff Member
        </Button>
      }
    >
      <div className="space-y-4">
        <DataTable columns={columns} data={users} keyExtractor={(item) => item.id} />
      </div>
    </PageContainer>
  );
};
