import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import { customerService } from './customer.service';

export interface FinanceLedgerItem {
  id: number;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  payment_method?: 'cash' | 'bank_transfer' | 'cheque' | 'online';
  reference_no?: string;
  customer_id?: number;
  customer_name?: string;
  created_at?: string;
}

export const STORAGE_KEY_FINANCE = 'dukanos_finance_ledger';

export const INITIAL_FINANCE_ENTRIES: FinanceLedgerItem[] = [
  {
    id: 1,
    category: 'Customer Recovery',
    type: 'income',
    amount: 45000,
    description: 'Khata credit recovery - Chaudhry Bilal (Contractor)',
    date: '2026-09-02',
    payment_method: 'bank_transfer',
    customer_id: 1,
    customer_name: 'Chaudhry Bilal (Contractor)',
    reference_no: 'REC-2026-0042',
    created_at: '2026-09-02T10:15:00Z',
  },
  {
    id: 2,
    category: 'Customer Payments',
    type: 'income',
    amount: 68450,
    description: 'POS Counter cash and bank payments',
    date: '2026-09-02',
    payment_method: 'cash',
    reference_no: 'POS-2026-0902',
    created_at: '2026-09-02T16:45:00Z',
  },
  {
    id: 3,
    category: 'Electricity Bill',
    type: 'expense',
    amount: 34200,
    description: 'LESCO Commercial Meter Bill for August',
    date: '2026-09-01',
    payment_method: 'bank_transfer',
    reference_no: 'LESCO-991204',
    created_at: '2026-09-01T11:20:00Z',
  },
  {
    id: 4,
    category: 'Shop Rent',
    type: 'expense',
    amount: 85000,
    description: 'Plaza ground floor advance rent',
    date: '2026-09-01',
    payment_method: 'cheque',
    reference_no: 'CHQ-448102',
    created_at: '2026-09-01T09:00:00Z',
  },
  {
    id: 5,
    category: 'Customer Recovery',
    type: 'income',
    amount: 32000,
    description: 'Khata recovery - Tariq Electric Works',
    date: '2026-08-30',
    payment_method: 'cash',
    customer_id: 2,
    customer_name: 'Tariq Electric Works',
    reference_no: 'REC-2026-0039',
    created_at: '2026-08-30T14:10:00Z',
  },
];

function getStoredTransactions(): FinanceLedgerItem[] {
  if (typeof window === 'undefined') return INITIAL_FINANCE_ENTRIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FINANCE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FINANCE, JSON.stringify(INITIAL_FINANCE_ENTRIES));
      return INITIAL_FINANCE_ENTRIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FINANCE_ENTRIES;
  } catch {
    return INITIAL_FINANCE_ENTRIES;
  }
}

function saveStoredTransactions(transactions: FinanceLedgerItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_FINANCE, JSON.stringify(transactions));
  } catch {
    // ignore
  }
}

export const financeService = {
  async getTransactions(): Promise<ApiResponse<FinanceLedgerItem[]>> {
    try {
      const res = await apiClient.get<FinanceLedgerItem[]>('/finance');
      if (res && res.data && res.data.length > 0) {
        saveStoredTransactions(res.data);
        return res;
      }
    } catch {
      // offline fallback
    }
    return { data: getStoredTransactions(), status: 200, message: 'Loaded ledger from local storage' };
  },

  async createTransaction(
    item: Omit<FinanceLedgerItem, 'id' | 'created_at'>
  ): Promise<ApiResponse<FinanceLedgerItem>> {
    const transactions = getStoredTransactions();
    const newEntry: FinanceLedgerItem = {
      ...item,
      id: Math.max(0, ...transactions.map((t) => t.id)) + 1,
      created_at: new Date().toISOString(),
    };

    const updated = [newEntry, ...transactions];
    saveStoredTransactions(updated);

    // Attempt backend sync
    try {
      await apiClient.post<FinanceLedgerItem>('/finance', item);
    } catch {
      // offline
    }

    return { data: newEntry, status: 201, message: 'Transaction posted successfully' };
  },

  async recordRecovery(params: {
    customer_id?: number;
    customer_name: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'online';
    reference_no?: string;
    notes?: string;
    date?: string;
  }): Promise<ApiResponse<FinanceLedgerItem>> {
    const dateStr = params.date || new Date().toISOString().split('T')[0];
    const refNo = params.reference_no || `REC-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newTx: Omit<FinanceLedgerItem, 'id' | 'created_at'> = {
      category: 'Customer Recovery',
      type: 'income',
      amount: Number(params.amount),
      description: params.notes || `Recovery from ${params.customer_name}`,
      date: dateStr,
      payment_method: params.payment_method,
      reference_no: refNo,
      customer_id: params.customer_id,
      customer_name: params.customer_name,
    };

    const res = await this.createTransaction(newTx);

    // If a linked customer exists, deduct from their current balance
    if (params.customer_id) {
      await customerService.recordRecovery(params.customer_id, Number(params.amount));
    }

    return res;
  },

  async deleteTransaction(id: number): Promise<ApiResponse<boolean>> {
    const transactions = getStoredTransactions();
    const updated = transactions.filter((t) => t.id !== id);
    saveStoredTransactions(updated);

    try {
      await apiClient.delete(`/finance/${id}`);
    } catch {
      // offline
    }

    return { data: true, status: 200, message: 'Transaction removed' };
  },
};
