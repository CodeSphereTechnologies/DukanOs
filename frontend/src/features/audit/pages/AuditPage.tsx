import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { formatDate } from '../../../lib/formatters';
import type { AuditLog } from '../../../types/audit.types';

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 1, user_name: 'Muhammad Akram Ch.', module: 'invoices', action: 'created', entity_type: 'Invoice', entity_id: 101, ip_address: '192.168.1.10', device: 'Desktop Chrome', created_at: '2026-09-02T06:45:00Z' },
  { id: 2, user_name: 'Tariq Mehmood', module: 'inventory', action: 'adjusted', entity_type: 'Product', entity_id: 1, ip_address: '192.168.1.15', device: 'Mobile Safari', created_at: '2026-09-02T06:15:00Z' },
];

export const AuditPage: React.FC = () => {
  const [logs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const columns: Column<AuditLog>[] = [
    {
      key: 'user_name',
      header: 'Actor',
      render: (log) => <span className="font-semibold text-black">{log.user_name || 'System'}</span>,
    },
    {
      key: 'action',
      header: 'Action / Module',
      render: (log) => (
        <div>
          <span className="font-medium text-[#18181B]">{log.action.toUpperCase()}</span> in{' '}
          <span className="text-xs font-mono text-[#71717A]">{log.module}</span>
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (log) => (
        <span className="text-xs text-[#52525B]">
          {log.entity_type} #{log.entity_id}
        </span>
      ),
    },
    { key: 'ip_address', header: 'IP Address / Device', render: (log) => <span className="text-xs font-mono text-[#71717A]">{log.ip_address} ({log.device})</span> },
    {
      key: 'created_at',
      header: 'Timestamp',
      align: 'right',
      render: (log) => formatDate(log.created_at, true),
    },
  ];

  return (
    <PageContainer
      title="Audit Trail & System Logs"
      subtitle="Immutable security logs tracking all financial mutations, stock changes, and authentication events."
    >
      <div className="space-y-4">
        <DataTable columns={columns} data={logs} keyExtractor={(item) => item.id} />
      </div>
    </PageContainer>
  );
};
