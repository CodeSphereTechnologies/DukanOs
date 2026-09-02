import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Plus, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';

interface EmployeeSalary {
  id: number;
  name: string;
  designation: string;
  salary: number;
  bonus: number;
  deductions: number;
  net_payable: number;
  status: 'paid' | 'pending';
  joining_date: string;
}

const INITIAL_SALARIES: EmployeeSalary[] = [
  { id: 1, name: 'Usman Ali', designation: 'Senior Sales Representative', salary: 45000, bonus: 3000, deductions: 0, net_payable: 48000, status: 'paid', joining_date: '2025-03-01' },
  { id: 2, name: 'Kashif Mehmood', designation: 'Store Cashier', salary: 35000, bonus: 0, deductions: 1000, net_payable: 34000, status: 'paid', joining_date: '2025-06-15' },
  { id: 3, name: 'Imran Khan', designation: 'Inventory & Delivery Staff', salary: 30000, bonus: 1500, deductions: 0, net_payable: 31500, status: 'pending', joining_date: '2026-01-10' },
];

export const PayrollPage: React.FC = () => {
  const [salaries, setSalaries] = useState<EmployeeSalary[]>(INITIAL_SALARIES);

  const handleMarkPaid = (id: number) => {
    setSalaries(salaries.map((s) => (s.id === id ? { ...s, status: 'paid' } : s)));
  };

  const columns: Column<EmployeeSalary>[] = [
    {
      key: 'name',
      header: 'Employee Name & Role',
      render: (emp) => (
        <div>
          <div className="font-semibold text-[#18181B]">{emp.name}</div>
          <div className="text-xs text-[#71717A]">{emp.designation}</div>
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Base Salary',
      align: 'right',
      render: (emp) => formatCurrency(emp.salary),
    },
    {
      key: 'net_payable',
      header: 'Net Payable',
      align: 'right',
      render: (emp) => <span className="font-bold text-black">{formatCurrency(emp.net_payable)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (emp) => (
        <Badge variant={emp.status === 'paid' ? 'mint' : 'warning'}>
          {emp.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'joining_date',
      header: 'Joined',
      align: 'right',
      render: (emp) => formatDate(emp.joining_date),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (emp) =>
        emp.status === 'pending' ? (
          <Button
            variant="success"
            size="sm"
            onClick={() => handleMarkPaid(emp.id)}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Mark Paid
          </Button>
        ) : (
          <span className="text-xs text-[#71717A]">Disbursed</span>
        ),
    },
  ];

  return (
    <PageContainer
      title="Employee Payroll & Salaries"
      subtitle="Monthly employee salary records, payment disbursement, and financial expense ledger posting."
      primaryAction={
        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
          Add Employee
        </Button>
      }
    >
      <div className="space-y-4">
        <DataTable columns={columns} data={salaries} keyExtractor={(item) => item.id} />
      </div>
    </PageContainer>
  );
};
