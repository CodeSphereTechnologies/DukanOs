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

export const STORAGE_KEY_PAYROLL = 'dukanos_payroll_v4';

export const INITIAL_SALARIES: EmployeeSalary[] = [];

function getStoredEmployees(): EmployeeSalary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAYROLL);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
      if (res && Array.isArray(res.data)) {
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
