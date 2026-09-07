import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import {
  Building2,
  Plus,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Trash2,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '../../../lib/formatters';
import { tenantService } from '../../../services/tenant.service';
import type { Tenant } from '../../../types/auth.types';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Quick Provision Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [city, setCity] = useState('Lahore');
  const [currency, setCurrency] = useState('PKR');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const tenantsRes = await tenantService.getAll();
      if (tenantsRes.data) setTenants(tenantsRes.data);
    } catch (err) {
      console.error('Failed to load super admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleOpenProvision = () => {
    setName('');
    setSlug('');
    setCity('Lahore');
    setCurrency('PKR');
    setStatus('active');
    setFormError(null);
    setIsProvisionOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(autoSlug);
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setFormError('Store Name and Tenant Slug are required.');
      return;
    }

    try {
      const res = await tenantService.create({
        name: name.trim(),
        slug: slug.trim(),
        city: city || 'Lahore',
        currency: currency || 'PKR',
        timezone: 'Asia/Karachi',
        status: status || 'active',
      });

      if (res.data) {
        setTenants((prev) => [res.data!, ...prev.filter((t) => t.id !== res.data!.id)]);
        setFeedback(`Store tenant "${name.trim()}" provisioned successfully with isolated database schema!`);
        setTimeout(() => setFeedback(null), 6000);
      }
      setIsProvisionOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to provision tenant');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await tenantService.toggleStatus(id);
      if (res.data) {
        setTenants((prev) => prev.map((t) => (t.id === id ? res.data! : t)));
        setFeedback(`Tenant status updated to ${res.data.status.toUpperCase()}!`);
        setTimeout(() => setFeedback(null), 5000);
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDeleteTenant = async (id: number, tenantName: string) => {
    if (!confirm(`Are you sure you want to de-provision and remove "${tenantName}"? This action cannot be undone.`)) {
      return;
    }
    await tenantService.delete(id);
    setTenants((prev) => prev.filter((t) => t.id !== id));
    setFeedback(`Store tenant "${tenantName}" de-provisioned.`);
    setTimeout(() => setFeedback(null), 5000);
  };

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    if (!search) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.city && t.city.toLowerCase().includes(q))
    );
  }, [tenants, search]);

  const tenantColumns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Store Tenant',
      render: (t) => (
        <div>
          <div className="font-semibold text-[#18181B]">{t.name}</div>
          <div className="text-xs text-[#71717A] font-mono flex items-center gap-1.5 mt-0.5">
            <span>{t.slug}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#F4F4F5] rounded text-[#52525B]">
              https://{t.slug}.dukanos.pk
            </span>
          </div>
        </div>
      ),
    },
    { key: 'city', header: 'City / Region', render: (t) => t.city || 'Lahore' },
    { key: 'currency', header: 'Currency', render: (t) => t.currency || 'PKR' },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (t) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(t.id)}
          title="Click to toggle Active / Suspended status"
          className="cursor-pointer transition-opacity hover:opacity-80"
        >
          <Badge variant={t.status === 'active' ? 'mint' : 'destructive'}>
            {t.status.toUpperCase()}
          </Badge>
        </button>
      ),
    },
    {
      key: 'created_at',
      header: 'Provisioned On',
      align: 'right',
      render: (t) => formatDate(t.created_at || '2026-09-01'),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`https://${t.slug}.dukanos.pk`, '_blank')}
            title="Visit Store Tenant Portal"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#52525B]" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTenant(t.id, t.name)}
            title="De-provision Store Tenant"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
          </Button>
        </div>
      ),
    },
  ];

  

  

  

  

  return (
    <PageContainer
      title="Platform Super Admin"
      subtitle="Centralized store tenant provisioning, schema isolation, and directory management."
      primaryAction={
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Sparkles className="w-4 h-4" />}
            onClick={handleOpenProvision}
          >
            Quick Provision
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/super-admin/tenants/create')}
          >
            Provision Store Tenant
          </Button>
        </div>
      }
    >
      {/* Success Notification */}
      {feedback && (
        <div className="mb-6">
          <Alert variant="success">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {feedback}
              </span>
              <button
                onClick={() => setFeedback(null)}
                className="text-xs underline hover:text-emerald-900"
              >
                Dismiss
              </button>
            </div>
          </Alert>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Total Store Tenants"
          value={tenants.length}
          change={{ value: '+2 new stores this month', trend: 'up' }}
          icon={<Building2 className="w-5 h-5 text-[#18181B]" />}
        />
        <StatCard
          title="Active Stores"
          value={tenants.filter((t) => t.status === 'active').length}
          change={{ value: '100% operational', trend: 'up' }}
          icon={<CheckCircle2 className="w-5 h-5 text-[#065F46]" />}
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          onClick={() => navigate('/super-admin/tenants')}
          className="p-4 bg-white border border-[#E4E4E7] rounded-xl hover:border-[#18181B] transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#F4F4F5] rounded-lg group-hover:bg-[#18181B] group-hover:text-white transition-colors">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#18181B]">Store Tenants Directory</h4>
                <p className="text-xs text-[#71717A]">Manage schema isolation & custom domains</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#18181B] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        <div
          onClick={() => navigate('/super-admin/tenants/create')}
          className="p-4 bg-white border border-[#E4E4E7] rounded-xl hover:border-[#18181B] transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#F4F4F5] rounded-lg group-hover:bg-[#18181B] group-hover:text-white transition-colors">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#18181B]">Provisioning Wizard</h4>
                <p className="text-xs text-[#71717A]">Launch new store with admin credentials</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#18181B] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* Store Tenant Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
          <div className="flex items-center gap-2 shrink-0">
            <Building2 className="w-3.5 h-3.5 text-[#18181B]" />
            <h3 className="text-sm font-semibold text-[#18181B]">Store Tenants Directory ({tenants.length})</h3>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>

        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search store tenants by name, slug, or city..."
        />
        <DataTable columns={tenantColumns} data={filteredTenants} keyExtractor={(item) => item.id} />
      </div>

      {/* ========================================================= */}
      {/* QUICK PROVISION TENANT MODAL                              */}
      {/* ========================================================= */}
      <Dialog
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        title="Quick Provision Store Tenant"
        description="Quickly spin up an isolated store tenant database and initial portal configuration."
        maxWidth="md"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsProvisionOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleProvision} leftIcon={<Sparkles className="w-4 h-4" />}>
              Provision Store
            </Button>
          </div>
        }
      >
        <form onSubmit={handleProvision} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              {formError}
            </Alert>
          )}

          <FormField label="Store Name" required>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Faisalabad Electric Mall"
              autoFocus
            />
          </FormField>

          <FormField label="Tenant Subdomain Slug" required>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. fsd-electric-mall"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="City / Region" required>
              <Select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                options={[
                  { label: 'Lahore', value: 'Lahore' },
                  { label: 'Karachi', value: 'Karachi' },
                  { label: 'Islamabad / Rawalpindi', value: 'Islamabad' },
                  { label: 'Faisalabad', value: 'Faisalabad' },
                  { label: 'Multan', value: 'Multan' },
                  { label: 'Gujranwala', value: 'Gujranwala' },
                  { label: 'Peshawar', value: 'Peshawar' },
                ]}
              />
            </FormField>

            <FormField label="Initial Operational Status" required>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Suspended', value: 'suspended' },
                ]}
              />
            </FormField>
          </div>

          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] text-xs text-[#52525B]">
            <span className="font-semibold text-[#18181B]">Portal Subdomain:</span>{' '}
            <code className="font-mono text-[#047857]">https://{slug || 'your-store'}.dukanos.pk</code>
          </div>
        </form>
      </Dialog>
    </PageContainer>
  );
};

