import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/common/StatCard';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import {
  UserPlus,
  CheckCircle2,
  Users,
  Wallet,
  Clock,
  Printer,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { payrollService, type EmployeeSalary } from '../../../services/payroll.service';

const DESIGNATION_PRESETS = [
  { label: 'Senior Sales Representative', value: 'Senior Sales Representative' },
  { label: 'Store Cashier', value: 'Store Cashier' },
  { label: 'Inventory & Delivery Staff', value: 'Inventory & Delivery Staff' },
  { label: 'Electrician / Technician', value: 'Electrician / Technician' },
  { label: 'Store Helper / Packing Staff', value: 'Store Helper / Packing Staff' },
  { label: 'Accountant', value: 'Accountant' },
  { label: 'Store Manager', value: 'Store Manager' },
  { label: 'Other / Custom Role', value: 'custom' },
];

export const PayrollPage: React.FC = () => {
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [disbursingEmployee, setDisbursingEmployee] = useState<EmployeeSalary | null>(null);
  const [disbursementMethod, setDisbursementMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('bank_transfer');
  const [selectedPayslip, setSelectedPayslip] = useState<EmployeeSalary | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [designationSelect, setDesignationSelect] = useState('Senior Sales Representative');
  const [customDesignation, setCustomDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [baseSalary, setBaseSalary] = useState<number | ''>('');
  const [bonus, setBonus] = useState<number | ''>('');
  const [deductions, setDeductions] = useState<number | ''>('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [initialStatus, setInitialStatus] = useState<'pending' | 'paid'>('pending');

  const loadData = async () => {
    const res = await payrollService.getEmployees();
    if (res.data) {
      setSalaries(res.data);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  // Calculated Net Salary for form preview
  const formNetPayable = useMemo(() => {
    const base = Number(baseSalary) || 0;
    const b = Number(bonus) || 0;
    const d = Number(deductions) || 0;
    return Math.max(0, base + b - d);
  }, [baseSalary, bonus, deductions]);

  const handleOpenAdd = () => {
    setName('');
    setDesignationSelect('Senior Sales Representative');
    setCustomDesignation('');
    setPhone('');
    setCnic('');
    setBaseSalary('');
    setBonus('');
    setDeductions('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setInitialStatus('pending');
    setIsAddOpen(true);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter employee name.');
      return;
    }
    const finalRole = designationSelect === 'custom' ? customDesignation.trim() : designationSelect;
    if (!finalRole) {
      alert('Please specify the employee designation/role.');
      return;
    }
    const sal = Number(baseSalary);
    if (!sal || sal <= 0) {
      alert('Please enter a valid base salary amount.');
      return;
    }

    await payrollService.addEmployee({
      name: name.trim(),
      designation: finalRole,
      phone: phone.trim() || undefined,
      cnic: cnic.trim() || undefined,
      salary: sal,
      bonus: Number(bonus) || 0,
      deductions: Number(deductions) || 0,
      joining_date: joiningDate,
      status: initialStatus,
    });

    setIsAddOpen(false);
    await loadData();
    setSuccessMsg(`Employee ${name.trim()} successfully registered to payroll!`);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleConfirmDisbursement = async () => {
    if (!disbursingEmployee) return;
    await payrollService.markAsPaid(disbursingEmployee.id, disbursementMethod);
    setDisbursingEmployee(null);
    await loadData();
    setSuccessMsg(
      `Salary of ${formatCurrency(disbursingEmployee.net_payable)} marked as paid for ${disbursingEmployee.name}! Disbursed to finance ledger.`
    );
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Are you sure you want to remove this employee from payroll?')) return;
    await payrollService.deleteEmployee(id);
    await loadData();
  };

  // Metrics
  const totalPayroll = useMemo(
    () => salaries.reduce((acc, cur) => acc + cur.net_payable, 0),
    [salaries]
  );
  const disbursedTotal = useMemo(
    () => salaries.filter((s) => s.status === 'paid').reduce((acc, cur) => acc + cur.net_payable, 0),
    [salaries]
  );
  const pendingTotal = useMemo(
    () => salaries.filter((s) => s.status === 'pending').reduce((acc, cur) => acc + cur.net_payable, 0),
    [salaries]
  );
  const pendingCount = useMemo(
    () => salaries.filter((s) => s.status === 'pending').length,
    [salaries]
  );

  // Filtered staff
  const filtered = useMemo(() => {
    return salaries.filter((emp) => {
      if (activeTab === 'pending' && emp.status !== 'pending') return false;
      if (activeTab === 'paid' && emp.status !== 'paid') return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q) ||
        (emp.phone && emp.phone.toLowerCase().includes(q)) ||
        (emp.cnic && emp.cnic.toLowerCase().includes(q))
      );
    });
  }, [salaries, activeTab, search]);

  const columns: Column<EmployeeSalary>[] = [
    {
      key: 'name',
      header: 'Employee Name & Role',
      render: (emp) => (
        <div>
          <div className="font-semibold text-[#18181B] flex items-center gap-2">
            <span>{emp.name}</span>
            {emp.cnic && (
              <span className="text-[10px] font-mono text-[#71717A] bg-[#F4F4F5] px-1.5 py-0.5 rounded">
                {emp.cnic}
              </span>
            )}
          </div>
          <div className="text-xs text-[#71717A] mt-0.5">
            {emp.designation} {emp.phone && `\u2022 ${emp.phone}`}
          </div>
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Base Salary',
      align: 'right',
      render: (emp) => (
        <div className="font-mono text-xs text-[#52525B]">
          {formatCurrency(emp.salary)}
        </div>
      ),
    },
    {
      key: 'bonus',
      header: 'Bonus / Allowances',
      align: 'right',
      render: (emp) => (
        <div className="font-mono text-xs text-[#065F46]">
          {emp.bonus > 0 ? `+${formatCurrency(emp.bonus)}` : '\u2014'}
        </div>
      ),
    },
    {
      key: 'deductions',
      header: 'Deductions',
      align: 'right',
      render: (emp) => (
        <div className="font-mono text-xs text-[#DC2626]">
          {emp.deductions > 0 ? `-${formatCurrency(emp.deductions)}` : '\u2014'}
        </div>
      ),
    },
    {
      key: 'net_payable',
      header: 'Net Payable',
      align: 'right',
      render: (emp) => (
        <span className="font-mono font-bold text-sm text-[#18181B]">
          {formatCurrency(emp.net_payable)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (emp) => (
        <Badge variant={emp.status === 'paid' ? 'mint' : 'warning'}>
          {emp.status === 'paid' ? 'DISBURSED' : 'PENDING'}
        </Badge>
      ),
    },
    {
      key: 'joining_date',
      header: 'Joined',
      align: 'right',
      render: (emp) => (
        <span className="text-xs text-[#71717A]">{formatDate(emp.joining_date)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (emp) => (
        <div className="flex items-center justify-end gap-1.5">
          {emp.status === 'pending' ? (
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                setDisbursingEmployee(emp);
                setDisbursementMethod('bank_transfer');
              }}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Mark Paid
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPayslip(emp)}
              title="View & Print Payslip"
            >
              <Printer className="w-3.5 h-3.5 text-[#52525B]" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteEmployee(emp.id)}
            title="Remove Employee"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageContainer
        title="Employee Payroll & Salaries"
        subtitle="Monthly employee salary records, payment disbursement, and financial expense ledger posting."
        className="print:hidden"
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Add Employee
        </Button>
      }
    >
      {/* Alert Banner */}
      {successMsg && (
        <div className="mb-6">
          <Alert variant="success">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {successMsg}
              </span>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-xs underline hover:text-emerald-900"
              >
                Dismiss
              </button>
            </div>
          </Alert>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Monthly Payroll"
          value={formatCurrency(totalPayroll)}
          change={{ value: `${salaries.length} total staff members`, trend: 'neutral' }}
          icon={<Wallet className="w-5 h-5 text-[#18181B]" />}
        />
        <StatCard
          title="Disbursed Salaries"
          value={formatCurrency(disbursedTotal)}
          change={{ value: `${salaries.filter((s) => s.status === 'paid').length} payments cleared`, trend: 'up' }}
          icon={<CheckCircle2 className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Pending Disbursement"
          value={formatCurrency(pendingTotal)}
          change={{ value: `${pendingCount} staff awaiting salary`, trend: pendingCount > 0 ? 'down' : 'neutral' }}
          icon={<Clock className="w-5 h-5 text-[#D97706]" />}
        />
        <StatCard
          title="Active Employees"
          value={String(salaries.length)}
          change={{ value: 'Full-time & store staff', trend: 'neutral' }}
          icon={<Users className="w-5 h-5 text-[#0284C7]" />}
        />
      </div>

      <div className="space-y-4">
        {/* Filter Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
              }`}
            >
              All Staff ({salaries.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-[#D97706] text-white'
                  : 'text-[#71717A] hover:text-[#D97706] hover:bg-[#FEF3C7]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending Disbursement ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'paid'
                  ? 'bg-[#047857] text-white'
                  : 'text-[#71717A] hover:text-[#047857] hover:bg-[#F0FDF4]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Disbursed / Paid ({salaries.filter((s) => s.status === 'paid').length})
            </button>
          </div>
        </div>

        {/* Search Toolbar */}
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search staff by employee name, role, phone, CNIC..."
        />

        {/* Data Table */}
        <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
      </div>

      {/* ========================================================= */}
      {/* 1. ADD EMPLOYEE MODAL                                     */}
      {/* ========================================================= */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Employee to Payroll"
        description="Register a new store employee, configure monthly base salary, allowances, and deductions."
        maxWidth="lg"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddEmployee} leftIcon={<UserPlus className="w-4 h-4" />}>
              Save & Register Employee
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Usman Ali"
                autoFocus
              />
            </FormField>

            <FormField label="Designation / Job Role" required>
              <Select
                value={designationSelect}
                onChange={(e) => setDesignationSelect(e.target.value)}
                options={DESIGNATION_PRESETS}
              />
            </FormField>
          </div>

          {designationSelect === 'custom' && (
            <FormField label="Custom Role Title" required>
              <Input
                value={customDesignation}
                onChange={(e) => setCustomDesignation(e.target.value)}
                placeholder="e.g. Store Supervisor / Field Electrician"
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Contact Phone Number">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 300 1234567"
              />
            </FormField>

            <FormField label="CNIC / National Identity Card">
              <Input
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="e.g. 35201-1234567-1"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Base Salary (PKR)" required>
              <Input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                placeholder="e.g. 45000"
              />
            </FormField>

            <FormField label="Bonus / Allowance (PKR)">
              <Input
                type="number"
                value={bonus}
                onChange={(e) => setBonus(Number(e.target.value))}
                placeholder="0"
              />
            </FormField>

            <FormField label="Deductions / Advance (PKR)">
              <Input
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(Number(e.target.value))}
                placeholder="0"
              />
            </FormField>
          </div>

          {/* Live Net Salary Summary */}
          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] flex items-center justify-between text-xs">
            <span className="text-[#52525B] font-medium">Calculated Monthly Net Salary:</span>
            <span className="font-mono font-bold text-base text-[#18181B]">
              {formatCurrency(formNetPayable)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date of Joining" required>
              <Input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </FormField>

            <FormField label="Initial Payment Status" required>
              <Select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as 'pending' | 'paid')}
                options={[
                  { label: 'Pending Disbursement', value: 'pending' },
                  { label: 'Already Paid (Current Month)', value: 'paid' },
                ]}
              />
            </FormField>
          </div>
        </form>
      </Dialog>

      {/* ========================================================= */}
      {/* 2. DISBURSEMENT CONFIRMATION MODAL                        */}
      {/* ========================================================= */}
      <Dialog
        isOpen={!!disbursingEmployee}
        onClose={() => setDisbursingEmployee(null)}
        title="Disburse Monthly Salary"
        description={`Confirm salary payment and automatically post expense entry into Daily Cashflow Ledger.`}
        maxWidth="md"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDisbursingEmployee(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleConfirmDisbursement}
              className="bg-[#047857] hover:bg-[#065F46]"
            >
              Confirm Disbursement
            </Button>
          </div>
        }
      >
        {disbursingEmployee && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-sm text-[#14532D]">{disbursingEmployee.name}</div>
                <div className="text-[#15803D] mt-0.5">{disbursingEmployee.designation}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#15803D] font-semibold">Net Disbursable</div>
                <div className="font-mono font-black text-lg text-[#047857]">
                  {formatCurrency(disbursingEmployee.net_payable)}
                </div>
              </div>
            </div>

            <FormField label="Disbursement Payment Method" required>
              <Select
                value={disbursementMethod}
                onChange={(e) => setDisbursementMethod(e.target.value as 'cash' | 'bank_transfer' | 'cheque')}
                options={[
                  { label: 'Bank Transfer (Corporate / Salary Account)', value: 'bank_transfer' },
                  { label: 'Cash Drawer Disbursement', value: 'cash' },
                  { label: 'Cheque Payment', value: 'cheque' },
                ]}
              />
            </FormField>

            <div className="p-3 bg-[#F4F4F5] rounded-lg text-[#71717A] text-[11px] leading-relaxed">
              <span className="font-semibold text-[#18181B]">Note:</span> Confirming will update the employee status to <span className="font-semibold text-[#047857]">DISBURSED</span> and post an expense entry of <span className="font-semibold text-[#18181B]">{formatCurrency(disbursingEmployee.net_payable)}</span> under category <em>"Staff Salaries"</em> in your financial accounts.
            </div>
          </div>
        )}
      </Dialog>

      {/* ========================================================= */}
      {/* 3. PAYSLIP / SALARY SLIP MODAL                            */}
      {/* ========================================================= */}
      <Dialog
        isOpen={!!selectedPayslip}
        onClose={() => setSelectedPayslip(null)}
        title="Employee Salary Payslip"
        description="Official store compensation slip for payroll documentation."
        maxWidth="md"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedPayslip(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Payslip
            </Button>
          </div>
        }
      >
        {selectedPayslip && (
          <div className="p-4 border border-[#E4E4E7] rounded-xl bg-white space-y-4 text-xs font-sans">
            {/* Payslip Header */}
            <div className="flex justify-between items-start border-b border-[#E4E4E7] pb-3">
              <div>
                <div className="font-bold text-base text-[#18181B] font-display">PUNJAB ELECTRIC STORE</div>
                <div className="text-[11px] text-[#71717A]">Monthly Staff Payroll Slip</div>
                <div className="text-[10px] text-[#A1A1AA]">HUSSAINI CHOWK BAHAWALPUR</div>
              </div>
              <div className="text-right">
                <Badge variant="mint">SALARY SLIP</Badge>
                <div className="mt-1 text-xs font-mono font-bold text-[#18181B]">
                  SLIP-{selectedPayslip.id}-{new Date().getFullYear()}
                </div>
                <div className="text-[10px] text-[#71717A]">
                  Disbursed: {formatDate(selectedPayslip.disbursed_at || selectedPayslip.joining_date)}
                </div>
              </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-3 py-2 border-b border-[#E4E4E7]">
              <div>
                <span className="text-[#71717A] block text-[10px] uppercase font-semibold">Employee Name</span>
                <span className="font-bold text-sm text-[#18181B]">{selectedPayslip.name}</span>
                <span className="block text-[11px] text-[#52525B]">{selectedPayslip.designation}</span>
              </div>
              <div className="text-right">
                <span className="text-[#71717A] block text-[10px] uppercase font-semibold">CNIC / ID</span>
                <span className="font-mono text-xs font-bold text-[#18181B]">{selectedPayslip.cnic || 'N/A'}</span>
                <span className="block text-[11px] text-[#52525B]">{selectedPayslip.phone || 'No contact'}</span>
              </div>
            </div>

            {/* Salary Calculation Breakdown */}
            <div className="space-y-1.5 border-b border-[#E4E4E7] pb-3 text-xs">
              <div className="flex justify-between text-[#52525B]">
                <span>Base Monthly Salary:</span>
                <span className="font-mono font-semibold">{formatCurrency(selectedPayslip.salary)}</span>
              </div>
              <div className="flex justify-between text-[#065F46]">
                <span>Allowances & Performance Bonus:</span>
                <span className="font-mono font-semibold">+{formatCurrency(selectedPayslip.bonus)}</span>
              </div>
              <div className="flex justify-between text-[#DC2626]">
                <span>Deductions / Advance / Penalties:</span>
                <span className="font-mono font-semibold">-{formatCurrency(selectedPayslip.deductions)}</span>
              </div>
            </div>

            {/* Net Salary Total */}
            <div className="p-3 bg-[#F4F4F5] rounded-lg flex items-center justify-between">
              <span className="font-bold text-sm text-[#18181B]">Net Disbursed Amount:</span>
              <span className="font-mono font-black text-lg text-[#065F46]">
                {formatCurrency(selectedPayslip.net_payable)}
              </span>
            </div>

            {/* Signature blocks */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-[11px] text-[#71717A]">
              <div className="border-t border-[#D4D4D8] pt-1 text-center">Employee Signature</div>
              <div className="border-t border-[#D4D4D8] pt-1 text-center">Approved by Management</div>
            </div>
          </div>
        )}
      </Dialog>
      </PageContainer>

      {/* Print-Only Payslip */}
      {selectedPayslip && (
        <div className="hidden print:block">
          <div className="mx-auto bg-white text-black max-w-[320px] p-6 font-mono text-[11px] leading-[1.6]">
            <div className="text-center mb-1">
              <div className="text-lg font-bold tracking-[0.2em]">DUKANOS</div>
              <div className="text-[10px]">ELECTRICAL &amp; APPLIANCE STORE</div>
              <div>HUSSAINI CHOWK BAHAWALPUR</div>
              <div>Tel: 0300-1234567</div>
            </div>

            <div className="text-center my-2">- - - - - - - - - - - - - - - -</div>

            <div className="flex justify-between">
              <span className="font-bold uppercase">SALARY SLIP</span>
              <span className="font-bold">SLIP-{selectedPayslip.id}-{new Date().getFullYear()}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>{formatDate(selectedPayslip.disbursed_at || selectedPayslip.joining_date)}</span>
            </div>

            <div className="text-center my-2">- - - - - - - - - - - - - - - -</div>

            <div>
              <div className="uppercase text-[10px]">Employee</div>
              <div className="font-bold">{selectedPayslip.name}</div>
              <div>{selectedPayslip.designation}</div>
            </div>
            <div className="flex justify-between mt-1">
              <span>CNIC</span>
              <span>{selectedPayslip.cnic || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Contact</span>
              <span>{selectedPayslip.phone || 'No contact'}</span>
            </div>

            <div className="text-center my-2">- - - - - - - - - - - - - - - -</div>

            <div className="flex justify-between">
              <span>Base Salary</span>
              <span>{formatCurrency(selectedPayslip.salary)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bonus / Allowance</span>
              <span>+{formatCurrency(selectedPayslip.bonus)}</span>
            </div>
            <div className="flex justify-between">
              <span>Deductions</span>
              <span>-{formatCurrency(selectedPayslip.deductions)}</span>
            </div>

            <div className="text-center my-2">- - - - - - - - - - - - - - - -</div>

            <div className="flex justify-between font-bold text-[13px] border-t border-black pt-1.5">
              <span>NET PAYABLE</span>
              <span>{formatCurrency(selectedPayslip.net_payable)}</span>
            </div>

            <div className="text-center my-3">***</div>

            <div className="text-center text-[10px]">
              <div>This is a computer generated slip.</div>
              <div>Subject to management verification.</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

