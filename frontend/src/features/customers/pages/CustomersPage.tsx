import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { UserPlus, Eye, Edit, Trash } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';
import type { Customer } from '../../../types/customer.types';
import { customerService } from '../../../services/customer.service';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    customerService.getAll().then((res) => {
      if (res.data) setCustomers(res.data);
    });
  }, []);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCust = await customerService.saveCustomer({
      name,
      phone: phone || undefined,
      address: address || undefined,
      current_balance: Number(openingBalance) || 0,
      status: 'active',
    });

    setCustomers([newCust, ...customers]);
    setIsAddOpen(false);
    setName('');
    setPhone('');
    setAddress('');
    setOpeningBalance(0);
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
        <div>
          <div className="font-semibold text-[#18181B]">{c.name}</div>
          <div className="text-xs text-[#71717A]">{c.phone || 'No phone'}</div>
        </div>
      ),
    },
    { key: 'address', header: 'Address / Area' },
    {
      key: 'current_balance',
      header: 'Outstanding Balance',
      align: 'right',
      render: (c) => (
        <span
          className={`font-bold ${
            (c.current_balance || 0) > 0 ? 'text-[#DC2626]' : 'text-[#065F46]'
          }`}
        >
          {formatCurrency(c.current_balance || 0)}
        </span>
      ),
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
        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsAddOpen(true)}
        >
          Add Customer
        </Button>
      }
    >
      <div className="space-y-4">
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search customers by name or phone..."
        />
        <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
      </div>

      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Customer Profile"
        description="Create an account to track on-account credit sales and payment histories."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddCustomer}>
              Create Customer
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
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
              value={openingBalance || ''}
              onChange={(e) => setOpeningBalance(Number(e.target.value))}
              placeholder="0"
            />
          </FormField>
        </form>
      </Dialog>
    </PageContainer>
  );
};
