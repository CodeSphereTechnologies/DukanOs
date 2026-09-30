import { Avatar } from "../../../components/ui/Avatar";
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import { formatError } from '../../../lib/utils';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { UserPlus, Eye, Edit, Trash, FileText, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';
import type { Customer } from '../../../types/customer.types';
import { customerService } from '../../../services/customer.service';
import { StatCard } from '../../../components/common/StatCard';
export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'receivable' | 'payable' | 'settled'>('all');

  useEffect(() => {
    customerService.getAll().then((res) => {
      if (res.data) setCustomers(res.data);
    });
  }, []);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Customer['status']>('active');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search));
      if (!matchesSearch) return false;
      
      const bal = c.current_balance || 0;
      if (filter === 'receivable') return bal > 0;
      if (filter === 'payable') return bal < 0;
      if (filter === 'settled') return bal === 0;
      return true;
    });
  }, [customers, search, filter]);

  const stats = useMemo(() => {
    let totalReceivable = 0;
    let totalPayable = 0;
    let oweUsCount = 0;
    
    customers.forEach(c => {
      const b = c.current_balance || 0;
      if (b > 0) {
        totalReceivable += b;
        oweUsCount++;
      } else if (b < 0) {
        totalPayable += Math.abs(b);
      }
    });

    return { totalReceivable, totalPayable, oweUsCount, total: customers.length };
  }, [customers]);

  const resetAddForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setOpeningBalance(0);
    setStatus('active');
    setFormError(null);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const newCust = await customerService.saveCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        current_balance: Number(openingBalance) || 0,
        status,
      });

      setCustomers((prev) => [newCust, ...prev]);
      setIsAddOpen(false);
      resetAddForm();
    } catch (err: any) {
      setFormError(formatError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = (c: Customer) => {
    if (window.confirm(`Delete customer "${c.name}"? This action cannot be undone.`)) {
      customerService.deleteCustomer(c.id);
      setCustomers(customers.filter((cust) => cust.id !== c.id));
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer Name',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} className="w-8 h-8 shrink-0" />
          <div>
            <div className="font-semibold text-[#18181B]">{c.name}</div>
            <div className="text-xs text-[#71717A]">
              {[c.phone || 'No phone', c.email].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'address', header: 'Address / Area' },
    {
      key: 'current_balance',
      header: 'Outstanding Balance',
      align: 'right',
      render: (c) => {
        const bal = c.current_balance || 0;
        if (bal === 0) {
          return (
            <div className="flex flex-col items-end" title="Balance is clear (0)">
              <span className="font-bold text-[#71717A] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settled
              </span>
            </div>
          );
        } else if (bal > 0) {
          return (
            <div className="flex flex-col items-end" title="Customer owes you this amount">
              <span className="font-bold text-[#DC2626] flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {formatCurrency(Math.abs(bal))}
              </span>
              <span className="text-[10px] text-[#DC2626] font-medium uppercase tracking-wider">Customer Owes Us</span>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-end" title="You owe this amount to the customer (Advance/Refund)">
              <span className="font-bold text-[#059669] flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                {formatCurrency(Math.abs(bal))}
              </span>
              <span className="text-[10px] text-[#059669] font-medium uppercase tracking-wider">We Owe Customer</span>
            </div>
          );
        }
      },
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (c) => <Badge variant={c.status === 'active' ? 'mint' : 'neutral'}>{c.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (c) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/customers/${c.id}`)}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Edit className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/customers/${c.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<Trash className="w-3.5 h-3.5" />}
            onClick={() => handleDeleteCustomer(c)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Customer Accounts & Ledger"
      subtitle="Customer profiles, purchase histories, and on-account outstanding balances."
      primaryAction={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => navigate('/reports?tab=ledger')}
          >
            Ledger Reports
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddOpen(true)}
          >
            Add Customer
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Receivables"
          value={formatCurrency(stats.totalReceivable)}
          change={{ value: `${stats.oweUsCount} customers in debt`, trend: 'neutral' }}
        />
        <StatCard
          title="Total Payables (Advances)"
          value={formatCurrency(stats.totalPayable)}
          change={{ value: "Advance payments received", trend: 'neutral' }}
        />
        <StatCard
          title="Customers in Debt"
          value={stats.oweUsCount.toString()}
          change={{ value: "Owe us money", trend: 'neutral' }}
        />
        <StatCard
          title="Total Customers"
          value={stats.total.toString()}
          change={{ value: "Active profiles", trend: 'neutral' }}
        />
      </div>

      <div className="bg-white border border-[#E4E4E7] p-2 rounded-lg flex items-center gap-1 mb-4 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          All Customers
        </button>
        <button
          onClick={() => setFilter('receivable')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'receivable' ? 'bg-red-50 text-red-700' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          Customers in Debt
        </button>
        <button
          onClick={() => setFilter('payable')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'payable' ? 'bg-emerald-50 text-emerald-700' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          We Owe (Advances)
        </button>
        <button
          onClick={() => setFilter('settled')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'settled' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          Settled / Clear
        </button>
      </div>

      <div className="space-y-4">
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search customers by name, phone, or email..."
        />
        <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
      </div>

      <Dialog
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          resetAddForm();
        }}
        title="Add Customer Profile"
        description="Create an account to track on-account credit sales and payment histories."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAddOpen(false);
                resetAddForm();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddCustomer} disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create Customer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          {formError && (
            <Alert variant="error" title="Validation Error" onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name / Business Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chaudhry Bilal (Contractor)"
                autoFocus
              />
            </FormField>
            <FormField label="Mobile Phone Number">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 300 1234567"
              />
            </FormField>
            <FormField label="Email Address">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. bilal@contractors.pk"
              />
            </FormField>
            <FormField label="Shop / Site Address">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop #4, Model Town Market"
              />
            </FormField>
            <FormField label="Opening Outstanding Balance (PKR)">
              <Input
                type="number"
                min={0}
                value={openingBalance || ''}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                placeholder="0"
              />
            </FormField>
            <FormField label="Account Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as Customer['status'])}
                options={[
                  { label: 'Active - can purchase on account', value: 'active' },
                  { label: 'Inactive - ledger kept for records', value: 'inactive' },
                ]}
              />
            </FormField>
          </div>
        </form>
      </Dialog>
    </PageContainer>
  );
};
