import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api.types';
import type { Invoice, Quotation } from '../types/invoice.types';

const STORAGE_KEY_QUOTATIONS = 'dukanos_quotations';

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 1,
    quotation_number: 'QTN-2026-0042',
    customer: { id: 1, name: 'Chaudhry Bilal (Contractor)', status: 'active', current_balance: 0 },
    quotation_date: '2026-09-02',
    valid_until: '2026-09-15',
    status: 'sent',
    subtotal: 185000,
    discount_amount: 5000,
    total_amount: 180000,
    items: [
      { id: 1, product_id: 1, product_name: 'Royal Deluxe Fan 56"', sku: 'ROY-FAN-56', unit_price: 9500, quantity: 10, discount_amount: 0, total_price: 95000 },
      { id: 2, product_id: 2, product_name: 'Pakistan Cables 7/29 Single Core Red 90m', sku: 'PAK-CAB-729R', unit_price: 14500, quantity: 6, discount_amount: 5000, total_price: 82000 },
    ],
    notes: '50% advance on order confirmation, delivery within 48 hours.',
    created_at: '2026-09-02T05:00:00Z',
  },
  {
    id: 2,
    quotation_number: 'QTN-2026-0041',
    customer: { id: 2, name: 'Al-Madina Construction', status: 'active', current_balance: 0 },
    quotation_date: '2026-09-01',
    valid_until: '2026-09-10',
    status: 'draft',
    subtotal: 64000,
    discount_amount: 0,
    total_amount: 64000,
    items: [
      { id: 3, product_id: 5, product_name: 'Pak Fan Bracket Fan 18" Remote Control', sku: 'PAK-FAN-18B', unit_price: 12800, quantity: 5, discount_amount: 0, total_price: 64000 },
    ],
    notes: 'Price valid for 10 days.',
    created_at: '2026-09-01T14:30:00Z',
  },
];

