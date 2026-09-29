import React, { useState, useEffect, useMemo } from 'react';
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
import { StatCard } from '../../../components/common/StatCard';
import {
  UserPlus,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Users,
  KeyRound,
  Trash2,
  Lock,
  UserCheck,
} from 'lucide-react';
import { formatDate } from '../../../lib/formatters';
import { formatError } from '../../../lib/utils';
import { userService, ROLES_CONFIG } from '../../../services/user.service';
import { tenantService } from '../../../services/tenant.service';
import { useAuth } from '../../auth/hooks/useAuth';
import type { StoreUser } from '../../../types/user.types';
import type { RoleSlug, Tenant } from '../../../types/auth.types';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role.slug === 'super_admin';

  const [users, setUsers] = useState<StoreUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  // Set when an account was created but its invitation email never went out.
  const [deliveryAlert, setDeliveryAlert] = useState<{
    name: string;
    email: string;
    password?: string;
  } | null>(null);

  // Invite Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleSlug, setRoleSlug] = useState<RoleSlug>('cashier');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [tempPassword, setTempPassword] = useState('');
  const [tenantId, setTenantId] = useState<number | ''>('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAll();
      if (res.data) setUsers(res.data);
    } catch (err) {
      console.error('Failed to load store users', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Super admins have no store of their own, so they must pick one.
  useEffect(() => {
    if (!isSuperAdmin) return;
    tenantService
      .getAll()
      .then((res) => {
        const list = res.data || [];
        setTenants(list);
        setTenantId((prev) => (prev === '' && list.length > 0 ? list[0].id : prev));
      })
      .catch(() => setTenants([]));
  }, [isSuperAdmin]);

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRoleSlug('cashier');
    setStatus('active');
    setTempPassword(`Pass@${Math.floor(1000 + Math.random() * 9000)}`);
    setFormError(null);
  };

  const handleOpenInvite = () => {
    handleResetForm();
    setIsInviteOpen(true);
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Staff Member Full Name is required.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('A valid store email address is required.');
      return;
    }

    if (isSuperAdmin && !tenantId) {
      setFormError('Select the store this staff member belongs to.');
      return;
    }

    try {
      const res = await userService.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        role_slug: roleSlug,
        status,
        ...(tempPassword ? { password: tempPassword } : {}),
        ...(isSuperAdmin ? { tenant_id: Number(tenantId) } : {}),
      });

      if (res.data) {
        setUsers((prev) => [res.data!, ...prev.filter((u) => u.id !== res.data!.id)]);

        if (res.data.invitation_sent === false) {
          // The account is live, but nobody was told the password. Surface the
          // credentials instead of claiming they were emailed.
          setDeliveryAlert({
            name: res.data.name,
            email: res.data.email,
            password: res.data.temporary_password,
          });
          setSuccessBanner(null);
        } else {
          setDeliveryAlert(null);
          setSuccessBanner(
            `Staff member "${name.trim()}" created as ${ROLES_CONFIG[roleSlug]?.name || roleSlug}. Sign-in credentials were emailed to ${email.trim().toLowerCase()}.`
          );
        }
      }
      setIsInviteOpen(false);
      handleResetForm();
    } catch (err: unknown) {
      // Surface the offending field. The bare ApiError message is the generic
      // "The given data was invalid.", which hides the actual cause.
      setFormError(formatError(err));
    }
  };

  const handleToggleStatus = async (user: StoreUser) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await userService.toggleStatus(user.id, nextStatus);
      if (res.data) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data! : u)));
        setSuccessBanner(
          `Status for ${user.name} updated to ${res.data.status.toUpperCase()}.`
        );
      }
    } catch (err) {
      setFormError(formatError(err));
    }
  };

  const handleDeleteUser = async (user: StoreUser) => {
    if (confirm(`Are you sure you want to remove staff member "${user.name}"?`)) {
      try {
        await userService.delete(user.id);
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setSuccessBanner(`Account for ${user.name} was removed.`);
      } catch (err) {
        setFormError(formatError(err));
      }
    }
  };

  // Filter users by search
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        u.role.name.toLowerCase().includes(q) ||
        u.role.slug.toLowerCase().includes(q)
    );
  }, [users, search]);

  // Statistics
  const totalStaff = users.length;
  const activeStaff = users.filter((u) => u.status === 'active').length;
  const cashiersCount = users.filter((u) => u.role.slug === 'cashier').length;
  const managersCount = users.filter((u) => u.role.slug === 'manager' || u.role.slug === 'accountant').length;

  const columns: Column<StoreUser>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center font-bold text-xs shrink-0 font-display">
            {u.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[#18181B] truncate">{u.name}</div>
            <div className="text-xs text-[#71717A] truncate flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#A1A1AA]" />
              <span>{u.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact Phone',
      render: (u) => (
        <span className="font-mono text-xs text-[#52525B]">
          {u.phone || '—'}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (u) => (
        <div className="space-y-0.5">
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
          <div className="text-[10px] text-[#71717A] max-w-[180px] truncate hidden sm:block">
            {ROLES_CONFIG[u.role.slug]?.description || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Access Status',
      align: 'center',
      render: (u) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(u)}
          className="cursor-pointer transition-opacity hover:opacity-80"
          title={`Click to switch to ${u.status === 'active' ? 'Inactive' : 'Active'}`}
        >
          <Badge variant={u.status === 'active' ? 'mint' : 'destructive'}>
            {u.status === 'active' ? 'Active' : 'Suspended'}
          </Badge>
        </button>
      ),
    },
    ...(isSuperAdmin
      ? ([
          {
            key: 'tenant',
            header: 'Store',
            render: (u: StoreUser) => (
              <span className="text-xs text-[#52525B]">
                {u.tenant?.name || '—'}
              </span>
            ),
          },
        ] as Column<StoreUser>[])
      : []),
    {
      key: 'created_at',
      header: 'Joined Date',
      align: 'right',
      render: (u) => <span className="text-xs text-[#71717A]">{formatDate(u.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(u)}
            className="text-xs h-7 px-2"
          >
            {u.status === 'active' ? 'Suspend' : 'Activate'}
          </Button>
          {u.role.slug !== 'owner' && (
            <button
              type="button"
              onClick={() => handleDeleteUser(u)}
              className="p-1.5 text-[#A1A1AA] hover:text-[#DC2626] rounded-md hover:bg-[#FEE2E2] transition-colors"
              title="Remove staff member"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Store Staff & Roles"
      subtitle="Manage employee access permissions, cashier counters, role assignments, and login credentials."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={handleOpenInvite}
        >
          Invite Staff Member
        </Button>
      }
    >
      {/* Failed Invitation Delivery — the credentials never left the server */}
      {deliveryAlert && (
        <div className="mb-6">
          <Alert variant="destructive" title="Invitation email was not sent">
            <div className="space-y-3">
              <p className="text-sm">
                <strong>{deliveryAlert.name}</strong> was created as{' '}
                <strong>{deliveryAlert.email}</strong>, but the credentials email
                failed to send. The account can sign in as soon as it has a
                password — send these manually now, and check the mail settings
                before inviting anyone else.
              </p>
              {deliveryAlert.password ? (
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white/60 px-3 py-2 font-mono text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#71717A]">
                    Password
                  </span>
                  <span className="select-all break-all font-semibold">
                    {deliveryAlert.password}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard?.writeText(deliveryAlert.password || '')
                    }
                    className="text-xs underline hover:text-red-900"
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <p className="text-sm">
                  No password was recorded. Edit the account and set a new one
                  to complete onboarding.
                </p>
              )}
              <button
                type="button"
                onClick={() => setDeliveryAlert(null)}
                className="text-xs underline hover:text-red-900"
              >
                Dismiss
              </button>
            </div>
          </Alert>
        </div>
      )}

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="mb-6">
          <Alert variant="success">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {successBanner}
              </span>
              <button
                type="button"
                onClick={() => setSuccessBanner(null)}
                className="text-xs underline hover:text-emerald-900 cursor-pointer ml-3 shrink-0"
              >
                Dismiss
              </button>
            </div>
          </Alert>
        </div>
      )}

      {/* Staff Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Store Team"
          value={totalStaff}
          change={{ value: `${activeStaff} Active logins`, trend: 'up' }}
          icon={<Users className="w-5 h-5 text-[#18181B]" />}
        />
        <StatCard
          title="Active Cashiers"
          value={cashiersCount}
          change={{ value: 'Assigned to POS registers', trend: 'neutral' }}
          icon={<UserCheck className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Managers & Accountants"
          value={managersCount}
          change={{ value: 'Operational & books access', trend: 'up' }}
          icon={<ShieldCheck className="w-5 h-5 text-[#0284C7]" />}
        />
        <StatCard
          title="Access Health"
          value={`${Math.round((activeStaff / Math.max(1, totalStaff)) * 100)}%`}
          change={{ value: 'Active credential validity', trend: 'up' }}
          icon={<KeyRound className="w-5 h-5 text-[#D97706]" />}
        />
      </div>

      <div className="space-y-4">
        {/* Search Toolbar */}
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search staff by full name, email, role, or phone..."
        />

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No staff members match the selected search query."
        />
      </div>

      {/* ========================================================= */}
      {/* INVITE STAFF MEMBER MODAL                                 */}
      {/* ========================================================= */}
      <Dialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Staff Member"
        description="Add a team member, assign an operational role, and configure store access credentials."
        maxWidth="md"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={handleInviteUser}
            >
              Send Invite & Create Account
            </Button>
          </div>
        }
      >
        <form onSubmit={handleInviteUser} className="space-y-4">
          {formError && (
            <Alert variant="error" title="Could not create staff member">
              {formError}
            </Alert>
          )}

          <FormField label="Full Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Asim Raza"
              autoFocus
            />
          </FormField>

          {isSuperAdmin && (
            <FormField
              label="Store"
              required
              description="The staff member signs in to this store."
            >
              <Select
                value={tenantId}
                onChange={(e) =>
                  setTenantId(e.target.value === '' ? '' : Number(e.target.value))
                }
                options={[
                  { label: 'Select a store...', value: '' },
                  ...tenants.map((t) => ({ label: t.name, value: t.id })),
                ]}
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Official Store Email" required description="Used for login identification.">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. asim@punjabelectric.pk"
              />
            </FormField>

            <FormField label="Mobile Phone Number">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 300 1234567"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Assigned Store Role" required>
              <Select
                value={roleSlug}
                onChange={(e) => setRoleSlug(e.target.value as RoleSlug)}
                options={[
                  { label: 'POS Cashier (Billing & register counter)', value: 'cashier' },
                  { label: 'Store Manager (Catalog, stock & quotes)', value: 'manager' },
                  { label: 'Store Accountant (Ledgers & recoveries)', value: 'accountant' },
                  { label: 'Store Owner (Full administrative access)', value: 'owner' },
                ]}
              />
            </FormField>

            <FormField label="Initial Operational Status" required>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                options={[
                  { label: 'Active - Immediate login enabled', value: 'active' },
                  { label: 'Inactive / Pending onboarding', value: 'inactive' },
                ]}
              />
            </FormField>
          </div>

          {/* Role Scope Explanation Card */}
          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#18181B]">
              <ShieldCheck className="w-4 h-4 text-[#065F46]" />
              <span>Permission Scope: {ROLES_CONFIG[roleSlug]?.name}</span>
            </div>
            <p className="text-[#71717A] leading-relaxed">
              {ROLES_CONFIG[roleSlug]?.description}.
            </p>
          </div>

          {/* Credentials Preview */}
          <FormField label="Temporary Initial Password" description="Staff can reset this upon their initial store login.">
            <div className="relative">
              <Input
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="font-mono"
              />
              <Lock className="w-4 h-4 text-[#A1A1AA] absolute right-3 top-2.5" />
            </div>
          </FormField>
        </form>
      </Dialog>
    </PageContainer>
  );
};
