import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { UserPlus, Eye, Edit, Trash, Phone, Mail, MapPin } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';
import type { Customer } from '../../../types/customer.types';
import { customerService } from '../../../services/customer.service';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    customerService.getAll().then((res) => {
      if (res.data) setCustomers(res.data);
    });
  }, []);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCust: Customer = {
      id: customers.length + 1,
      name,
      phone: phone || undefined,
      address: address || undefined,
      current_balance: Number(openingBalance) || 0,
      status: 'active',
    };

    customerService.saveCustomer(newCust);
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

  const openEditDialog = (c: Customer) => {
    setEditCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone || '');
    setEditAddress(c.address || '');
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer || !editName) return;

    const updated: Customer = {
      ...editCustomer,
      name: editName,
      phone: editPhone || undefined,
      address: editAddress || undefined,
    };

    customerService.saveCustomer(updated);
    setCustomers(customers.map((cust) => (cust.id === updated.id ? updated : cust)));
    setEditCustomer(null);
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
            onClick={() => setSelectedLedgerCustomer(c)}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Edit className="w-3.5 h-3.5" />}
            onClick={() => openEditDialog(c)}
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

      <Dialog
        isOpen={!!editCustomer}
        onClose={() => setEditCustomer(null)}
        title="Edit Customer Profile"
        description={`Update details for ${editCustomer?.name || 'customer'}.`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditCustomer(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateCustomer}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4">
          <FormField label="Full Name / Business Name" required>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Chaudhry Bilal (Contractor)"
              autoFocus
            />
          </FormField>
          <FormField label="Mobile Phone Number">
            <Input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="e.g. +92 300 1234567"
            />
          </FormField>
          <FormField label="Shop / Site Address">
            <Input
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="e.g. Shop #4, Model Town Market"
            />
          </FormField>
        </form>
      </Dialog>

      <Dialog
        isOpen={!!selectedLedgerCustomer}
        onClose={() => setSelectedLedgerCustomer(null)}
        title="Customer Profile & Ledger"
        description={`Viewing details for ${selectedLedgerCustomer?.name || 'customer'}.`}
        maxWidth="xl"
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (selectedLedgerCustomer) openEditDialog(selectedLedgerCustomer);
              }}
            >
              Edit Profile
            </Button>
            <Button variant="primary" size="sm" onClick={() => setSelectedLedgerCustomer(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedLedgerCustomer && (
          <div className="space-y-5">
            {/* Header card */}
            <div className="w-full">
              <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-[#E4E4E7] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#000000] text-white flex items-center justify-center font-semibold text-lg shrink-0">
                  {selectedLedgerCustomer.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-semibold text-[#18181B] truncate">
                      {selectedLedgerCustomer.name}
                    </h4>
                    <Badge
                      variant={selectedLedgerCustomer.status === 'active' ? 'mint' : 'neutral'}
                      size="sm"
                    >
                      {selectedLedgerCustomer.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#71717A]">
                    {selectedLedgerCustomer.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedLedgerCustomer.phone}
                      </span>
                    )}
                    {selectedLedgerCustomer.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {selectedLedgerCustomer.email}
                      </span>
                    )}
                    {selectedLedgerCustomer.address && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedLedgerCustomer.address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-[11px] uppercase tracking-wide text-[#71717A]">
                    Outstanding Balance
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      (selectedLedgerCustomer.current_balance || 0) > 0
                        ? 'text-[#DC2626]'
                        : 'text-[#065F46]'
                    }`}
                  >
                    {formatCurrency(selectedLedgerCustomer.current_balance || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 sm:p-4 bg-white rounded-xl border border-[#E4E4E7]">
                <div className="text-[11px] uppercase tracking-wide text-[#71717A]">
                  Customer ID
                </div>
                <div className="mt-1 text-sm font-semibold text-[#18181B] font-mono">
                  #{String(selectedLedgerCustomer.id).padStart(4, '0')}
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-white rounded-xl border border-[#E4E4E7]">
                <div className="text-[11px] uppercase tracking-wide text-[#71717A]">
                  Account Type
                </div>
                <div className="mt-1 text-sm font-semibold text-[#18181B]">On-Account Credit</div>
              </div>
              <div className="p-3 sm:p-4 bg-white rounded-xl border border-[#E4E4E7]">
                <div className="text-[11px] uppercase tracking-wide text-[#71717A]">
                  Member Since
                </div>
                <div className="mt-1 text-sm font-semibold text-[#18181B]">
                  {selectedLedgerCustomer.created_at
                    ? new Date(selectedLedgerCustomer.created_at).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Ledger table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-semibold text-[#18181B]">Ledger Transactions</h5>
                <span className="text-xs text-[#71717A]">Latest activity</span>
              </div>
              <div className="border border-[#E4E4E7] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-4 min-w-[480px] bg-[#FAFAF8] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#71717A] border-b border-[#E4E4E7]">
                  <span>Date</span>
                  <span>Description</span>
                  <span className="text-right">Debit / Credit</span>
                  <span className="text-right">Balance</span>
                </div>
                <div className="px-4 py-3 grid grid-cols-4 min-w-[480px] border-b border-[#E4E4E7]/50 text-xs text-[#18181B]">
                  <span className="text-[#71717A]">2026-09-01</span>
                  <span>Invoice #INV-2026-0091</span>
                  <span className="text-right text-[#DC2626] font-semibold">+PKR 92,400.00</span>
                  <span className="text-right font-bold">
                    {formatCurrency(selectedLedgerCustomer.current_balance || 0)}
                  </span>
                </div>
                <div className="px-4 py-3 grid grid-cols-4 min-w-[480px] text-xs text-[#18181B]">
                  <span className="text-[#71717A]">2026-08-22</span>
                  <span>Payment received against prior invoice</span>
                  <span className="text-right text-[#065F46] font-semibold">-PKR 15,000.00</span>
                  <span className="text-right font-bold">{formatCurrency((selectedLedgerCustomer.current_balance || 0) - 15000)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </PageContainer>
  );
};
