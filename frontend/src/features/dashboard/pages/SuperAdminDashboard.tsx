import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Building2, Sliders, Plus, CheckCircle2 } from 'lucide-react';
import type { Tenant } from '../../../types/auth.types';

const INITIAL_TENANTS: Tenant[] = [
  { id: 1, name: 'Punjab Electric Store', slug: 'punjab-electric-store', city: 'Lahore', currency: 'PKR', timezone: 'Asia/Karachi', status: 'active', created_at: '2026-08-01' },
  { id: 2, name: 'Karachi Appliances Mall', slug: 'karachi-appliances-mall', city: 'Karachi', currency: 'PKR', timezone: 'Asia/Karachi', status: 'active', created_at: '2026-08-15' },
  { id: 3, name: 'Islamabad Power & Light', slug: 'isb-power-light', city: 'Islamabad', currency: 'PKR', timezone: 'Asia/Karachi', status: 'suspended', created_at: '2026-08-20' },
];

export const SuperAdminDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [city, setCity] = useState('');

  const handleProvision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    const newTenant: Tenant = {
      id: tenants.length + 1,
      name,
      slug,
      city: city || 'Lahore',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      status: 'active',
      created_at: new Date().toISOString().split('T')[0],
    };

    setTenants([newTenant, ...tenants]);
    setIsProvisionOpen(false);
    setName('');
    setSlug('');
    setCity('');
  };

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Store Tenant',
      render: (t) => (
        <div>
          <div className="font-semibold text-[#18181B]">{t.name}</div>
          <div className="text-xs text-[#71717A] font-mono">{t.slug}</div>
        </div>
      ),
    },
    { key: 'city', header: 'City' },
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
    { key: 'created_at', header: 'Provisioned On', align: 'right' },
  ];

  return (
    <PageContainer
      title="Platform Super Admin"
      subtitle="Multi-tenant telemetry, global appliance specifications, and store provisioning."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsProvisionOpen(true)}
        >
          Provision Tenant
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Tenants"
          value={tenants.length}
          change={{ value: '+2 this month', trend: 'up' }}
          icon={<Building2 className="w-5 h-5" />}
        />
        <StatCard
          title="Active Stores"
          value={tenants.filter((t) => t.status === 'active').length}
          change={{ value: '100% operational', trend: 'up' }}
          icon={<CheckCircle2 className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Global Dynamic Specs"
          value="18"
          change={{ value: 'Appliance catalog attributes', trend: 'neutral' }}
          icon={<Sliders className="w-5 h-5" />}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#18181B] font-display">Provisioned Store Tenants</h3>
        <DataTable columns={columns} data={tenants} keyExtractor={(item) => item.id} />
      </div>

      <Dialog
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        title="Provision New Store Tenant"
        description="Creates an isolated PostgreSQL/SQLite tenant database and initial admin credentials."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsProvisionOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleProvision}>
              Provision Store
            </Button>
          </>
        }
      >
        <form onSubmit={handleProvision} className="space-y-4">
          <FormField label="Store Name" required>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
              }}
              placeholder="e.g. Faisalabad Electric Mall"
              autoFocus
            />
          </FormField>
          <FormField label="Tenant Slug (Unique ID)" required>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. fsd-electric-mall"
            />
          </FormField>
          <FormField label="City / Region">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Faisalabad" />
          </FormField>
        </form>
      </Dialog>
    </PageContainer>
  );
};
