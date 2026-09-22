import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Invoice, Quotation } from '../types/invoice.types';
import type { Customer } from '../types/customer.types';

const STORAGE_KEY_QUOTATIONS = 'dukanos_quotations_v5';

export const INITIAL_QUOTATIONS: Quotation[] = [];

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

function lastPageOf(payload: unknown): number {
  const rec = asRecord(payload);
  const meta = asRecord(rec.meta);
  return Math.max(1, asNumber(meta.last_page) || 1);
}

function mapQuotation(raw: unknown): Quotation {
  const r = asRecord(raw);
  const rawCustomer = asRecord(r.customer);
  const customer: Customer | undefined =
    Object.keys(rawCustomer).length > 0
      ? {
          id: asNumber(rawCustomer.id),
          name: asString(rawCustomer.name, 'Walk-in'),
          phone: asString(rawCustomer.phone) || undefined,
          status: (asString(rawCustomer.status, 'active') as Customer['status']),
          current_balance: asNumber(rawCustomer.current_balance ?? rawCustomer.opening_balance),
        }
      : undefined;

  const rawItems = Array.isArray(r.items) ? r.items : [];

  return {
    id: asNumber(r.id),
    quotation_number: asString(r.quotation_number),
    customer_id: asNumber(r.customer_id) || customer?.id,
    customer,
    quotation_date: asString(r.quotation_date),
    valid_until: asString(r.valid_until),
    status: asString(r.status, 'sent') as Quotation['status'],
    subtotal: asNumber(r.subtotal),
    discount_type: (asString(r.discount_type) || undefined) as Quotation['discount_type'],
    discount_value: asNumber(r.discount_value),
    discount_amount: asNumber(r.discount_amount),
    total_amount: asNumber(r.total_amount ?? r.total),
    notes: asString(r.notes),
    items: rawItems.map((item, idx) => {
      const i = asRecord(item);
      const unitPrice = asNumber(i.unit_price);
      const quantity = asNumber(i.quantity);
      return {
        id: asNumber(i.id) || idx + 1,
        product_id: asNumber(i.product_id),
        product_name: asString(i.product_name) || asString(i.name),
        sku: asString(i.sku),
        unit_price: unitPrice,
        quantity,
        discount_amount: asNumber(i.discount_amount),
        total_price: asNumber(i.total_price ?? i.line_total) || unitPrice * quantity,
      };
    }),
    created_at: asString(r.created_at, new Date().toISOString()),
  };
}

function getStoredQuotations(): Quotation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUOTATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredQuotations(quotations: Quotation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(quotations));
  } catch (err) {
    console.error('Failed to save quotations to localStorage', err);
  }
}

const STORAGE_KEY_INVOICES = 'dukanos_invoices_v5';

export const INITIAL_INVOICES: Invoice[] = [];