function getStoredQuotations(): Quotation[] {
  if (typeof window === 'undefined') return INITIAL_QUOTATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUOTATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
      return INITIAL_QUOTATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_QUOTATIONS;
  } catch {
    return INITIAL_QUOTATIONS;
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

const STORAGE_KEY_INVOICES = 'dukanos_invoices';

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 1,
    invoice_number: 'INV-2026-0094',
    customer_id: 1,
    customer: { id: 1, name: 'Al-Madina Construction', status: 'active', current_balance: 0 },
    invoice_date: '2026-09-02',
    status: 'issued',
    payment_status: 'paid',
    subtotal: 145000,
    discount_amount: 0,
    total_amount: 145000,
    paid_amount: 145000,
    balance_amount: 0,
    payment_method: 'cash',
    items: [
      { id: 1, product_id: 1, product_name: 'Royal Deluxe Fan 56"', sku: 'ROY-FAN-56', unit_price: 9500, quantity: 10, discount_amount: 0, total_price: 95000 },
      { id: 2, product_id: 3, product_name: 'Philips LED Bulb 18W Cool Daylight E27', sku: 'PHI-LED-18W', unit_price: 650, quantity: 50, discount_amount: 0, total_price: 32500 },
      { id: 3, product_id: 4, product_name: 'Schneider Electric Switch Socket 13A White', sku: 'SCH-SW-13A', unit_price: 850, quantity: 20, discount_amount: 0, total_price: 17500 },
    ],
    created_at: '2026-09-02T06:45:00Z',
  },
  {
    id: 2,
    invoice_number: 'INV-2026-0093',
    customer_id: 2,
    customer: { id: 2, name: 'Tariq Electric Works', status: 'active', current_balance: 18500 },
    invoice_date: '2026-09-02',
    status: 'issued',
    payment_status: 'partial',
    subtotal: 38500,
    discount_amount: 0,
    total_amount: 38500,
    paid_amount: 20000,
    balance_amount: 18500,
    payment_method: 'bank_transfer',
    items: [
      { id: 4, product_id: 2, product_name: 'Pakistan Cables 7/29 Single Core Red 90m', sku: 'PAK-CAB-729R', unit_price: 14500, quantity: 2, discount_amount: 0, total_price: 29000 },
      { id: 5, product_id: 1, product_name: 'Royal Deluxe Fan 56"', sku: 'ROY-FAN-56', unit_price: 9500, quantity: 1, discount_amount: 0, total_price: 9500 },
    ],
    created_at: '2026-09-02T06:12:00Z',
  },
  {
    id: 3,
    invoice_number: 'INV-2026-0092',
    customer_id: undefined,
    customer: { id: 0, name: 'Walk-in Customer', status: 'active', current_balance: 0 },
    invoice_date: '2026-09-02',
    status: 'issued',
    payment_status: 'paid',
    subtotal: 6200,
    discount_amount: 0,
    total_amount: 6200,
    paid_amount: 6200,
    balance_amount: 0,
    payment_method: 'cash',
    items: [
      { id: 6, product_id: 3, product_name: 'Philips LED Bulb 18W Cool Daylight E27', sku: 'PHI-LED-18W', unit_price: 650, quantity: 8, discount_amount: 0, total_price: 5200 },
      { id: 7, product_id: 4, product_name: 'Schneider Electric Switch Socket 13A White', sku: 'SCH-SW-13A', unit_price: 1000, quantity: 1, discount_amount: 0, total_price: 1000 },
    ],
    created_at: '2026-09-02T05:30:00Z',
  },
  {
    id: 4,
    invoice_number: 'INV-2026-0091',
    customer_id: 1,
    customer: { id: 1, name: 'Chaudhry Bilal (Contractor)', status: 'active', current_balance: 92400 },
    invoice_date: '2026-09-01',
    status: 'issued',
    payment_status: 'ledger',
    subtotal: 92400,
    discount_amount: 0,
    total_amount: 92400,
    paid_amount: 0,
    balance_amount: 92400,
    payment_method: 'ledger',
    items: [
      { id: 8, product_id: 2, product_name: 'Pakistan Cables 7/29 Single Core Red 90m', sku: 'PAK-CAB-729R', unit_price: 14500, quantity: 6, discount_amount: 0, total_price: 87000 },
      { id: 9, product_id: 4, product_name: 'Schneider Electric Switch Socket 13A White', sku: 'SCH-SW-13A', unit_price: 900, quantity: 6, discount_amount: 0, total_price: 5400 },
    ],
    created_at: '2026-09-01T11:00:00Z',
  },
];

function getStoredInvoices(): Invoice[] {
  if (typeof window === 'undefined') return INITIAL_INVOICES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INVOICES;
  } catch {
    return INITIAL_INVOICES;
  }
}

export const invoiceService = {
  async getAll(): Promise<ApiResponse<Invoice[]>> {
    try {
      const res = await apiClient.get<Invoice[]>('/invoices');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
    } catch {
      // offline fallback
    }
    return {
      success: true,
      message: 'Invoices retrieved successfully',
      data: getStoredInvoices(),
    };
  },

  async getQuotations(): Promise<ApiResponse<Quotation[]>> {
    try {
      const res = await apiClient.get<Quotation[]>('/quotations');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        saveStoredQuotations(res.data);
        return res;
      }
    } catch {
      // Offline fallback
    }

    const localData = getStoredQuotations();
    return {
      success: true,
      message: 'Quotations retrieved successfully',
      data: localData,
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
      const res = await apiClient.post<Quotation>('/quotations', data);
      if (res && res.data) {
        const saved = res.data;
        const updated = [saved, ...current.filter((q) => q.id !== saved.id)];
        saveStoredQuotations(updated);
        return res;
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

  async convertQuotationToInvoice(quotationId: number): Promise<ApiResponse<{ invoice_number: string }>> {
    const current = getStoredQuotations();
    const quote = current.find((q) => q.id === quotationId);
    if (quote) {
      quote.status = 'converted';
      saveStoredQuotations([...current]);
    }

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    return {
      success: true,
      message: `Quotation converted to Invoice #${invoiceNumber}`,
      data: { invoice_number: invoiceNumber },
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
};

