import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import { Plus, ExternalLink, Globe, Sparkles } from 'lucide-react';
import { formatDate } from '../../../lib/formatters';
import { formatError } from '../../../lib/utils';
import { tenantService } from '../../../services/tenant.service';
import type { Tenant } from '../../../types/auth.types';

export const TenantsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(
    (location.state as { message?: string })?.message || null
  );

  // Quick Modal Form State
  const [quickName, setQuickName] = useState('');
  const [quickSlug, setQuickSlug] = useState('');
  const [quickCity, setQuickCity] = useState('Lahore');
  const [quickCurrency, setQuickCurrency] = useState('PKR');
  const [quickStatus, setQuickStatus] = useState<'active' | 'suspended'>('active');
  const [quickError, setQuickError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadTenants = async () => {
    try {
      const res = await tenantService.getAll();
      setTenants(res.data || []);
    } catch (err) {
      // getAll rethrows real API errors; without this the rejection is unhandled
      // and the page silently shows an empty list.
      setPageError(formatError(err));
      setTenants([]);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleQuickProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickSlug.trim()) {
      setQuickError('Store Name and Slug are required.');
      return;
    }

    try {
      const res = await tenantService.create({
        name: quickName.trim(),
        slug: quickSlug.trim(),
        city: quickCity,
        currency: quickCurrency,
        status: quickStatus,
      });

      // The backend was unreachable; nothing was persisted, so do not claim
      // the store was provisioned.
      if (res.success === false) {
        setQuickError(res.message || 'The backend is unreachable, so the store was not created.');
        return;
      }

      if (res.data) {
        setTenants((prev) => [res.data!, ...prev.filter((t) => t.id !== res.data!.id)]);
      }
      setIsQuickModalOpen(false);
      setSuccessBanner(`Store "${quickName}" provisioned successfully!`);
      setQuickName('');
      setQuickSlug('');
      setQuickCity('Lahore');
      setQuickError(null);
    } catch (err: unknown) {
      // Surfaces field errors such as "slug: This slug is already in use."
      setQuickError(formatError(err));
    }
  };

  const handleToggleStatus = async (id: number) => {
    const current = tenants.find((t) => t.id === id);
    if (!current) return;

    const nextStatus = current.status === 'active' ? 'suspended' : 'active';

    try {
      const res = await tenantService.toggleStatus(id, nextStatus);
      if (res.data) {
        setTenants((prev) => prev.map((t) => (t.id === id ? res.data! : t)));
        setPageError(null);
      }
    } catch (err) {
      setPageError(formatError(err));
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.city && t.city.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Tenant Name',
      render: (t) => (
        <div>
          <div className="font-semibold text-[#18181B]">{t.name}</div>
          <div className="text-xs text-[#71717A] font-mono flex items-center gap-1.5 mt-0.5">
            <span>{t.slug}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#F4F4F5] rounded text-[#52525B]">
              https://{t.slug}.dukanos.pk
            </span>
          </div>
        </div>
      ),
    },
    { key: 'city', header: 'Region', render: (t) => t.city || 'National' },
    { key: 'currency', header: 'Currency' },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (t) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(t.id)}
          title="Click to toggle active / suspended status"
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
      header: 'Provisioned',
      align: 'right',
      render: (t) => (t.created_at ? formatDate(t.created_at) : '—'),
    },
  ];

  return (
    <PageContainer
      title="Store Tenants Management"
      subtitle="Super Admin multi-tenant provisioning, store database isolation, and lifecycle control."
      secondaryActions={
        <Button
          variant="secondary"
          size="md"
          leftIcon={<Sparkles className="w-4 h-4" />}
          onClick={() => setIsQuickModalOpen(true)}
        >
          Quick Modal
        </Button>
      }
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/super-admin/tenants/create')}
        >
          Provision Tenant
        </Button>
      }
    >
      <div className="space-y-4">
        {pageError && (
          <Alert variant="error" title="Something went wrong" onClose={() => setPageError(null)}>
            {pageError}
          </Alert>
        )}

        {successBanner && (
          <Alert variant="success" onClose={() => setSuccessBanner(null)}>
            {successBanner}
          </Alert>
        )}

        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tenants by store name, slug, or city..."
        />

        <DataTable columns={columns} data={filteredTenants} keyExtractor={(item) => item.id} />
      </div>

      {/* Quick Provisioning Modal */}
      <Dialog
        isOpen={isQuickModalOpen}
        onClose={() => {
          setIsQuickModalOpen(false);
          setQuickError(null);
        }}
        title="Quick Provision Store Tenant"
        description="Rapidly initialize a new store tenant with default regional configuration."
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => {
                setIsQuickModalOpen(false);
                navigate('/super-admin/tenants/create');
              }}
            >
              Full Setup Page
            </Button>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsQuickModalOpen(false);
                  setQuickError(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleQuickProvision}>
                Provision Store
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleQuickProvision} className="space-y-4">
          {quickError && (
            <Alert variant="error" title="Required Fields">
              {quickError}
            </Alert>
          )}

          <FormField label="Store Name" required>
            <Input
              value={quickName}
              onChange={(e) => {
                setQuickName(e.target.value);
                setQuickSlug(
                  e.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                );
              }}
              placeholder="e.g. Rawalpindi Appliance Center"
              autoFocus
            />
          </FormField>

          <FormField label="Tenant Slug (Unique Subdomain)" required>
            <Input
              value={quickSlug}
              onChange={(e) =>
                setQuickSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }
              placeholder="e.g. rawalpindi-appliance"
              className="font-mono"
            />
          </FormField>

          <div className="p-2.5 bg-[#FAFAF8] rounded-lg border border-[#E4E4E7] flex items-center gap-2 text-xs text-[#52525B]">
            <Globe className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Store URL:</span>
            <code className="font-mono text-[#065F46] font-medium">
              https://{quickSlug || 'tenant-slug'}.dukanos.pk
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="City / Region">
              <Input
                value={quickCity}
                onChange={(e) => setQuickCity(e.target.value)}
                placeholder="e.g. Rawalpindi"
              />
            </FormField>

            <FormField label="Operating Currency">
              <Select
                value={quickCurrency}
                onChange={(e) => setQuickCurrency(e.target.value)}
                options={[
                  { label: 'PKR (Rs.)', value: 'PKR' },
                  { label: 'USD ($)', value: 'USD' },
                  { label: 'AED (AED)', value: 'AED' },
                  { label: 'SAR (SAR)', value: 'SAR' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Status">
            <Select
              value={quickStatus}
              onChange={(e) => setQuickStatus(e.target.value as 'active' | 'suspended')}
              options={[
                { label: 'Active - Ready for operations', value: 'active' },
                { label: 'Suspended - Provisioned under maintenance', value: 'suspended' },
              ]}
            />
          </FormField>
        </form>
      </Dialog>
    </PageContainer>
  );
};
