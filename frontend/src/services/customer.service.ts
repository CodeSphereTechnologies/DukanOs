import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Customer, CustomerLedgerEntry } from '../types/customer.types';

export const STORAGE_KEY_CUSTOMERS = 'dukanos_customers_v5';
export const STORAGE_KEY_CUSTOMER_LEDGER = 'dukanos_customer_ledger_v5';

export const INITIAL_CUSTOMERS: Customer[] = [];

function getStoredCustomers(): Customer[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

// Backend list endpoints return either a plain array or a paginated { data: [...] } wrapper.
function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const rec = asRecord(payload);
  if (Array.isArray(rec.data)) return rec.data as T[];
  return [];
}

function mapCustomer(raw: unknown): Customer {
  const r = asRecord(raw);
  return {
    id: asNumber(r.id),
    name: asString(r.name, ''),
    phone: asString(r.phone) || undefined,
    email: asString(r.email) || undefined,
    address: asString(r.address) || undefined,
    city: asString(r.city) || undefined,
    current_balance: asNumber(r.current_balance ?? r.opening_balance ?? r.balance),
    status: (asString(r.status, 'active') as Customer['status']) || 'active',
    created_at: asString(r.created_at) || undefined,
  };
}

export const customerService = {
  async getAll(): Promise<ApiResponse<Customer[]>> {
    try {
      const res = await apiClient.get<unknown>('/customers');
      const list = unwrapList<unknown>(res?.data).map(mapCustomer);
      saveStoredCustomers(list);
      return {
        success: true,
        message: res?.message || 'Customers retrieved successfully',
        data: list,
      };
    } catch {
      // offline fallback
    }
    return { data: getStoredCustomers(), status: 200, message: 'Loaded from local storage' };
  },

  async getById(id: number): Promise<Customer | null> {
    try {
      const res = await apiClient.get<unknown>(`/customers/${id}`);
      if (res && res.data) return mapCustomer(res.data);
    } catch {
      // offline fallback
    }
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

    try {
      if (customer.id) {
        const res = await apiClient.put<unknown>(`/customers/${customer.id}`, {
          name: customer.name,
          phone: customer.phone || null,
          email: customer.email || null,
          address: customer.address || null,
          opening_balance: customer.current_balance ?? 0,
          status: customer.status || 'active',
        });
        if (res && res.data) {
          const backend = mapCustomer(res.data);
          const updated = [backend, ...list.filter((c) => c.id !== backend.id)];
          saveStoredCustomers(updated);
          return backend;
        }
      } else {
        const res = await apiClient.post<unknown>('/customers', {
          name: customer.name,
          phone: customer.phone || null,
          email: customer.email || null,
          address: customer.address || null,
          notes: null,
          opening_balance: customer.current_balance || 0,
          status: customer.status || 'active',
        });
        if (res && res.data) {
          const backend = mapCustomer(res.data);
          const updated = [backend, ...list.filter((c) => c.id !== backend.id)];
          saveStoredCustomers(updated);
          return backend;
        }
      }
    } catch {
      // offline fallback to local storage
    }

    const updated = [newCust, ...list.filter((c) => c.id !== newCust.id)];
    saveStoredCustomers(updated);
    return newCust;
  },

  async deleteCustomer(id: number): Promise<void> {
    try {
      await apiClient.delete(`/customers/${id}`);
    } catch {
      // offline fallback to local storage
    }
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
        const res = await apiClient.get<unknown>(`/customers/${customerId}/ledger`);
        const list = unwrapList<unknown>(res?.data).map((raw) => {
          const r = asRecord(raw);
          const debit = asNumber(r.debit);
          const credit = asNumber(r.credit);
          const balance = asNumber(r.balance ?? r.running_balance);
          return {
            id: asNumber(r.id),
            customer_id: asNumber(r.customer_id) || customerId,
            invoice_id: r.invoice_id === undefined || r.invoice_id === null ? null : asNumber(r.invoice_id),
            transaction_type: (debit > 0 ? 'debit' : 'credit') as CustomerLedgerEntry['transaction_type'],
            amount: debit > 0 ? debit : credit,
            running_balance: balance,
            description: asString(r.notes, asString(r.entry_type, 'Ledger entry')),
            date: asString(r.entry_date, asString(r.date, new Date().toISOString().split('T')[0])),
          };
        });
        if (list.length > 0) {
          return {
            success: true,
            message: res?.message || 'Customer ledger retrieved',
            data: list,
          };
        }
      }
    } catch {
      // offline
    }
    const local = getStoredLedger();
    const filtered = customerId ? local.filter((e) => e.customer_id === customerId) : local;
    return { data: filtered, status: 200, message: 'Loaded from local storage' };
  },
};