function getStoredInvoices(): Invoice[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapInvoice(raw: unknown): Invoice {
  const r = asRecord(raw);
  const rawCustomer = asRecord(r.customer);
  const customer: Customer | undefined =
    Object.keys(rawCustomer).length > 0
      ? {
          id: asNumber(rawCustomer.id),
          name: asString(rawCustomer.name, 'Walk-in'),
          phone: asString(rawCustomer.phone) || undefined,
          status: (asString(rawCustomer.status, 'active') as Customer['status']),
          current_balance: asNumber(rawCustomer.current_balance ?? rawCustomer.opening_balance),
        }
      : undefined;

  const rawItems = Array.isArray(r.items) ? r.items : [];

  const statusRaw = asString(r.status);
  const paymentRaw = asString(r.payment_status);

  return {
    id: asNumber(r.id),
    invoice_number: asString(r.invoice_number),
    customer_id: asNumber(r.customer_id) || customer?.id,
    customer,
    invoice_date: asString(r.invoice_date),
    status: (['draft', 'issued', 'paid', 'cancelled', 'voided'].includes(statusRaw)
      ? statusRaw
      : 'issued') as Invoice['status'],
    payment_status: (['paid', 'partial', 'unpaid', 'ledger'].includes(paymentRaw)
      ? paymentRaw
      : 'unpaid') as Invoice['payment_status'],
    subtotal: asNumber(r.subtotal),
    discount_type: (asString(r.discount_type) || undefined) as Invoice['discount_type'],
    discount_value: asNumber(r.discount_value),
    discount_amount: asNumber(r.discount_amount),
    tax_amount: asNumber(r.tax_amount),
    total_amount: asNumber(r.total_amount ?? r.total),
    paid_amount: asNumber(r.paid_amount ?? r.amount_paid),
    balance_amount: asNumber(r.balance_amount ?? r.balance_due),
    payment_method: (asString(r.payment_method, 'cash') as Invoice['payment_method']) || 'cash',
    notes: asString(r.notes),
    items: rawItems.map((item, idx) => {
      const i = asRecord(item);
      const unitPrice = asNumber(i.unit_price);
      const quantity = asNumber(i.quantity);
      return {
        id: asNumber(i.id) || idx + 1,
        product_id: asNumber(i.product_id),
        product_name: asString(i.product_name) || asString(i.name),
        sku: asString(i.sku),
        unit_price: unitPrice,
        quantity,
        discount_amount: asNumber(i.discount_amount),
        total_price: asNumber(i.total_price ?? i.line_total) || unitPrice * quantity,
      };
    }),
    created_at: asString(r.created_at, new Date().toISOString()),
  };
}

export const invoiceService = {
  async getAll(): Promise<ApiResponse<Invoice[]>> {
    try {
      const all: Invoice[] = [];
      let page = 1;
      let lastPage = 1;
      do {
        const res = await apiClient.get<unknown>(`/invoices?per_page=100&page=${page}`);
        all.push(...unwrapList<unknown>(res?.data).map(mapInvoice));
        lastPage = lastPageOf(res?.data);
        page += 1;
      } while (page <= lastPage && page <= 200);

      saveStoredInvoices(all);
      return {
        success: true,
        message: 'Invoices retrieved successfully',
        data: all,
      };
    } catch {
      // offline fallback only when the API is unreachable
      return {
        success: true,
        message: 'Invoices retrieved successfully',
        data: getStoredInvoices(),
      };
    }
  },

  async getQuotations(): Promise<ApiResponse<Quotation[]>> {
    try {
      const res = await apiClient.get<unknown>('/quotations');
      const list = unwrapList<unknown>(res?.data).map(mapQuotation);
      saveStoredQuotations(list);
      return {
        success: true,
        message: res?.message || 'Quotations retrieved successfully',
        data: list,
      };
    } catch {
      // offline fallback
    }
    return {
      success: true,
      message: 'Quotations retrieved successfully',
      data: getStoredQuotations(),
    };
  },

  async createQuotation(data: Partial<Quotation>): Promise<ApiResponse<Quotation>> {
    const current = getStoredQuotations();
    const newId = current.length > 0 ? Math.max(...current.map((q) => q.id)) + 1 : 1;
    const subtotal = data.items?.reduce((sum, item) => sum + (item.total_price || item.unit_price * item.quantity), 0) || Number(data.subtotal) || 0;
    const discount = Number(data.discount_amount) || 0;
    const total = Math.max(0, subtotal - discount);

    const newQuotation: Quotation = {
      id: newId,
      quotation_number: data.quotation_number || `QTN-2026-00${40 + newId}`,
      customer_id: data.customer_id,
      customer: data.customer || { id: 0, name: 'Walk-in Customer', status: 'active', current_balance: 0 },
      quotation_date: data.quotation_date || new Date().toISOString().split('T')[0],
      valid_until: data.valid_until || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: data.status || 'sent',
      subtotal,
      discount_amount: discount,
      total_amount: total,
      notes: data.notes || '',
      items: data.items || [],
      created_at: new Date().toISOString(),
    };

    try {
      const res = await apiClient.post<unknown>('/quotations', data);
      if (res && res.data) {
        const saved = mapQuotation(res.data);
        const updated = [saved, ...current.filter((q) => q.id !== saved.id)];
        saveStoredQuotations(updated);
        return {
          success: true,
          message: res?.message || 'Quotation created successfully',
          data: saved,
        };
      }
    } catch {
      // Fallback to local storage
    }

    const updated = [newQuotation, ...current];
    saveStoredQuotations(updated);

    return {
      success: true,
      message: 'Quotation created successfully',
      data: newQuotation,
    };
  },

  async convertQuotationToInvoice(
    quotationId: number
  ): Promise<ApiResponse<{ invoice_number: string; invoice?: Invoice }>> {
    const current = getStoredQuotations();
    const quote = current.find((q) => q.id === quotationId);

    const markConverted = (): void => {
      if (quote) {
        quote.status = 'converted';
        saveStoredQuotations([...current]);
      }
    };

    try {
      const res = await apiClient.post<unknown>(`/quotations/${quotationId}/convert`, {});
      if (res && res.data) {
        const invoice = mapInvoice(res.data);
        saveStoredInvoices([invoice, ...getStoredInvoices().filter((i) => i.id !== invoice.id)]);
        markConverted();
        return {
          success: true,
          message: res.message || `Quotation converted to Invoice #${invoice.invoice_number}`,
          data: { invoice_number: invoice.invoice_number, invoice },
        };
      }
    } catch {
      // offline fallback below
    }

    const fallback = await this.createInvoice({
      customer_id: quote?.customer_id,
      customer: quote?.customer,
      invoice_date: new Date().toISOString().split('T')[0],
      status: 'issued',
      payment_status: 'paid',
      subtotal: quote?.subtotal,
      discount_amount: quote?.discount_amount,
      total_amount: quote?.total_amount,
      notes: quote?.notes,
      items: quote?.items,
    });
    markConverted();

    return {
      success: true,
      message: fallback.message,
      data: {
        invoice_number: fallback.data?.invoice_number || '',
        invoice: fallback.data,
      },
    };
  },

  async deleteQuotation(id: number): Promise<ApiResponse<void>> {
    const current = getStoredQuotations();
    saveStoredQuotations(current.filter((q) => q.id !== id));
    return {
      success: true,
      message: 'Quotation deleted successfully',
    };
  },

  async createInvoice(data: Partial<Invoice>): Promise<ApiResponse<Invoice>> {
    const current = getStoredInvoices();
    const newId = current.length > 0 ? Math.max(...current.map((i) => i.id)) + 1 : 1;
    const items = data.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const discount = Number(data.discount_amount) || 0;
    const total = Math.max(0, subtotal - discount);

    const newInvoice: Invoice = {
      id: newId,
      invoice_number:
        data.invoice_number ||
        `INV-${new Date().getFullYear()}-${String(100 + newId).slice(1)}`,
      customer_id: data.customer_id,
      customer: data.customer || { id: 0, name: 'Walk-in Customer', status: 'active', current_balance: 0 },
      invoice_date: data.invoice_date || new Date().toISOString().split('T')[0],
      status: 'issued',
      payment_status: data.payment_status || 'paid',
      subtotal,
      discount_amount: discount,
      total_amount: total,
      paid_amount: Number.isFinite(Number(data.paid_amount)) ? Number(data.paid_amount) : total,
      balance_amount: Math.max(
        0,
        total - (Number.isFinite(Number(data.paid_amount)) ? Number(data.paid_amount) : total)
      ),
      payment_method: data.payment_method || 'cash',
      notes: data.notes || '',
      items,
      created_at: new Date().toISOString(),
    };

    try {
      const paidAmount = Number.isFinite(Number(data.paid_amount)) ? Number(data.paid_amount) : 0;
      const discountAmount = Number(data.discount_amount) || 0;

      const apiPayload: Record<string, unknown> = {
        customer_id: data.customer_id,
        invoice_date: data.invoice_date,
        notes: data.notes,
        amount_paid: Math.max(0, paidAmount),
        items: (data.items || []).map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: Number(item.unit_price) || 0,
          ...(Number(item.discount_amount) > 0
            ? { discount_type: 'fixed', discount_value: Number(item.discount_amount) }
            : {}),
        })),
      };

      if (data.payment_method) apiPayload.payment_method = data.payment_method;
      if (discountAmount > 0) {
        apiPayload.discount_type = 'fixed';
        apiPayload.discount_value = discountAmount;
      }

      const res = await apiClient.post<Invoice>('/invoices', apiPayload);
      if (res && res.data) {
        const saved = res.data;
        saveStoredInvoices([saved, ...current.filter((i) => i.id !== saved.id)]);
        return res;
      }
    } catch {
      // fallback to local storage
    }

    saveStoredInvoices([newInvoice, ...current]);
    return {
      success: true,
      message: 'Invoice created successfully',
      data: newInvoice,
    };
  },
};

function saveStoredInvoices(invoices: Invoice[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
  } catch {
    // ignore
  }
}

