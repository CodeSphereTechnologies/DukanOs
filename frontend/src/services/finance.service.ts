import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import { customerService } from './customer.service';
import { unwrapList } from '../lib/utils';

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

export const STORAGE_KEY_FINANCE = 'dukanos_finance_ledger_v5';

export const INITIAL_FINANCE_ENTRIES: FinanceLedgerItem[] = [];

function getStoredTransactions(): FinanceLedgerItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FINANCE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
      // Paginated endpoints nest the rows in { data: [...] }.
      const res = await apiClient.get<unknown>('/finance');
      const list = unwrapList<FinanceLedgerItem>(res?.data);
      if (list.length > 0) {
        saveStoredTransactions(list);
        return { ...res, data: list };
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
