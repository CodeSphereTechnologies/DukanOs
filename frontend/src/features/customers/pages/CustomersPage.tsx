import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { UserPlus, BookOpen } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';
import type { Customer } from '../../../types/customer.types';

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Chaudhry Bilal (Contractor)', phone: '+92 300 1234567', email: 'bilal@contractors.pk', address: 'Model Town, Lahore', current_balance: 142000, status: 'active' },
  { id: 2, name: 'Tariq Electric Works', phone: '+92 321 9876543', email: 'tariq@electric.pk', address: 'Brandreth Road, Lahore', current_balance: 98500, status: 'active' },
  { id: 3, name: 'Al-Madina Construction', phone: '+92 300 7654321', email: 'madina@builders.pk', address: 'DHA Phase 5, Lahore', current_balance: 0, status: 'active' },
];

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

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

    setCustomers([newCust, ...customers]);
    setIsAddOpen(false);
    setName('');
    setPhone('');
    setAddress('');
    setOpeningBalance(0);
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
      header: 'Ledger',
      align: 'right',
      render: (c) => (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<BookOpen className="w-3.5 h-3.5" />}
          onClick={() => setSelectedLedgerCustomer(c)}
        >
          Statement
        </Button>
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
        isOpen={!!selectedLedgerCustomer}
        onClose={() => setSelectedLedgerCustomer(null)}
        title={`Ledger Statement: ${selectedLedgerCustomer?.name}`}
        description={`Current Outstanding Balance: ${formatCurrency(selectedLedgerCustomer?.current_balance || 0)}`}
        maxWidth="lg"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setSelectedLedgerCustomer(null)}>
            Close Statement
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] flex justify-between items-center text-xs">
            <div>
              <span className="text-[#71717A]">Phone:</span> {selectedLedgerCustomer?.phone}
            </div>
            <div>
              <span className="text-[#71717A]">Address:</span> {selectedLedgerCustomer?.address}
            </div>
          </div>
          <div className="border border-[#E4E4E7] rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-4 bg-[#FAFAF8] p-3 font-semibold text-[#71717A] border-b border-[#E4E4E7]">
              <span>Date</span>
              <span>Description</span>
              <span className="text-right">Debit / Credit</span>
              <span className="text-right">Balance</span>
            </div>
            <div className="p-3 grid grid-cols-4 border-b border-[#E4E4E7]/50">
              <span>2026-09-01</span>
              <span>Invoice #INV-2026-0091</span>
              <span className="text-right text-[#DC2626] font-semibold">+PKR 92,400.00</span>
              <span className="text-right font-bold">{formatCurrency(selectedLedgerCustomer?.current_balance || 0)}</span>
            </div>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
};
