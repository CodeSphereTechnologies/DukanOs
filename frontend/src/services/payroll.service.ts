import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import { financeService } from './finance.service';

export interface EmployeeSalary {
  id: number;
  name: string;
  designation: string;
  phone?: string;
  cnic?: string;
  salary: number;
  bonus: number;
  deductions: number;
  net_payable: number;
  status: 'paid' | 'pending';
  joining_date: string;
  disbursed_at?: string;
  payment_method?: 'cash' | 'bank_transfer' | 'cheque';
}

export const STORAGE_KEY_PAYROLL = 'dukanos_payroll';

export const INITIAL_SALARIES: EmployeeSalary[] = [
  {
    id: 1,
    name: 'Usman Ali',
    designation: 'Senior Sales Representative',
    phone: '+92 301 2345678',
    cnic: '35201-1234567-1',
    salary: 45000,
    bonus: 3000,
    deductions: 0,
    net_payable: 48000,
    status: 'paid',
    joining_date: '2025-03-01',
    disbursed_at: '2026-09-01',
    payment_method: 'bank_transfer',
  },
  {
    id: 2,
    name: 'Kashif Mehmood',
    designation: 'Store Cashier',
    phone: '+92 321 8765432',
    cnic: '35202-7654321-3',
    salary: 35000,
    bonus: 0,
    deductions: 1000,
    net_payable: 34000,
    status: 'paid',
    joining_date: '2025-06-15',
    disbursed_at: '2026-09-01',
    payment_method: 'cash',
  },
  {
    id: 3,
    name: 'Imran Khan',
    designation: 'Inventory & Delivery Staff',
    phone: '+92 333 4567891',
    cnic: '35201-9876543-5',
    salary: 30000,
    bonus: 1500,
    deductions: 0,
    net_payable: 31500,
    status: 'pending',
    joining_date: '2026-01-10',
  },
  {
    id: 4,
    name: 'Muhammad Tariq',
    designation: 'Store Helper / Packing Staff',
    phone: '+92 345 6789012',
    cnic: '35201-4455667-7',
    salary: 26000,
    bonus: 1000,
    deductions: 500,
    net_payable: 26500,
    status: 'pending',
    joining_date: '2026-02-01',
  },
];

function getStoredEmployees(): EmployeeSalary[] {
  if (typeof window === 'undefined') return INITIAL_SALARIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAYROLL);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PAYROLL, JSON.stringify(INITIAL_SALARIES));
      return INITIAL_SALARIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SALARIES;
  } catch {
    return INITIAL_SALARIES;
  }
}

function saveStoredEmployees(employees: EmployeeSalary[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PAYROLL, JSON.stringify(employees));
  } catch {
    // ignore
  }
}

export const payrollService = {
  async getEmployees(): Promise<ApiResponse<EmployeeSalary[]>> {
    try {
      const res = await apiClient.get<EmployeeSalary[]>('/payroll');
      if (res && res.data && res.data.length > 0) {
        saveStoredEmployees(res.data);
        return res;
      }
    } catch {
      // offline fallback
    }
    return { data: getStoredEmployees(), status: 200, message: 'Loaded payroll records' };
  },

  async addEmployee(
    data: Omit<EmployeeSalary, 'id' | 'net_payable'>
  ): Promise<ApiResponse<EmployeeSalary>> {
    const employees = getStoredEmployees();
    const net = Number(data.salary) + Number(data.bonus || 0) - Number(data.deductions || 0);
    const newEmp: EmployeeSalary = {
      ...data,
      id: Math.max(0, ...employees.map((e) => e.id)) + 1,
      salary: Number(data.salary),
      bonus: Number(data.bonus || 0),
      deductions: Number(data.deductions || 0),
      net_payable: Math.max(0, net),
      status: data.status || 'pending',
    };

    const updated = [newEmp, ...employees];
    saveStoredEmployees(updated);

    try {
      await apiClient.post<EmployeeSalary>('/payroll', newEmp);
    } catch {
      // offline
    }

    return { data: newEmp, status: 201, message: 'Employee added to payroll successfully' };
  },

  async markAsPaid(
    id: number,
    paymentMethod: 'cash' | 'bank_transfer' | 'cheque' = 'bank_transfer'
  ): Promise<ApiResponse<EmployeeSalary | null>> {
    const employees = getStoredEmployees();
    const idx = employees.findIndex((e) => e.id === id);
    if (idx < 0) return { data: null, status: 404, message: 'Employee not found' };

    const today = new Date().toISOString().split('T')[0];
    employees[idx] = {
      ...employees[idx],
      status: 'paid',
      disbursed_at: today,
      payment_method: paymentMethod,
    };
    saveStoredEmployees(employees);

    // Also post expense transaction to Daily Cashflow Ledger
    try {
      await financeService.createTransaction({
        category: 'Staff Salaries',
        type: 'expense',
        amount: employees[idx].net_payable,
        description: `Salary disbursement for ${employees[idx].name} (${employees[idx].designation})`,
        date: today,
        payment_method: paymentMethod,
        reference_no: `SAL-${employees[idx].id}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      });
    } catch {
      // ignore
    }

    return { data: employees[idx], status: 200, message: 'Salary disbursed and posted to cashflow ledger' };
  },

  async deleteEmployee(id: number): Promise<ApiResponse<boolean>> {
    const employees = getStoredEmployees();
    const updated = employees.filter((e) => e.id !== id);
    saveStoredEmployees(updated);

    try {
      await apiClient.delete(`/payroll/${id}`);
    } catch {
      // offline
    }

    return { data: true, status: 200, message: 'Employee removed from payroll' };
  },
};
