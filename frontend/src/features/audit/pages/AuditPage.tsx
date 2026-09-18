import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { RefreshCw } from 'lucide-react';
import { formatDate } from '../../../lib/formatters';
import { auditService } from '../../../services/audit.service';
import type { AuditLog } from '../../../types/audit.types';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await auditService.getAll({
        module: module || undefined,
        action: action || undefined,
        per_page: 100,
      });
      setLogs(res.data?.data ?? []);
      setTotal(res.data?.meta?.total ?? 0);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moduleOptions = useMemo(() => {
    const all = Array.from(new Set(logs.map((l) => l.module).filter(Boolean))).sort();
    return [{ label: 'All Modules', value: '' }, ...all.map((m) => ({ label: m.replace('_', ' '), value: m }))];
  }, [logs]);

  const actionOptions = useMemo(() => {
    const all = Array.from(new Set(logs.map((l) => l.action).filter(Boolean))).sort();
    return [{ label: 'All Actions', value: '' }, ...all.map((a) => ({ label: a, value: a }))];
  }, [logs]);

  const columns: Column<AuditLog>[] = [
    {
      key: 'user',
      header: 'Actor',
      render: (log) => <span className="font-semibold text-[#18181B]">{log.user || 'System'}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => (
        <Badge
          variant={
            log.action === 'created'
              ? 'mint'
              : log.action === 'updated'
                ? 'warning'
                : log.action === 'deleted'
                  ? 'destructive'
                  : log.action === 'login'
                    ? 'neutral'
                    : 'outline'
          }
        >
          {log.action}
        </Badge>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      render: (log) => <span className="text-xs font-mono text-[#71717A]">{log.module || '—'}</span>,
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (log) =>
        log.entity_type ? (
          <span className="text-xs text-[#52525B]">
            {log.entity_type} #{String(log.entity_id ?? '—')}
          </span>
        ) : (
          <span className="text-xs text-[#A1A1AA]">—</span>
        ),
    },
    {
      key: 'changes',
      header: 'Changes',
      render: (log) => {
        if (log.new_values && Object.keys(log.new_values).length > 0) {
          const summary = Object.entries(log.new_values)
            .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
            .join(', ');
          return (
            <span className="text-xs font-mono text-[#52525B] line-clamp-2" title={JSON.stringify(log.new_values, null, 2)}>
              {summary}
            </span>
          );
        }
        return <span className="text-xs text-[#A1A1AA]">—</span>;
      },
    },
    {
      key: 'ip_address',
      header: 'IP / Device',
      render: (log) => (
        <span className="text-xs font-mono text-[#71717A]">
          {log.ip_address || '—'}
          {log.device ? ` (${log.device})` : ''}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      align: 'right',
      render: (log) => formatDate(log.created_at, true),
    },
  ];

  const applyFilters = () => {
    loadLogs();
  };

  const resetFilters = () => {
    setModule('');
    setAction('');
    setTimeout(loadLogs, 0);
  };

  return (
    <PageContainer
      title="Audit Trail & System Logs"
      subtitle={`Immutable security logs tracking financial mutations, stock changes, and authentication events. ${total ? `${total} events recorded.` : ''}`}
      primaryAction={
        <button
          onClick={() => loadLogs()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-[#E4E4E7] bg-white text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      }
    >
      {errorMsg && (
        <div className="mb-6">
          <Alert variant="error">{errorMsg}</Alert>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="w-44">
          <label className="block text-[11px] font-semibold text-[#71717A] uppercase mb-1.5">Module</label>
          <Select value={module} onChange={(e) => setModule(e.target.value)} options={moduleOptions} />
        </div>
        <div className="w-44">
          <label className="block text-[11px] font-semibold text-[#71717A] uppercase mb-1.5">Action</label>
          <Select value={action} onChange={(e) => setAction(e.target.value)} options={actionOptions} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={applyFilters}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#18181B] text-white hover:bg-[#27272A] transition-colors"
          >
            Apply Filters
          </button>
          {(module || action) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-[#E4E4E7] text-[#52525B] hover:bg-[#F4F4F5] transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        emptyMessage="No audit events match the current filters."
      />
    </PageContainer>
  );
};