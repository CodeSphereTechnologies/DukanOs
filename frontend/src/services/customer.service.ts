import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Customer, CustomerLedgerEntry } from '../types/customer.types';

export const STORAGE_KEY_CUSTOMERS = 'dukanos_customers';
export const STORAGE_KEY_CUSTOMER_LEDGER = 'dukanos_customer_ledger';

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Chaudhry Bilal (Contractor)', phone: '+92 300 1234567', email: 'bilal@contractors.pk', address: 'Model Town, Lahore', current_balance: 142000, status: 'active' },
  { id: 2, name: 'Tariq Electric Works', phone: '+92 321 9876543', email: 'tariq@electric.pk', address: 'Brandreth Road, Lahore', current_balance: 98500, status: 'active' },
  { id: 3, name: 'Al-Madina Construction', phone: '+92 300 7654321', email: 'madina@builders.pk', address: 'DHA Phase 5, Lahore', current_balance: 0, status: 'active' },
  { id: 4, name: 'Malik Wiring & Hardware', phone: '+92 333 4567890', email: 'malik@wiring.pk', address: 'Shah Alam Market, Lahore', current_balance: 67200, status: 'active' },
];

function getStoredCustomers(): Customer[] {
  if (typeof window === 'undefined') return INITIAL_CUSTOMERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CUSTOMERS;
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

function saveStoredCustomers(customers: Customer[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
  } catch {
    // ignore
  }
}

function getStoredLedger(): CustomerLedgerEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMER_LEDGER);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredLedger(entries: CustomerLedgerEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMER_LEDGER, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export const customerService = {
  async getAll(): Promise<ApiResponse<Customer[]>> {
    try {
      const res = await apiClient.get<Customer[]>('/customers');
      if (res && res.data && res.data.length > 0) {
        saveStoredCustomers(res.data);
        return res;
      }
    } catch {
      // offline fallback
    }
    return { data: getStoredCustomers(), status: 200, message: 'Loaded from local storage' };
  },

  async getById(id: number): Promise<Customer | null> {
    const list = getStoredCustomers();
    return list.find((c) => c.id === id) || null;
  },

  async recordRecovery(customerId: number, recoveryAmount: number): Promise<Customer | null> {
    const list = getStoredCustomers();
    const idx = list.findIndex((c) => c.id === customerId);
    if (idx >= 0) {
      const current = list[idx].current_balance || 0;
      list[idx] = {
        ...list[idx],
        current_balance: Math.max(0, current - recoveryAmount),
      };
      saveStoredCustomers(list);
      return list[idx];
    }
    return null;
  },

  async saveCustomer(customer: Omit<Customer, 'id'> & { id?: number }): Promise<Customer> {
    const list = getStoredCustomers();
    const newCust: Customer = {
      ...customer,
      id: customer.id || Math.max(0, ...list.map((c) => c.id)) + 1,
    };
    const updated = [newCust, ...list.filter((c) => c.id !== newCust.id)];
    saveStoredCustomers(updated);
    return newCust;
  },

  async deleteCustomer(id: number): Promise<void> {
    const list = getStoredCustomers();
    saveStoredCustomers(list.filter((c) => c.id !== id));
  },

  async findByNameOrPhone(query: string): Promise<Customer[]> {
    const list = getStoredCustomers();
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, '')))
    );
  },

  async updateBalance(customerId: number, addAmount: number): Promise<Customer | null> {
    const list = getStoredCustomers();
    const idx = list.findIndex((c) => c.id === customerId);
    if (idx < 0) return null;
    const current = list[idx].current_balance || 0;
    list[idx] = {
      ...list[idx],
      current_balance: Math.max(0, current + addAmount),
    };
    saveStoredCustomers(list);
    return list[idx];
  },

  async recordLedgerEntry(entry: Omit<CustomerLedgerEntry, 'id'>): Promise<CustomerLedgerEntry> {
    const ledger = getStoredLedger();
    const newEntry: CustomerLedgerEntry = {
      ...entry,
      id: ledger.length > 0 ? Math.max(...ledger.map((e) => e.id)) + 1 : 1,
    };
    saveStoredLedger([newEntry, ...ledger]);
    return newEntry;
  },

  async getLedger(customerId?: number): Promise<ApiResponse<CustomerLedgerEntry[]>> {
    try {
      if (customerId) {
        return await apiClient.get<CustomerLedgerEntry[]>(`/customers/${customerId}/ledger`);
      }
    } catch {
      // offline
    }
    const local = getStoredLedger();
    const filtered = customerId ? local.filter((e) => e.customer_id === customerId) : local;
    return { data: filtered, status: 200, message: 'Loaded from local storage' };
  },
};

